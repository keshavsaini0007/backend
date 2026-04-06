# Project Documentation - Backend Learning Guide

## Overview

This is a Node.js backend project configured for learning and placement preparation. The project follows industry best practices with proper structure and tooling.

---

## Project Structure

```
PROJECT/
├── src/                    # Source code directory
│   ├── index.js           # Entry point (currently empty)
│   ├── app.js             # App configuration (currently empty)
│   └── constants.js       # Constants file (currently empty)
├── public/                # Static files directory
│   └── temp/             # Temporary file storage
│       └── .gitkeep      # Git keep file (keeps folder in git)
├── package.json          # Project dependencies & scripts
├── package-lock.json    # Locked dependency versions
├── .env                 # Environment variables
├── .gitignore           # Git ignore rules
├── .prettierrc         # Prettier code formatter config
├── .prettierignore     # Prettier ignore rules
└── node_modules/       # Installed dependencies
```

---

## File-by-File Explanation

### 1. package.json

**Purpose:** Defines project metadata, dependencies, and scripts.

```json
{
  "name": "project",           // Project name
  "version": "1.0.0",         // Semantic versioning
  "description": "A project with good backend complexity",
  "keywords": ["backend"],    // Searchable keywords
  "license": "ISC",           // Open source license
  "author": "keshav",         // Author name
  "type": "module",           // Using ES6 modules (import/export)
  "main": "index.js",         // Entry point when requiring the package
  "scripts": {                // NPM scripts for automation
    "dev": "nodemon src/index.js"  // Run dev server with auto-reload
  },
  "devDependencies": {        // Development-only dependencies
    "nodemon": "^3.1.14",     // Auto-restarts server on file changes
    "prettier": "^3.8.1"     // Code formatter
  }
}
```

**Key Concepts:**
- **type: "module"** - Enables ES6 module syntax (`import`/`export` instead of `require`)
- **nodemon** - Development tool that automatically restarts the server when files change
- **Scripts** - Automate common tasks like running the dev server

---

### 2. .env (Environment Variables)

**Purpose:** Stores sensitive configuration and environment-specific values.

**Why use .env:**
- Keep secrets out of source code
- Different configurations for development/production
- Easy to change without modifying code

**Common .env variables:**
- `PORT` - Server port number
- `DB_URI` - Database connection string
- `JWT_SECRET` - Secret key for authentication
- `NODE_ENV` - Environment (development/production)

---

### 3. .gitignore

**Purpose:** Specifies which files Git should ignore (not track).

**Why important:**
- Prevents sensitive data from being committed
- Reduces commit size by ignoring dependencies
- Keeps repo clean

**Common patterns:**
```
node_modules/    # Don't commit installed packages
.env             # Don't commit secrets
.DS_Store        # Ignore system files
```

---

### 4. .prettierrc & .prettierignore

**Purpose:** Code formatting configuration.

**Prettier** - An opinionated code formatter that ensures consistent code style across the project.

```json
// Example .prettierrc config
{
  "semi": true,           // Add semicolons
  "singleQuote": true,    // Use single quotes
  "tabWidth": 2,          // 2 spaces per tab
  "trailingComma": "es5"  // Trailing commas in ES5
}
```

---

### 5. src/ Directory

**Purpose:** Contains all application source code.

| File | Purpose |
|------|---------|
| `index.js` | Entry point - where the server starts |
| `app.js` | Express app configuration, middleware setup |
| `constants.js` | Store fixed values used throughout the app |

**Typical backend structure:**
```
src/
├── index.js         # Server startup
├── app.js          # Express app setup
├── constants.js   # App-wide constants
├── routes/        # API route handlers
├── controllers/   # Business logic
├── models/        # Database models
├── middleware/    # Custom middleware
├── utils/         # Helper functions
└── config/        # Configuration files
```

---

### 6. public/ Directory

**Purpose:** Serve static files (HTML, CSS, images, etc.)

**Usage in Express:**
```javascript
app.use(express.static('public'))
```

---

## Key Backend Concepts to Learn

### 1. Express.js
- Web framework for Node.js
- Handles HTTP requests/responses
- Route handling, middleware

### 2. REST API
- Representational State Transfer
- CRUD operations via HTTP methods:
  - `GET` - Retrieve data
  - `POST` - Create new data
  - `PUT`/`PATCH` - Update data
  - `DELETE` - Remove data

### 3. Middleware
- Functions that execute during request-response cycle
- Can modify request/response objects
- Examples: authentication, logging, validation

### 4. Database Integration
- MongoDB (with Mongoose) - Common with Node.js
- Connection management
- CRUD operations

### 5. Authentication & Authorization
- JWT (JSON Web Tokens)
- Password hashing (bcrypt)
- Session management

### 6. Error Handling
- Try-catch blocks
- Global error handlers
- Proper HTTP status codes

### 7. Environment Configuration
- Different configs for dev/prod
- Environment variables

---

## Next Steps for Learning

1. **Set up Express server** in `src/index.js`
2. **Create routes** for API endpoints
3. **Add middleware** for logging, validation
4. **Connect database** (MongoDB recommended)
5. **Implement authentication** with JWT
6. **Add error handling** middleware
7. **Write API documentation**

---

## Installation & Running

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Format code
npx prettier --write .
```

---

## Interview Prep Topics

| Topic | What to Know |
|-------|--------------|
| Node.js | Event loop, async/await, buffers |
| Express | Middleware, routing, REST APIs |
| MongoDB | CRUD, aggregations, indexing |
| JWT | Token structure, refresh tokens |
| REST API | HTTP methods, status codes, REST principles |
| Authentication | OAuth, sessions vs tokens |
| Security | XSS, CSRF, SQL injection, rate limiting |
| Performance | Caching, load balancing, clustering |

---

*Last Updated: 2026*
*Author: keshav*
