# Advanced Backend Concepts - VideoTube Project

Welcome back! This guide covers new concepts beyond what you learned in LEARNING1 and LEARNING2. We'll explore professional backend patterns used in real-world applications.

---

## 1. Custom API Response & Error Classes

In production applications, you need consistent response formats. Instead of manually creating response objects in every route, we create reusable classes.

### ApiResponse Class (`src/utils/apiResponse.js`)

```javascript
class ApiResponse {
    constructor(statusCode, message = "success", data) {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
    }
}
```

**Key Points:**
- `statusCode < 400` automatically determines if response is successful
- Provides consistent structure: `{ statusCode, data, message, success }`
- Makes API responses uniform across the entire application

**Usage Example:**
```javascript
res.status(200).json(new ApiResponse(200, "Login successful", user));
// Output: { statusCode: 200, data: user, message: "Login successful", success: true }
```

### ApiError Class (`src/utils/apiError.js`)

```javascript
class ApiError extends Error {
    constructor(statusCode, message = "Something went wrong", errors = [], stack = "") {
        super(message)
        this.errors = errors
        this.statusCode = statusCode
        this.message = message
        this.data = null
        this.success = false

        if (stack) {
            this.stack = stack
        } else {
            Error.captureStackTrace(this, this.constructor)
        }
    }
}
```

**Key Points:**
- Extends JavaScript's built-in `Error` class
- `Error.captureStackTrace()` - Captures where the error occurred
- Stores multiple errors in an array (`errors`) for validation errors
- Sets `success: false` automatically for error responses

---

## 2. Async Handler - Cleaner Error Handling

One of the biggest challenges in Express is handling async errors. Without asyncHandler, you need try-catch in every route:

### Without Async Handler (Repetitive):
```javascript
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});
```

### With Async Handler (Clean):
```javascript
const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next))
            .catch((error) => next(error));
    };
};
```

**How it works:**
1. Takes a route handler function as input
2. Returns a new function that wraps it in a Promise
3. If any error occurs, it automatically passes it to Express's error middleware via `next(error)`
4. No more try-catch blocks in each route!

**Usage:**
```javascript
app.get('/api/users', asyncHandler(async (req, res) => {
    const users = await User.find();
    res.json(new ApiResponse(200, "Users fetched", users));
}));
```

---

## 3. Express App Configuration Deep Dive

### CORS with Credentials (`src/app.js`)

```javascript
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    successStatus: 200
}));
```

| Option | Purpose |
|--------|---------|
| `origin` | Specifies which domains can access your API |
| `credentials: true` | Allows cookies to be sent with cross-origin requests |
| `successStatus: 200` | Legacy browser support for certain requests |

**Important:** When `credentials: true`, you cannot use `origin: "*"`. You must specify exact origin.

### Middleware Configuration

```javascript
app.use(express.json({limit: "16kb"}));      // Parse JSON bodies, max 16KB
app.use(express.urlencoded({extended: true, limit: "16kb"})); // Parse form data
app.use(express.static("public"));           // Serve static files
app.use(cookieParser());                     // Parse cookies
```

**Why limits?**
- Prevents malicious requests with extremely large payloads
- Protects server from DoS attacks

**What is cookie-parser?**
- Parses cookies from incoming requests
- Makes cookies accessible via `req.cookies`
- Essential for authentication (storing JWT tokens)

---

## 4. Database Connection Pattern

### connectDB Function (`src/db/index.js`)

```javascript
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`
        );
        console.log(`Database connected! DB HOST: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("MONGO DB connection failed !!!!", error);
        process.exit(1);  // Exit with error code 1
    }
};

export default connectDB;
```

**Key Concepts:**
- **`process.env.MONGO_URI`** - Database connection string from environment variables
- **`DB_NAME`** - Separate constant for database name (good practice)
- **`connectionInstance.connection.host`** - Shows which MongoDB host you're connected to (useful for debugging: local, Atlas, etc.)
- **`process.exit(1)`** - Forcefully terminates Node.js process on failure

### Environment Variables (`.env`)

```env
MONGO_URI=mongodb://localhost:27017
PORT=8000
CORS_ORIGIN=http://localhost:5173
```

**Why use dotenv?**
- Keeps sensitive information (URIs, keys) out of code
- Different configurations for dev/prod environments

---

## 5. Server Startup Sequence

```javascript
import dotenv from "dotenv";
dotenv.config({ path: './.env' });

import connectDB from "./db/index.js";
import app from "./app.js";

app.on("error", (error) => {
    console.log("Server error !!!!", error);
    throw error;
});

connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port ${process.env.PORT || 8000}`);
        });
    })
    .catch((error) => {
        console.log("MONGO DB connection failed !!!!", error);
    });
```

**Why this order matters:**
1. **Load environment variables first** - Everything else might need them
2. **Connect to database before starting server** - Ensures DB is ready before accepting requests
3. **Use `.then()` chain** - Server only starts if DB connection succeeds

---

## 6. Key Differences from Basic Setup

| Feature | Basic Approach | Professional Approach |
|---------|----------------|----------------------|
| Error handling | try-catch in each route | asyncHandler wrapper |
| Response format | Manual objects | ApiResponse class |
| Error format | Console.log | ApiError class |
| DB connection | Simple connect | connectDB with logging |
| Environment config | Hardcoded values | dotenv with .env file |
| Server startup | Immediate listen | Wait for DB connection |
| CORS | Default | Configured with credentials |

---

## Interview Questions to Practice

1. **What is the purpose of asyncHandler in Express?**
2. **Why do we need both ApiResponse and ApiError classes?**
3. **Explain the difference between express.json() and express.urlencoded()**
4. **What does credentials: true do in CORS?**
5. **Why is database connection placed before server.listen()?**
6. **What is process.exit(1) and when should we use it?**

---

## Quick Reference

```javascript
// Response
res.status(200).json(new ApiResponse(200, "Success", data));

// Error
throw new ApiError(400, "Invalid input", validationErrors);

// Async Route
app.get('/route', asyncHandler(async (req, res) => {
    // your code
}));
```

Keep practicing these patterns - they're used in almost every production backend!

---