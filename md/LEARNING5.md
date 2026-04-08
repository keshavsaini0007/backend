# Advanced Backend - File Handling & Cloud Storage

Welcome to Part 5! In previous parts, you learned about database connections, authentication, and API patterns. Now we'll learn about **file uploads** and **cloud storage** - essential skills for any modern backend developer.

---

## 1. Multer - File Upload Middleware

### What is Multer?

Multer is an Express middleware for handling `multipart/form-data`, which is used for uploading files. It's the standard way to handle file uploads in Node.js/Express applications.

### Why Do We Need Multer?

When a user uploads a file (avatar, video, document), the data comes as multipart form data. Multer parses this and makes the file available in `req.file` or `req.files`.

### Code Implementation (`src/middlewares/multer.middleware.js`)

```javascript
import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage: storage });
```

### Step-by-Step Explanation:

#### 1. Import Multer

```javascript
import multer from "multer";
```

#### 2. Configure Storage

```javascript
const storage = multer.diskStorage({...})
```

**diskStorage** stores files on your server's disk (local storage).

| Option        | Purpose                                        |
| ------------- | ---------------------------------------------- |
| `destination` | Folder where files are saved (`./public/temp`) |
| `filename`    | How to name the uploaded file                  |

#### 3. Destination Function

```javascript
destination: function (req, file, cb) {
    cb(null, './public/temp')
}
```

- `cb` is the callback function
- First argument: error (null = no error)
- Second argument: path to save file

#### 4. Filename Function

```javascript
filename: function (req, file, cb) {
    cb(null, file.originalname)
}
```

- Uses the original filename from the uploaded file
- In production, you'd generate unique names to prevent overwrites

#### 5. Export Multer Instance

```javascript
export const upload = multer({ storage: storage });
```

### How to Use Multer in Routes

```javascript
import { upload } from "./middlewares/multer.middleware.js";

// Single file upload
app.post("/upload", upload.single("avatar"), (req, res) => {
  console.log(req.file); // File details
  res.json({ message: "File uploaded" });
});

// Multiple files
app.post("/upload", upload.array("photos", 5), (req, res) => {
  console.log(req.files); // Array of files
});
```

### Key Concepts:

- `req.file` - Single file details
- `req.files` - Multiple files array
- File object properties: `originalname`, `mimetype`, `size`, `filename`, `path`

---

## 2. Cloudinary - Cloud Storage

### Why Cloud Storage?

Storing files locally has problems:

- Files use server storage space
- Hard to scale (multiple servers)
- Not accessible from different locations
- No CDN for fast delivery

**Cloudinary** is a cloud-based file storage service that:

- Stores images, videos, and files
- Provides CDN for fast global delivery
- Offers image transformations (resize, crop, etc.)
- Returns URLs for easy access

### Cloudinary Setup (`src/utils/cloudinary.js`)

```javascript
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    console.log("file is uploaded on cloudinary", result.url);
    return result;
  } catch (error) {
    fs.unlinkSync(localFilePath); // Remove local file on error
    return null;
  }
};
```

### Step-by-Step Explanation:

#### 1. Import Cloudinary

```javascript
import { v2 as cloudinary } from "cloudinary";
```

- `v2` is the current API version
- Provides methods to upload and manage files

#### 2. Configure Cloudinary

```javascript
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
```

- Connect to your Cloudinary account using environment variables
- Never hardcode these secrets!

#### 3. Upload Function

```javascript
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    return result;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};
```

**Key Points:**

- `resource_type: 'auto'` - Automatically detects file type (image, video, raw)
- Returns upload result with URL
- On error, deletes local file to clean up

### Environment Variables Needed:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Upload Result Object:

```javascript
{
    public_id: "sample/image_id",
    secure_url: "https://res.cloudinary.com/.../image.jpg",
    url: "http://res.cloudinary.com/.../image.jpg",
    format: "jpg",
    width: 1920,
    height: 1080,
    bytes: 12345
}
```

---

## 3. Complete File Upload Flow

Here's how file uploads work in a real application:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│  Express   │────▶│   Local     │────▶│ Cloudinary  │
│             │     │  (Multer)  │     │  (temp/)    │     │   (Cloud)   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                                       │                      │
      │                                       │                      │
   Upload                                 Save                   Return
   Form                                  Temporarily            URL
