# Account Management, Password Change & File Uploads

Welcome to Part 11! Today you added **refresh token rotation**, **password change**, **account update**, **avatar/cover image upload**, and a **subscription model**. Let's break down each new feature.

---

## 1. Today's Commits Overview

| Commit    | Description                                |
| --------- | ------------------------------------------ |
| `117c905` | Refresh token endpoint + code formatting   |
| `16f8ad2` | Subscription model (subscriber/channel)    |
| `c77a987` | Change password + get current user         |
| `baaa9f4` | Account update + avatar/cover image upload |
| `090da7e` | Clean up commented-out code                |

**Files changed:** `user.controller.js` (+254 lines), `subscription.model.js` (new), `user.route.js`

---

## 2. Refresh Access Token — `refreshAccessToken`

```javascript
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) throw new ApiError(401, "invalid refresh Token");

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?.id);

    if (!user) throw new ApiError(401, "invalid refresh token");

    if (incomingRefreshToken !== user.refreshToken)
      throw new ApiError(401, "invalid refresh token");

    const { accessToken, newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    // Set new cookies & respond
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
});
```

### Refresh Token Flow:

```
Access Token Expired
        │
        ▼
Refresh request ──▶ Extract refreshToken ──▶ Verify JWT ──▶ Find user
(cookie or body)    (REFRESH_TOKEN_SECRET)   (decoded.id)       │
                                                                │
                                        ◀──── Compare DB token ─┘
                                              │ match?
                                              ▼
                                   Generate new tokens ──▶ Save new refreshToken in DB
                                              │
                                              ▼
                                   Set new cookies + respond
```

### Why two checks on the refresh token?

| Check                                        | Purpose                                                     |
| -------------------------------------------- | ----------------------------------------------------------- |
| `jwt.verify()`                               | Validates the token hasn't been tampered with or expired    |
| `incomingRefreshToken !== user.refreshToken` | Ensures token wasn't already used (prevents replay attacks) |

### `generateAccessAndRefreshTokens` returns `newRefreshToken`

The existing function was reused, but note that the destructured name was changed:

```javascript
// Before (in login):   const { accessToken, refreshToken } = ...
// After (in refresh):  const { accessToken, newRefreshToken } = ...
```

This is just a variable rename — the function still returns `{ accessToken, refreshToken }`.

---

## 3. Change Password — `changePassword`

```javascript
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isOldPasswordValid) throw new ApiError(401, "Invalid old password");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});
```

### Flow:

```
Request (verifyJWT → req.user set)
        │
        ▼
  Get oldPassword + newPassword from req.body
        │
        ▼
  Find user by req.user._id
        │
        ▼
  Compare oldPassword with DB hash
        │
        ▼
  Set user.password = newPassword → pre("save") hook hashes it
        │
        ▼
  user.save({ validateBeforeSave: false }) — skip full validation
```

### Why `validateBeforeSave: false`?

The user schema has `required: true` on fields like `username`, `email`, etc. When we only want to update the password, we skip validation for those other fields so the save doesn't fail.

### How the password gets hashed:

```javascript
// user.model.js — pre-save hook
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});
```

Setting `user.password = newPassword` triggers `isModified("password")` → the hook hashes it automatically.

---

## 4. Get Current User — `getCurrentUser`

```javascript
const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(404, "User not found");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: req.user },
        "Current user fetched successfully"
      )
    );
});
```

**Extremely simple** — it just returns whatever `req.user` contains. The `verifyJWT` middleware already fetched the user and attached it to `req.user` with `.select("-password -refreshToken")`.

---

## 5. Update Account Details — `updateAccountDetails`

```javascript
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName || !email) throw new ApiError(400, "All fields are required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullName, email } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});
```

### Key details:

| Aspect                 | Explanation                                            |
| ---------------------- | ------------------------------------------------------ |
| `findByIdAndUpdate`    | Directly updates in DB, returns updated doc            |
| `$set`                 | Only updates specified fields, leaves others untouched |
| `{ new: true }`        | Returns the **updated** document (not the old one)     |
| `.select("-password")` | Excludes password from response                        |

### Why `$set` instead of assigning directly?

```javascript
// Using $set:
{
  $set: {
    (fullName, email);
  }
}

// Instead of:
user.fullName = fullName;
user.email = email;
await user.save();
```

`$set` is a MongoDB update operator. It's more efficient — single DB operation instead of find + save.

---

## 6. Update Avatar & Cover Image — `updateUserAvatar` / `updateUserCoverImage`

```javascript
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is missing");

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) throw new ApiError(500, "Error uploading avatar");

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});
```

### Flow:

```
Request (verifyJWT + multer middleware)
        │
        ▼
  req.file is set by multer (single file upload)
        │
        ▼
  Extract file path from req.file?.path
        │
        ▼
  Upload to Cloudinary → get url
        │
        ▼
  Update user document with new URL
        │
        ▼
  Respond with updated user
```

### `req.file` vs `req.files`:

| Context  | Property    | When                                                       |
| -------- | ----------- | ---------------------------------------------------------- |
| Register | `req.files` | Multiple files (avatar + coverImage via `upload.fields()`) |
| Update   | `req.file`  | Single file (avatar OR coverImage via `upload.single()`)   |

### Route setup for single file upload:

```
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
```

---

## 7. Subscription Model

```javascript
const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // one who is subscribing
    },
    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // one who is being subscribed to
    },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
```

### Understanding the Model:

```
Subscriber (User A) ──subscribes──▶ Channel (User B)
     │                                      │
     ▼                                      ▼
{ subscriber: UserA_id, channel: UserB_id }
```

### Self-referencing (both fields point to "User"):

Both `subscriber` and `channel` reference the **same** User model. This is a self-referencing relationship — a user subscribes to another user (like YouTube).

### Example queries:

```javascript
// Find all channels a user subscribes to
Subscription.find({ subscriber: userId });

// Find all subscribers of a channel
Subscription.find({ channel: channelId });

// Check if UserA is subscribed to UserB
Subscription.findOne({ subscriber: userA_id, channel: userB_id });
```

### `timestamps: true` adds:

| Field       | Description                    |
| ----------- | ------------------------------ |
| `createdAt` | When the subscription happened |
| `updatedAt` | Last updated timestamp         |

---

## 8. Code Cleanup Commit

The final commit `090da7e` removed **all commented-out code**:

- Removed the old commented `generateAccessAndRefreshTokens` function
- Removed the old commented `loginUser` function
- Fixed formatting (spacing, indentation)

**Why this matters:**

```
Before:  100+ lines of dead comments making the file 415 lines
After:   Clean, readable code — no distractions
```

Keeping commented-out code in version control is redundant — git already stores history!

---

## 9. Updated Route File

```javascript
router.route("/refresh-token").post(refreshAccessToken);
// Previously: // router.route("/refresh-token").post(refreshToken);
```

Route map after today:

| Route              | Method | Middleware                                  | Handler                |
| ------------------ | ------ | ------------------------------------------- | ---------------------- |
| `/register`        | POST   | `upload.fields()`                           | `registerUser`         |
| `/login`           | POST   | —                                           | `loginUser`            |
| `/logout`          | POST   | `verifyJWT`                                 | `logoutUser`           |
| `/refresh-token`   | POST   | —                                           | `refreshAccessToken`   |
| `/change-password` | POST   | `verifyJWT`                                 | `changePassword`       |
| `/current-user`    | GET    | `verifyJWT`                                 | `getCurrentUser`       |
| `/update-account`  | PATCH  | `verifyJWT`                                 | `updateAccountDetails` |
| `/avatar`          | PATCH  | `verifyJWT` + `upload.single("avatar")`     | `updateUserAvatar`     |
| `/cover-image`     | PATCH  | `verifyJWT` + `upload.single("coverImage")` | `updateUserCoverImage` |

---

## 10. New Exports

```diff
- export { registerUser, loginUser, logoutUser }
+ export {
+   registerUser, loginUser, logoutUser,
+   refreshAccessToken,
+   changePassword,
+   getCurrentUser,
+   updateAccountDetails,
+   updateUserAvatar,
+   updateUserCoverImage
+ }
```

---

## 11. Quick Reference

```javascript
// Refresh token
const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

// Change password (pre-save hook auto-hashes)
user.password = newPassword;
await user.save({ validateBeforeSave: false });

// Update fields with $set
await User.findByIdAndUpdate(id, { $set: { fullName, email } }, { new: true });

// Single file upload (multer)
const localPath = req.file?.path;

// Subscription query
Subscription.find({ subscriber: userId });
Subscription.find({ channel: channelId });
```

---

## 12. Practice Questions

1. Why does `refreshAccessToken` check BOTH `jwt.verify()` AND compare the token against `user.refreshToken`?
2. What happens if `validateBeforeSave: false` is NOT used in `changePassword`?
3. Why does `updateAccountDetails` use `$set` instead of assigning fields directly?
4. What is the difference between `req.file` and `req.files` in multer?
5. In the subscription model, why do both `subscriber` and `channel` reference the same `"User"` model?
6. How does the `pre("save")` hook know to hash the password when `changePassword` sets `user.password`?
7. Why was the commented-out code removed in the final commit?

---

## Key Files

| File                                         | Purpose                |
| -------------------------------------------- | ---------------------- |
| `src/controllers/user.controller.js:206-258` | Refresh access token   |
| `src/controllers/user.controller.js:260-298` | Change password        |
| `src/controllers/user.controller.js:300-315` | Get current user       |
| `src/controllers/user.controller.js:317-342` | Update account details |
| `src/controllers/user.controller.js:344-377` | Update avatar          |
| `src/controllers/user.controller.js:379-412` | Update cover image     |
| `src/models/subscription.model.js`           | Subscription schema    |
| `src/routes/user.route.js`                   | Route definitions      |

---

_You now have a full CRUD user management system — auth, profile updates, file uploads, and subscriptions. Next up: tweets, likes, comments, playlists, and the dashboard!_
