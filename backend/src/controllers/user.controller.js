import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    console.log("Registration request received:", req.body);
    
    const { name, username, email, password, categories } = req.body

    if ([name, username, email, password].some((field) => field?.trim() === "")) {
        console.log("Validation failed: Missing required fields");
        throw new ApiError(400, "All fields are required")
    }

    console.log("Checking for existing user with email:", email, "or username:", username);
    
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        console.log("User already exists:", existedUser.email);
        throw new ApiError(409, "User with email or username already exists")
    }

    const user = await User.create({
        name,
        username: username.toLowerCase(),
        email,
        password,
        categories: categories || [],
        userFirstSignUp: new Date(),
        lastLoginDate: new Date()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    return res.status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: createdUser,
                    accessToken,
                    refreshToken
                },
                "User registered successfully"
            )
        )
})

const loginUser = asyncHandler(async (req, res) => {
    console.log("Login request received:", req.body);
    
    const { email, username, password } = req.body

    if (!username && !email) {
        console.log("Validation failed: No username or email provided");
        throw new ApiError(400, "username or email is required")
    }

    console.log("Looking for user with email:", email, "or username:", username);
    
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        console.log("User not found");
        throw new ApiError(404, "User does not exist")
    }

    console.log("User found, checking password");
    
    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        console.log("Invalid password");
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    // Update last login date
    user.lastLoginDate = new Date()
    await user.save({ validateBeforeSave: false })

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
        }

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200, 
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const getCurrentUser = asyncHandler(async(req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User fetched successfully"
        ))
})

const deleteAccount = asyncHandler(async(req, res) => {
    const userId = req.user._id

    const deletedUser = await User.findByIdAndDelete(userId)

    if (!deletedUser) {
        throw new ApiError(404, "User not found")
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production'
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "Account deleted successfully"))
})

const getAppVersion = asyncHandler(async(req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            { version: "v1.1.0" },
            "App version fetched successfully"
        ))
})

const updateUserCategories = asyncHandler(async(req, res) => {
    const { categories } = req.body

    if (!categories || !Array.isArray(categories)) {
        throw new ApiError(400, "Categories must be an array")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                categories: categories
            }
        },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Categories updated successfully"))
})

const updateUserProfile = asyncHandler(async(req, res) => {
    const { name, username } = req.body

    // Check if username is already taken by another user
    if (username) {
        const existingUser = await User.findOne({
            username: username.toLowerCase(),
            _id: { $ne: req.user._id }
        })

        if (existingUser) {
            throw new ApiError(409, "Username is already taken")
        }
    }

    const updateFields = {}
    if (name) updateFields.name = name
    if (username) updateFields.username = username.toLowerCase()

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: updateFields },
        { new: true }
    ).select("-password -refreshToken")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Profile updated successfully"))
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    deleteAccount,
    getAppVersion,
    updateUserCategories,
    updateUserProfile
}