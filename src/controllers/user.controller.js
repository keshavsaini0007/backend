import asyncHandler from '../utils/AsyncHandler.js'
import ApiError from '../utils/ApiError.js'
import Apiresponse from '../utils/ApiResponse.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary } from '../utils/cloudinary.js'

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
    const { fullname, username, email, password } = req.body;
    console.log(fullname)
    console.log(email)
    console.log(username)
    console.log(password)


    // verify that the data is received from the frontend
    if ([fullname, username, email, password].some(
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

    let coverImageLocalPath ;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    // if avatar is necessary

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }


    // upload the avatar to cloudinary and get the url
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);


    if (!avatar) {
        throw new ApiError(500, "Failed to upload avatar");
    }

    // create the user in the database
    const newUser = await User.create({
        fullName: fullname,
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

export { registerUser }