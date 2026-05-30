import asyncHandler from '../utils/AsyncHandler.js'
import ApiError from '../utils/ApiError.js'
import Apiresponse from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'
import mongoose from 'mongoose'
import ApiResponse from '../utils/ApiResponse.js'

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
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

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie

    const { email, username, password } = req.body
    console.log(email);

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")

    // }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

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
            new: true // return the updated document after the update is applied
        }
    )

    const options = {
        httpOnly: true,
        secure: true
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

const refreshAccessToken = asyncHandler(async (req, res) => {

    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "invalid refresh Token")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        console.log(decodedToken.id)
        const user = await User.findById(decodedToken?.id);

        if (!user) {
            throw new ApiError(
                401,
                "invalid refresh token"
            )
        }

        if (incomingRefreshToken !== user.refreshToken) {
            throw new ApiError(401, "invalid refresh token")
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id);

        const options = {
            httpOnly: true,
            secure: true
        }

        return res
            .status(200)
            .cookie("refreshToken", newRefreshToken, options)
            .cookie("accessToken", accessToken, options)
            .json(
                new ApiResponse(
                    200,
                    {
                        refreshToken: newRefreshToken,
                        accessToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(
            401,
            error?.message || "invalid refresh token"
        )
    }
})

const changePassword = asyncHandler(async (req, res) => {
    // get the user id from the req.user object (set by the verifyJWT middleware)
    // get the old password and new password from the req.body
    // find the user in the database and compare the old password with the hashed password in the database
    // if the old password is incorrect, send an error response
    // if the old password is correct, hash the new password and update the user's password in the database
    // send a success response to the frontend

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "old password and new password are required")
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const isOldPasswordValid = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordValid) {
        throw new ApiError(401, "Invalid old password")
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password changed successfully"
            )
        )

})

const getCurrentUser = asyncHandler(async (req, res) => {
    // get the user id from the req.user object (set by the verifyJWT middleware)
    // find the user in the database and send the user data to the frontend
    if (!req.user) {
        throw new ApiError(404, "User not found")
    }
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                { user: req.user },
                "Current user fetched successfully"
            )
        )
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Account details updated successfully"
        ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar file is missing");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);

        if (!avatar.url) {  
            throw new ApiError(500,"Error Avatar file is not uploaded")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : {
                    avatar : avatar.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Avatar updated successfully"
            )
        )

})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

        if (!coverImageLocalPath) {
            throw new ApiError(400, "Cover image file is missing");
        }

        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

        if (!coverImage.url) {  
            throw new ApiError(500,"Error Cover image file is not uploaded")
        }

        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set : {
                    coverImage : coverImage.url
                }
            },
            {new : true}
        ).select("-password")

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                user,
                "Cover image updated successfully"
            )
        )

})


export { registerUser, loginUser, logoutUser, refreshAccessToken, changePassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage }