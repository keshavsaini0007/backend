# User Authentication — Register, Login, Logout

Welcome to Part 10! This covers the full authentication flow: JWT token generation, login/logout controllers, auth middleware, and the bugs you fixed along the way.

---

## 1. Authentication Flow Overview

```
Register ──▶ Login ──▶ Access Token + Refresh Token ──▶ Protected Routes (logout, etc.)
               │                                              │
               │  {accessToken, refreshToken}                  │ verifyJWT middleware
               │  + set cookies                                │ checks token
               ▼                                              ▼
         User receives                                  Access granted
```

### Three Key Parts:

| Part            | File                         | Purpose                          |
| --------------- | ---------------------------- | -------------------------------- |
| Token Generator | `user.controller.js:31-44`   | Creates access + refresh JWTs    |
| Auth Middleware | `auth.middleware.js:6-34`    | Verifies JWT on protected routes |
| Logout Handler  | `user.controller.js:172-212` | Clears tokens from DB + cookies  |

---

## 2. Token Generation — `generateAccessAndRefreshTokens`

```javascript
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken(); // calls model method
    const refreshToken = user.generateRefreshToken(); // calls model method

    user.refreshToken = refreshToken; // save refresh in DB
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};
```

### What happens step-by-step:

1. **Find user** by ID from database
2. **Call instance methods** on the user document to generate tokens
3. **Save refresh token** to user document in DB (so we can invalidate it later)
4. **Return both tokens**

**`validateBeforeSave: false`** — skips schema validations (password required, etc.) since we only update `refreshToken`, not the full document.

### Access Token (user.model.js:81-94):

```javascript
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id, // <-- "id", NOT "_id"
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};
```

### Refresh Token (user.model.js:96-106):

```javascript
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id }, // only id, no extra payload
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
  );
};
```

### Access vs Refresh Token:

| Feature  | Access Token                         | Refresh Token              |
| -------- | ------------------------------------ | -------------------------- |
| Payload  | id + email + username + fullName     | id only                    |
| Lifetime | Short (1 day)                        | Longer (7 days)            |
| Secret   | `ACCESS_TOKEN_SECRET`                | `REFRESH_TOKEN_SECRET`     |
| Sent via | Cookie `accessToken` + JSON response | Cookie `refreshToken` + DB |

---

## 3. Login Controller

```javascript
const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }], // find by either
  });

  if (!user) throw new ApiError(404, "User does not exist");

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid user credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  ); // exclude sensitive fields

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    );
});
```

### Login Flow:

```
Request Body
  { email, username, password }
        │
        ▼
  1. Validate — at least email or username required
        │
        ▼
  2. Find user — $or query matching either
        │
        ▼
  3. Verify password — user.isPasswordCorrect(password)
        │
        ▼
  4. Generate tokens — create access + refresh JWT
        │
        ▼
  5. Save refreshToken in DB — for later invalidation
        │
        ▼
  6. Fetch clean user — exclude password + refreshToken
        │
        ▼
  7. Set cookies — httpOnly, secure
        │
        ▼
  8. Respond — user data + tokens
```

### Why `$or: [{username}, {email}]` works:

This is shorthand for:

```javascript
{
  $or: [{ username: username }, { email: email }];
}
```

If `username` is `undefined` (user logged in with email only):

```javascript
{
  $or: [{ username: undefined }, { email: "test@test.com" }];
}
// Mongoose ignores { username: undefined } — only matches by email
```

---

## 4. Auth Middleware — `verifyJWT`

```javascript
export const verifyJWT = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "Unautorized request....");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // decodedToken = { id, email, username, fullName, iat, exp }

    const user = await User.findById(decodedToken?.id).select(
      "-password -refreshToken"
    );

    if (!user) throw new ApiError(401, "invalid access token");

    req.user = user; // attach to request for downstream handlers
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
```

### How it works:

```
Request ──▶ Extract token ──▶ Verify JWT ──▶ Find user ──▶ Attach to req ──▶ next()
               │                  │              │              │
          cookie OR          decodedToken     findById      req.user =
        Authorization        .id (not _id)   (not _id)      user object
```

### Token Extraction (two methods):

| Method               | Header/Field         | Format           |
| -------------------- | -------------------- | ---------------- |
| Cookie               | `accessToken` cookie | `<token>`        |
| Authorization Header | `Authorization`      | `Bearer <token>` |

### The `_id` vs `id` Bug (important!):

The token is **signed with `id`**:

```javascript
// user.model.js — generateAccessToken
jwt.sign({ id: this._id, ... }, ...)
// Mongoose's _id is aliased to id in JSON
```

But the **first version of the middleware used `_id`**:

```javascript
// BUG (first commit):
const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
console.log(decodedToken._id); // undefined!
const user = await User.findById(decodedToken?._id); // finds nothing!
```

**Fix:**

```javascript
// CORRECTED:
console.log(decodedToken.id); // works!
const user = await User.findById(decodedToken?.id); // finds user
```

### Why `id` works over `_id`:

