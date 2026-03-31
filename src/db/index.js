import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";
const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        console.log(`Database connected! DB HOST : ${connectionInstance.connection.host}`);
        // we have used ${connectionInstance.connection.host} because atleast we should have info that on which platform we are ! like : production , development , testing etc.
        // all the hosts have different databases
        // to know on which host we are connected...
    }
    catch(error) {
        console.log("MONGO DB connection failed !!!!",error);
        process.exit(1);
    }
}

export default connectDB;