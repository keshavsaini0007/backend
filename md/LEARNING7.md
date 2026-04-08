# User Registration & Authentication Flow

Welcome to Part 7! In this document, we'll learn how the user registration flow works by connecting all the pieces together - the route, controller, and model.

---

## 1. How User Registration Works

When a user submits a registration request, here's what happens:

```
Client (Postman/Browser)
        │
        ▼
POST /api/v1/users/register
        │
        ▼
user.route.js (Route Handler)
        │
        ▼
user.controller.js (Business Logic)
        │
        ▼
user.model.js (Database Operation)
        │
        ▼
MongoDB (Save User)
```

Let's break down each part:

---

## 2. The Route (`src/routes/user.route.js`)

```javascript
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router = Router();

router.route("/register").post(registerUser);

export default router;
```

### Explanation:

| Part                        | What it does                                    |
| --------------------------- | ----------------------------------------------- |
| `Router()`                  | Creates a new router object for defining routes |
| `router.route("/register")` | Defines a route for `/register` endpoint        |
| `.post(registerUser)`       | Handles POST requests to this endpoint          |
| `/api/v1/users/register`    | Full URL (prefix from app.js)                   |

### Key Point:

The route only handles **routing** - it passes the request to the controller. It doesn't contain any business logic.

---

## 3. The Controller (`src/controllers/user.controller.js`)

```javascript
import asyncHandler from "../utils/asyncHandler.js";

const registerUser = asyncHandler(async (req, res) => {
  res.status(200).json({
    message: "ok",
  });
});

export { registerUser };
```

### Explanation:

| Part              | What it does                                  |
| ----------------- | --------------------------------------------- |
| `asyncHandler`    | Wrapper that automatically catches errors     |
| `req`             | Request object - contains data sent by client |
| `res`             | Response object - used to send response back  |
| `res.status(200)` | Set HTTP status code (200 = OK)               |
| `.json({...})`    | Send JSON response                            |

### Current Status:

This is a basic implementation. In a full implementation, you would:

1. Get user data from `req.body`
2. Validate the data
3. Check if user already exists
4. Create new user in database
5. Return response with user data

---

## 4. The Model (`src/models/user.model.js`)

This is where the magic happens! Let's look at the key parts:

### User Schema Definition:

```javascript
const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    avatar: {
      type: String, // Cloudinary URL
      required: true,
    },
    coverImage: {
      type: String, // Cloudinary URL
      required: true,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);
```

### Schema Options Explained:

| Option             | Purpose                                 |
| ------------------ | --------------------------------------- |
| `type: String`     | Data type for the field                 |
| `required: true`   | Field must have a value                 |
| `unique: true`     | No two users can have same value        |
| `trim: true`       | Remove whitespace from ends             |
| `lowercase: true`  | Convert to lowercase automatically      |
| `index: true`      | Create database index for faster search |
| `ref: 'Video'`     | Reference to Video model (relationship) |
| `timestamps: true` | Auto-add `createdAt` and `updatedAt`    |

---

## 5. Password Hashing (Pre-Save Middleware)

```javascript
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
```

### Step-by-Step:

1. **`pre("save", ...)`** - Runs before saving to database
2. **`this.isModified("password")`** - Check if password was changed
3. **`bcrypt.hash(this.password, 10)`** - Hash the password with 10 salt rounds
4. **`next()`** - Move to the next step (saving to database)

### Why Hash Passwords?

- Never store passwords in plain text!
- If database is hacked, attackers can't read passwords
- `bcrypt` adds "salt" to prevent rainbow table attacks

---

## 6. Custom Methods

### Compare Password:

```javascript
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
```

This compares the plain password with the hashed password in the database.

### Generate Access Token:

```javascript
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};
```

**What's in the token?**

- `id` - User's unique ID
- `email` - User's email
- `username` - User's username
- `fullName` - User's full name

### Generate Refresh Token:

```javascript
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
```

**Why separate tokens?**

- Access Token: Short-lived (15 min to 1 day) - for API access
- Refresh Token: Long-lived (7 to 30 days) - to get new access tokens

---

## 7. Flow Diagram: User Registration

```
1. User sends POST request with:
   - username, email, password, fullName

2. Route receives request
   └── Calls registerUser controller

3. Controller receives request
   └── Validates input data
   └── Checks if user exists
   └── Creates User object
   └── Saves to database (model)

4. Model saves to MongoDB
   └── Password gets hashed (pre-save middleware)
   └── Timestamps added automatically

5. Response sent back to client
```

---

## 8. Key Concepts Summary

| Concept     | What You Learned                                           |
| ----------- | ---------------------------------------------------------- |
| Routes      | Define API endpoints                                       |
| Controllers | Handle business logic                                      |
| Models      | Define data structure and database operations              |
| Middleware  | Run code before certain operations (like password hashing) |
| Schema      | Blueprint for your data                                    |
| JWT         | Stateless authentication tokens                            |
| bcrypt      | Password hashing algorithm                                 |

---

## 9. Interview Questions

| Question                                                       | Answer                                                                                                     |
| -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| What is the purpose of routes in Express?                      | Routes define API endpoints and delegate requests to controllers                                           |
| Why do we hash passwords?                                      | To protect user passwords if database is compromised                                                       |
| What is the difference between access token and refresh token? | Access token is short-lived for API authorization; refresh token is long-lived to obtain new access tokens |
| What does `this.isModified("password")` do?                    | Checks if the password field was changed before hashing                                                    |
| Why use `timestamps: true` in schema?                          | Automatically adds `createdAt` and `updatedAt` fields                                                      |

---

## Quick Reference

```javascript
// Route
router.route("/register").post(registerUser);

// Controller
const registerUser = asyncHandler(async (req, res) => {
  // business logic here
});

// Model - Pre-save middleware
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Model - Custom method
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};
```

---

_Great job completing Part 7! You now understand how user registration flows through the entire application._
