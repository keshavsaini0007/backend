# Learning Overview - Backend Project

This document summarizes everything learned in LEARNING1, LEARNING2, and LEARNING3.

---

## 1. Project Setup & Tools

- **Node.js** backend project with ES6 modules (`"type": "module"`)
- **npm** for package management
- **nodemon** for auto-restart during development
- **prettier** for code formatting
- **dotenv** for environment variables
- **.gitignore** to exclude node_modules, .env, etc.

---

## 2. Core Dependencies

| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| dotenv | Env variables |
| cors | Cross-origin requests |
| cookie-parser | Parse cookies |

---

## 3. MongoDB & Mongoose

- MongoDB is a NoSQL document-based database
- Mongoose provides schema modeling and validation
- Connection via `mongoose.connect()` with async/await
- Database name stored in constants.js

---

## 4. Professional Patterns

- **ApiResponse class** - Consistent success responses
- **ApiError class** - Standardized error handling (extends Error)
- **asyncHandler** - Wraps async routes to catch errors automatically
- **CORS with credentials** - Configured origin, not wildcard
- **Middleware** - express.json, urlencoded, static, cookie-parser

---

## 5. Server Startup Order

1. Load dotenv (.env)
2. Connect to database
3. Start server (only if DB succeeds)

---

## 6. REST API Basics

- **GET** - Retrieve data
- **POST** - Create data
- **PUT/PATCH** - Update data
- **DELETE** - Remove data

---

## Key Interview Topics

- Node.js event loop, async/await
- Express middleware, routing
- MongoDB CRUD, Mongoose schemas
- JWT authentication
- Error handling patterns
- CORS and security best practices

---

*Last Updated: 2026*