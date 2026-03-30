import connectDB from "./db/index.js"

import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});


connectDB();



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