import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {

    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log(token)
        if (!token) {
            throw new ApiError(401, "Unautorized request....");
        }

        // When verification succeeds, it returns the decoded payload (claims)
        // id
        // email
        // username
        // fullName

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        // wrong method :  console.log(decodedToken._id)
        // correct method :
        console.log(decodedToken.id)

        const user = await User.findById(decodedToken?.id).select("-password -refreshToken");
        if (!user) {
            throw new ApiError(401, "invalid access token")
        }
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})