| Property | In JWT payload   | In decoded object  |
| -------- | ---------------- | ------------------ |
| `_id`    | Not included     | `undefined`        |
| `id`     | `this._id` value | The actual user ID |

---

## 5. Logout Controller

```javascript
const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id, // user attached by verifyJWT
    { refreshToken: undefined }, // remove refresh token from DB
    { new: true }
  );

  const options = { httpOnly: true, secure: true };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "user Logged out"));
});
```

### Logout Flow:

```
Request (with valid token)
        │
        ▼
  verifyJWT middleware ──▶ req.user is set
        │
        ▼
  1. Remove refreshToken from DB — token is now useless
        │
        ▼
  2. Clear cookies on client — accessToken + refreshToken
        │
        ▼
  3. Respond success
```

### `{ new: true }` explained:

```javascript
// Without { new: true } — returns OLD document (before update)
// With { new: true } — returns NEW document (after update)
```

Here it's not strictly needed since we don't use the return value, but it's good practice.

---

## 6. Route Setup

```javascript
router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser); // protected!
```

### Middleware Stack:

| Route       | Middleware Chain                   |
| ----------- | ---------------------------------- |
| `/register` | `upload.fields()` → `registerUser` |
| `/login`    | `loginUser` (no middleware)        |
| `/logout`   | **`verifyJWT`** → `logoutUser`     |

The `verifyJWT` middleware on logout ensures only authenticated users can log out.

---

## 7. Bugs Fixed in the Second Commit

### Bug 1: `dotenv` import order in `index.js`

```diff
- import connectDB from "./db/index.js"
- import app from "./app.js";
- import dotenv from "dotenv";
+ import dotenv from "dotenv";
+ import connectDB from "./db/index.js"
+ import app from "./app.js";
```

**Why it matters:** When `app.js` evaluates, it reads `process.env.CORS_ORIGIN`. If dotenv hasn't loaded yet, env vars are `undefined`.

### Bug 2: `fullname` → `fullName` in register

```diff
- const { fullname, username, email, password } = req.body;
+ const { fullName, username, email, password } = req.body;
```

The schema uses `fullName` (camelCase), so destructuring `fullname` meant the field was always `undefined` during registration.

### Bug 3: `decodedToken._id` → `decodedToken.id` in auth middleware

```diff
- console.log(decodedToken._id)
- const user = await User.findById(decodedToken?._id)
+ console.log(decodedToken.id)
+ const user = await User.findById(decodedToken?.id)
```

The JWT payload has `id` (not `_id`), so `_id` was `undefined` → `findById(undefined)` returned `null`.

### Bug 4: Refresh token payload too large

```diff
// user.model.js — generateRefreshToken:
- { id: this._id, email, username, fullName }
+ { id: this._id }
```

Refresh tokens should carry **minimal payload** — they're used more frequently and only need the user ID to generate new access tokens.

---

## 8. Cookie Options

```javascript
const options = {
  httpOnly: true, // not accessible via JavaScript (XSS protection)
  secure: true, // only sent over HTTPS
};
```

| Option     | Purpose                                              |
| ---------- | ---------------------------------------------------- |
| `httpOnly` | Prevents client-side JS from reading the cookie      |
| `secure`   | Only sends cookie over HTTPS (disable for localhost) |

**Note:** For local development, you may need to set `secure: false` or use `sameSite: "none"`.

---

## 9. Quick Reference

```javascript
// Generate tokens
const { accessToken, refreshToken } =
  await generateAccessAndRefreshTokens(userId);

// Verify JWT
const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

// Set cookies
res.cookie("accessToken", token, { httpOnly: true, secure: true });

// Clear cookies
res.clearCookie("accessToken", { httpOnly: true, secure: true });

// Find user by either email or username
await User.findOne({ $or: [{ email }, { username }] });

// Exclude fields from query
User.findById(id).select("-password -refreshToken");

// Update without validation
user.save({ validateBeforeSave: false });
```

---

## 10. Practice Questions

1. Why does the access token include `email`, `username`, and `fullName` but the refresh token only includes `id`?
2. What happens if `validateBeforeSave: false` is NOT used when saving the refresh token?
3. Why must the logout route be protected by `verifyJWT` middleware?
4. What is the difference between `req.cookies.accessToken` and `req.header("Authorization")`?
5. Why does `decodedToken._id` return `undefined` but `decodedToken.id` works?
6. Explain the flow: what happens step-by-step when a user logs in?
7. How does setting `refreshToken: undefined` during logout prevent future token usage?

---

## Key Files

| File                                         | Purpose                           |
| -------------------------------------------- | --------------------------------- |
| `src/controllers/user.controller.js:31-44`   | Token generation function         |
| `src/controllers/user.controller.js:107-166` | Login handler                     |
| `src/controllers/user.controller.js:172-212` | Logout handler                    |
| `src/middlewares/auth.middleware.js:6-34`    | JWT verification middleware       |
| `src/models/user.model.js:81-106`            | Token generation instance methods |
| `src/routes/user.route.js:20-23`             | Login + logout route definitions  |

---

_Keep building — authentication is the backbone of every real-world backend!_