```

### Code Example:

```javascript
import { upload } from "./middlewares/multer.middleware.js";
import { uploadOnCloudinary } from "./utils/cloudinary.js";

app.post(
  "/upload-avatar",
  upload.single("avatar"),
  asyncHandler(async (req, res) => {
    // Step 1: Get local file path from multer
    const localFilePath = req.file.path;

    // Step 2: Upload to Cloudinary
    const uploadedFile = await uploadOnCloudinary(localFilePath);

    // Step 3: Return Cloudinary URL
    res.json(
      new ApiResponse(200, "File uploaded", {
        url: uploadedFile.secure_url,
      })
    );
  })
);
```

---

## 4. Higher Order Functions in JavaScript

You learned about asyncHandler in previous parts. Let's understand what "Higher Order Function" means.

### Definition:

A **Higher Order Function** is a function that either:

1. Takes another function as an argument, OR
2. Returns a function as its result

### Examples from Our Code:

#### Example 1: asyncHandler

```javascript
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};
```

- **Input**: A function (`requestHandler`)
- **Output**: A new function (wrapper)
- **Purpose**: Error handling wrapper

#### Example 2: Array Methods

```javascript
const numbers = [1, 2, 3, 4, 5];

// map - transforms each element
const doubled = numbers.map((n) => n * 2);

// filter - keeps elements matching condition
const even = numbers.filter((n) => n % 2 === 0);

// reduce - reduces array to single value
const sum = numbers.reduce((acc, n) => acc + n, 0);
```

### Why Higher Order Functions Matter:

- **Reusability**: Write once, use many times
- **Clean Code**: Avoid repetition
- **Functional Programming**: Foundation for modern JS patterns

---

## 5. Video Model Deep Dive

### File: `src/models/video.model.js`

```javascript
import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new mongoose.Schema(
  {
    videoFile: {
      type: String, // Cloudinary URL
      required: true,
    },
    thumbnail: {
      type: String, // Cloudinary URL
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video", videoSchema);
```

### Key Fields Explained:

| Field         | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `videoFile`   | String   | Cloudinary URL for video           |
| `thumbnail`   | String   | Cloudinary URL for thumbnail image |
| `title`       | String   | Video title                        |
| `description` | String   | Video description                  |
| `duration`    | Number   | Video length in seconds            |
| `views`       | Number   | View count (default 0)             |
| `isPublished` | Boolean  | Draft/published status             |
| `owner`       | ObjectId | Reference to User model            |

### Relationship: User → Videos

```javascript
owner: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
}
```

This creates a **Many-to-One** relationship:

- Many videos can belong to one user
- Each video has one owner (user)

### Aggregation with Pagination:

The `mongooseAggregatePaginate` plugin adds `.paginate()` method:

```javascript
const videos = await Video.aggregate([
  { $match: { isPublished: true } },
  { $sort: { createdAt: -1 } },
]).paginate({
  page: 1,
  limit: 10,
});
```

---

## 6. Environment Variables Summary

Here's a complete list of environment variables needed:

```env
# Database
MONGO_URI=mongodb://localhost:27017

# Server
PORT=8000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# JWT Secrets
ACCESS_TOKEN_SECRET=your_secret_key
REFRESH_TOKEN_SECRET=your_refresh_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Interview Questions

| Question                                       | Answer                                                             |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| What is Multer?                                | Express middleware for handling file uploads (multipart/form-data) |
| Why use Cloudinary?                            | Cloud storage with CDN (Content Delivery Network),                 |
|                                                | easy transformations, scalability                                  |
| What is a Higher Order Function?               | Function that takes/returns another function                       |
| How does file upload flow work?                | Client → Multer (local) → Cloudinary (cloud) → Save URL to DB      |
| Why delete local file after Cloudinary upload? | Free up server storage space                                       |
| What is `resource_type: 'auto'`?               | Auto-detects file type (image/video/raw)                           |

---

## Quick Reference

```javascript
// Multer setup
import multer from "multer"
const upload = multer({ storage: multer.diskStorage({...}) })

// Use in route
app.post('/upload', upload.single('file'), handler)

// Cloudinary upload
import { v2 as cloudinary } from 'cloudinary'
const result = await cloudinary.uploader.upload(filePath, { resource_type: 'auto' })

// Higher order function example
const higherOrder = (fn) => (req, res) => fn(req, res)
```

---

_Great job completing Part 5! You've learned essential file handling skills._
