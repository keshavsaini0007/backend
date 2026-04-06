# Project Learning Guide - Part 2 (New Changes)

---

## Introduction

Welcome to Part 2! In the previous document (LEARNING1.md), you learned about the project structure, package.json, and basic backend concepts. Now, let's learn about the new changes that have been added to the project.

---

## What New Changes Have Been Made?

### 1. New Dependencies Added to package.json

Three new packages have been installed:

| Package | Purpose |
|---------|---------|
| `dotenv` | Loads environment variables from .env file |
| `express` | Web framework for Node.js |
| `mongoose` | MongoDB Object Data Modeling (ODM) library |

**Installation:**
```bash
npm install dotenv express mongoose
```

---

## Deep Dive: MongoDB & Mongoose

### What is MongoDB?

MongoDB is a **NoSQL (Not Only SQL)** database that stores data in **JSON-like documents**. Unlike traditional SQL databases with rows and tables, MongoDB uses flexible, schema-less documents.

**Why MongoDB with Node.js?**
- JavaScript everywhere (JSON format)
- Flexible schema - no rigid table structure
- Great for rapid prototyping
- Excellent scalability

### What is Mongoose?

Mongoose is an **ODM (Object Data Modeling)** library for MongoDB and Node.js. It provides a schema-based solution to model your data.

**Why use Mongoose?**
- Defines clear data schemas
- Provides built-in validation
- Easy to use with async/await
- Offers middleware hooks
- Helps prevent invalid data

---

## Code Explanation: Database Connection

### File: `src/db/index.js`

This is where the database connection logic lives. Let's break it down:

```javascript
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGO_URI}/${DB_NAME}`
        );
        console.log(`Database connected! DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
};

export default connectDB;
```

### Step-by-Step Explanation:

#### 1. Importing Mongoose
```javascript
import mongoose from "mongoose";
```
- Brings in the mongoose library to work with MongoDB

#### 2. Importing DB_NAME
```javascript
import { DB_NAME } from "../constants.js";
```
- Gets the database name from constants.js (currently: "videotube")

#### 3. Async Function
```javascript
const connectDB = async () => {
```
- Database connections take time, so we use `async/await`
- This prevents blocking other code execution

#### 4. Connecting to MongoDB
```javascript
const connectionInstance = await mongoose.connect(
    `${process.env.MONGO_URI}/${DB_NAME}`
);
```
- `mongoose.connect()` returns a connection instance
- Connection string format: `mongodb://localhost:27017/videotube`
- `process.env.MONGO_URI` - Your MongoDB connection string

#### 5. Logging Connection Info
```javascript
console.log(`Database connected! DB HOST : ${connectionInstance.connection.host}`);
```
- Shows which MongoDB host you're connected to
- Useful for debugging (dev/prod/staging environments)

#### 6. Error Handling
```javascript
catch (error) {
    console.log(error);
    process.exit(1);
}
```
- If connection fails, log the error
- `process.exit(1)` - Stop the application (1 = error/failure)
- This prevents the app from running without a database

#### 7. Export the Function
```javascript
export default connectDB;
```
- Makes this function available to other files

---

## Code Explanation: Entry Point

### File: `src/index.js`

```javascript
import connectDB from "./db/index.js";

import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});

connectDB();
```

### Step-by-Step Explanation:

#### 1. Import connectDB
```javascript
import connectDB from "./db/index.js";
```
- Brings in the database connection function we just created

#### 2. Import and Configure dotenv
```javascript
import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});
```
- **dotenv** loads environment variables from .env file
- `dotenv.config()` reads and parses the .env file
- Makes variables available via `process.env.VARIABLE_NAME`

**Why use dotenv?**
- Keep sensitive data (passwords, API keys) out of code
- Different config for dev/production
- Easy to change without editing code

#### 3. Call connectDB
```javascript
connectDB();
```
- Starts the database connection when app launches

---

## Environment Variables Setup

### What's in .env file?

Create a `.env` file in project root with:

```env
MONGO_URI=mongodb://localhost:27017
PORT=3000
NODE_ENV=development
```

**Important:** Never commit .env to Git! It's already in .gitignore.

---

## How to Test Your Database Connection

1. Make sure MongoDB is running on your machine
2. Add `MONGO_URI=mongodb://localhost:27017` to .env
3. Run the server:
   ```bash
   npm run dev
   ```
4. You should see: `Database connected! DB HOST: localhost`

---

## Common Errors & Solutions

### Error: "MongoServerSelectionError"
**Cause:** MongoDB not running or wrong URI
**Fix:** Start MongoDB or check your MONGO_URI

### Error: "process.exit(1)"
**Cause:** Database connection failed
**Fix:** Check MongoDB is running, credentials are correct

### Error: "Cannot find module 'mongoose'"
**Fix:** Run `npm install`

---

## Interview Questions to Prepare

| Question | Answer |
|----------|--------|
| What is Mongoose? | ODM library for MongoDB - provides schema validation |
| Why use async/await for DB? | Prevents blocking - allows other code to run while waiting |
| What does `process.exit(1)` do? | Exits Node.js with error code 1 |
| Why dotenv? | Loads env variables from .env file |
| What is MongoDB? | NoSQL document-based database |

---

## What's Next?

In the upcoming lessons, you will learn:
1. Setting up Express server in app.js
2. Creating your first API route
3. Creating Mongoose models (User, Video)
4. Building RESTful APIs (GET, POST, PUT, DELETE)
5. Error handling middleware
6. Authentication with JWT

---

## Summary

| Concept | What You Learned |
|---------|------------------|
| MongoDB | NoSQL database that stores JSON documents |
| Mongoose | ODM library for MongoDB schema modeling |
| dotenv | Loads environment variables from .env |
| async/await | Handle asynchronous database operations |
| process.exit() | Stop Node.js application |

---

*Great job completing Part 2! Keep practicing.*
