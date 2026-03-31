import connectDB from "./db/index.js"
import app from "./app.js";

import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});




app.on("error", (error) => {
    console.log("Server error !!!!",error);
    throw error
})





// now , we will connect to the database and then start the server
connectDB()
.then(() => {
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running on port ${process.env.PORT || 8000}`);
    })
})
.catch((error) => {
    console.log("MONGO DB connection failed !!!!",error)
})


/*
import mongoose from "mongoose";
import DB_NAME from "./constants";
import express from "express";
const app = express();

// a professional approach to connect to the database
(async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${process.env.DB_NAME}/${DB_NAME}`)
        app.on("error", (error) => {
            console.log(error);
            throw error
        })
        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log(error);
        throw error
    }
})()
*/