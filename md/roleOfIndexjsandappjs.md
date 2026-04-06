# ⚛️ React App Structure: Role of `index.js` and `App.js`

---

## 🧠 Overview

In a React application, two core files define how your app starts and what it displays:

- `index.js` → Entry Point 🚪  
- `App.js` → Main UI Component 🏠  

---

## 🔹 `index.js` (Entry Point)

### 📌 What it does:
- Acts as the **starting point** of the React app
- Connects React to the **HTML DOM**
- Renders the root component (`App`)

### ⚙️ Code Example:
```js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);