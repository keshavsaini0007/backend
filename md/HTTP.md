# 🌐 HTTP Crash Course Notes

---

## 📌 What are HTTP Headers?

* **Metadata** → Key-value pairs sent along with **request & response**
* Used for:

  * 📦 Caching
  * 🔐 Authentication
  * 🔄 Managing state

> ⚠️ `X-` prefix was deprecated in **2012**

---

## 🧩 Types of Headers

| Type                | Description                 |
| ------------------- | --------------------------- |
| 📤 Request Headers  | Sent from client            |
| 📥 Response Headers | Sent from server            |
| 📦 Representation   | Encoding / compression info |
| 📄 Payload Headers  | Actual data-related info    |

---

## ⭐ Most Common Headers

* `Accept` → application/json
* `User-Agent`
* `Authorization`
* `Content-Type`
* `Cookie`
* `Cache-Control`

---

## 🌍 CORS (Cross-Origin Resource Sharing)

* `Access-Control-Allow-Origin`
* `Access-Control-Allow-Credentials`
* `Access-Control-Allow-Methods`

---

## 🔐 Security Headers

* `Cross-Origin-Embedder-Policy`
* `Cross-Origin-Opener-Policy`
* `Content-Security-Policy`
* `X-XSS-Protection`

---

## ⚙️ HTTP Methods

Basic operations to interact with server:

| Method     | Description            |
| ---------- | ---------------------- |
| 🟢 GET     | Retrieve a resource    |
| 🔵 HEAD    | No body (headers only) |
| 🟡 OPTIONS | Available operations   |
| 🟠 TRACE   | Loopback test          |
| 🔴 DELETE  | Remove resource        |
| 🟣 PUT     | Replace resource       |
| 🟤 POST    | Create / interact      |
| ⚫ PATCH    | Partial update         |

---

## 📊 HTTP Status Codes

### 🧠 Categories

| Code Range | Meaning       |
| ---------- | ------------- |
| 1xx        | Informational |
| 2xx        | Success       |
| 3xx        | Redirection   |
| 4xx        | Client Error  |
| 5xx        | Server Error  |

---

### ✅ Common Status Codes

#### 🟢 Success / Info

* `100` → Continue
* `102` → Processing
* `200` → OK
* `201` → Created
* `202` → Accepted

#### 🔁 Redirection

* `307` → Temporary Redirect
* `308` → Permanent Redirect

#### ❌ Client Errors

* `400` → Bad Request
* `401` → Unauthorized
* `402` → Payment Required
* `404` → Not Found

#### 💥 Server Errors

* `500` → Internal Server Error
* `504` → Gateway Timeout

---

## 🚀 Quick Summary

* Headers = **metadata for requests & responses**
* Methods = **actions**
* Status codes = **result of action**
* CORS & Security headers = **control + protection layer**

---

✨ *Perfect for quick revision before interviews or exams!*
