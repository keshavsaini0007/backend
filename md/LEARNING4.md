# Authentication & Advanced Backend Concepts

## What We Already Covered (Parts 1-3)
- Express.js & React fundamentals
- MongoDB/Mongoose schema design
- API Response & Async Handler utilities

## What's New in This Project

---

## 1. Authentication with bcryptjs

### Why Password Hashing?
Never store passwords in plain text! If your database is hacked, attacker gets all user passwords.

### What is bcrypt?
bcrypt is a password hashing function that adds salt to protect against rainbow table attacks.

```javascript
import bcrypt from 'bcryptjs';

// Hashing a password
const hashedPassword = await bcrypt.hash(password, 10);
// 10 = salt rounds (higher = more secure but slower)

// Comparing password
const isCorrect = await bcrypt.compare(password, hashedPassword);
```

### Mongoose Pre-Save Middleware
We hash password **before** saving to database:

```javascript
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
```

**Important:** Use regular function (`function(){}`), not arrow function (`()=>{}`), because we need `this` to access the document.

---

## 2. JWT (JSON Web Tokens)

### What is JWT?
JWT is a stateless authentication mechanism. Server doesn't store user session - all info is in the token itself.

### JWT Structure
```
header.payload.signature
```

- **Header**: Algorithm & token type
- **Payload**: User data (id, email, username)
- **Signature**: Verifies token wasn't tampered

### Access Token vs Refresh Token

| Feature | Access Token | Refresh Token |
|---------|--------------|----------------|
| Life | Short (15min - 1day) | Long (7-30 days) |
| Purpose | Authorize requests | Get new access token |
| Size | Smaller | Can be larger |

### Implementation in User Model

```javascript
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        { id: this._id, email: this.email, username: this.username },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
    );
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    );
};
```

---

## 3. Cookie Parser

### Why Cookies?
Cookies store data on the client side that gets sent with every request automatically.

```javascript
import cookieParser from "cookie-parser";
app.use(cookieParser());
```

### Use Case
When user logs in, server sends a cookie with refresh token. Browser automatically sends this cookie with future requests, so user stays logged in.

---

## 4. CORS Configuration

### What is CORS?
Cross-Origin Resource Sharing - security feature that restricts cross-origin HTTP requests.

```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    successStatus: 200
}));
```

- **origin**: Which domains can access your API
- **credentials**: Allow cookies to be sent cross-origin
- **successStatus**: For legacy browser support

---

## 5. Mongoose Indexes

### Why Indexes?
Indexes make database queries faster. Without indexes, MongoDB scans every document.

```javascript
username: {
    type: String,
    required: true,
    unique: true,
    index: true  // Creates index for faster queries
}
```

**Common indexes:**
- Fields you frequently search/filter (`findByEmail`, `findByUsername`)
- Fields used for sorting
- Fields with `unique: true` automatically get indexes

---

## 6. MongoDB Aggregation with Pagination

### What is Aggregation?
Aggregation processes data through a pipeline (match → sort → group → etc.).

### mongoose-aggregate-paginate-v2
This plugin adds `.paginate()` method to aggregation queries:

```javascript
videoSchema.plugin(mongooseAggregatePaginate);

// Usage
const videos = await Video.aggregate().paginate({
    page: 1,
    limit: 10,
    sort: { createdAt: -1 }
});
```

---

## 7. Express Middleware Configuration

### Body Parsing

```javascript
app.use(express.json({limit: "16kb"}));      // Parse JSON bodies
app.use(express.urlencoded({extended: true, limit: "16kb"})); // Parse URL-encoded bodies
```

- **limit: "16kb"**: Prevent large payload attacks
- **extended: true**: Support nested objects

### Static Files

```javascript
app.use(express.static("public"));
```

Serves files from `public/` folder (images, CSS, etc.)

---

## 8. Error Handling Class (ApiError)

```javascript
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = []) {
        super(message);
        this.statusCode = statusCode;
        this.success = false;
        this.errors = errors;
    }
}

// Usage
throw new ApiError(400, "Invalid email or password");
```

Extends built-in Error class for custom error handling.

---

## 9. Cloudinary URLs for File Storage

In production, files (videos, images) aren't stored in MongoDB. Instead:

```javascript
avatar: {
    type: String,  // cloudinary URL like https://res.cloudinary.com/...
    required: true
}
```

**Why Cloudinary?**
- Handles large video/image files efficiently
- Provides CDN for fast delivery
- Offers image transformations (resize, crop, etc.)

---

## 10. Watch History Relationship

```javascript
watchHistory: [
    {
        type: Schema.Types.ObjectId,
        ref: 'Video',
    }
]
```

Array of ObjectIds creates a **one-to-many** relationship (one user → many videos in history).

---

## Key Interview Points

1. **Password Hashing**: Always hash, never encrypt
2. **JWT**: Stateless, contains payload, must verify signature
3. **bcrypt vs jwt**: bcrypt = hashing, jwt = authentication token
4. **Indexes**: Use for frequently queried fields
5. **Middleware**: Express flows through middleware in order
6. **Aggregation**: Powerful for complex queries, use pagination for large datasets

---

## Environment Variables Required

```
MONGO_URI=...
CORS_ORIGIN=...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
ACCESS_TOKEN_EXPIRY=...
REFRESH_TOKEN_EXPIRY=...
PORT=...
```

---

## Quick Reference

```javascript
// Hash password before save
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Custom method
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Generate tokens
userSchema.methods.generateAccessToken = function() { ... }
```

---

*Practice implementing these concepts in your own projects!*
