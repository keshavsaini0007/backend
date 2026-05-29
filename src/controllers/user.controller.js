import asyncHandler from '../utils/AsyncHandler.js'
import ApiError from '../utils/ApiError.js'
import Apiresponse from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import mongoose from 'mongoose'
import ApiResponse from '../utils/ApiResponse.js'

// const generateAccessAndRefreshTokens = async (userId) => {
//     // generate access token and refresh token using the user id
//     // return the access token and refresh token

//     const user = await User.findById(userId);
//     if (!user) {
//         throw new ApiError(404, "User not found during token generation");
//     }
//     try {
//         const accessToken = await user.generateAccessToken();
//         const refreshToken = await user.generateRefreshToken();

//         user.refreshToken = refreshToken;
//         // schema validations is not required
//         await user.save({ validateBeforeSave: false });

//         return { accessToken, refreshToken };
//     } catch (error) {
//         throw new ApiError(500, "Something went wrong while generating referesh and access token")
//     }
// }

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    // get the data from the frontend
    // validate the data (Non-empty)
    // check if the user already exists in the database (using email or username)
    // if user exists, send an error response
    // check for avatar , check for image
    // upload the avatar to cloudinary and get the url
    // if user does not exist, hash the password and save the user in the database
    // remove password and refreshToken from the response before sending it to the frontend
    // check for creation user in database and send success response


    // getting the data from the frontend
    const { fullName, username, email, password } = req.body;
    console.log(fullName)
    console.log(email)
    console.log(username)
    console.log(password)


    // verify that the data is received from the frontend
    if ([fullName, username, email, password].some(
        (field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }


    // check if the user already exists in the database (using email or username)
    const existingUser = await User.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    });
    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }


    // checking for avatar and coverImage in the request
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // if avatar is necessary

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }


    // upload the avatar to cloudinary and get the url
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : "";


    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    // create the user in the database
    const newUser = await User.create({
        fullName: fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });

    //NOTE: mongodb creates a unique _id for each document, so we can use that as the user id
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");
    // 
    if (!createdUser) throw new ApiError(500, "something went wrong while creating the user");

    return res.status(201).json(
        new Apiresponse(
            201,
            createdUser,
            "User registered successfully",
        )
    )
})

// const loginUser = asyncHandler(async (req, res) => {
//     // get the data from the frontend
//     // validate the data (Non-empty)
//     // check if the user exists in the database (using email or username)
//     // if user does not exist, send an error response
//     // if user exists, compare the password with the hashed password in the database
//     // if password is incorrect, send an error response
//     // if password is correct, generate a JWT token and send it to the frontend

//     const { email, username, password } = req.body;

//     if (!username && !email) {
//         throw new ApiError(400, "username or email is required")
//     }

//     const user = await User.findOne({
//         $or: [
//             { email: email },
//             { username: username }
//         ]
//     })

//     if (!user) {
//         throw new ApiError(404, "User does not exist");
//     }

//     const isPasswordValid = await user.isPasswordCorrect(password)

//     if (!isPasswordValid) {
//         throw new ApiError(401, "Invalid user credentials");
//     }

//     const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

//     const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

//     const options = {
//         httpOnly: true,
//         secure: true,
//     }

//     return res
//         .status(200)
//         .cookie("refreshToken", refreshToken, options)
//         .cookie("accessToken", accessToken, options)
//         .json(
//             new Apiresponse(
//                 200,
//                 { user: loggedInUser, accessToken, refreshToken },
//                 "User logged in successfully"
//             )
//         );
// })

const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const {email, username, password} = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

})


const logoutUser = asyncHandler(async (req, res) => {
    // get the user id from the req.user object (set by the verifyJWT middleware)
    // find the user in the database and remove the refresh token
    // send a success response to the frontend

    
    await User.findByIdAndUpdate(
        req.user._id,
        {
            refreshToken: undefined
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200,
                {},
                "user Logged out"
            )
        )
})


export { registerUser, loginUser, logoutUser }