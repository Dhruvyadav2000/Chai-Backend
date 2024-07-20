import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {uploadCloudinary as uploadOnCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { jwt } from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
    try {
        console.log("userId: ",userId)
        const user = await User.findById(userId)

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateFreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {refreshToken, accessToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {

    const {fullName, email, userName, password} = req.body
    if([fullName, email, userName, password].some((field) => field?.trim() === "")){
        throw new ApiError(400,"All fields are required")
    }

    const existedUser = await User.findOne({
        $or: [{ userName}, {email}]
    })

    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }
    console.log("req.files ",req.files)
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }
    console.log("avatarLocalPath: ",avatarLocalPath)
    console.log("coverImageLocalPath: ",coverImageLocalPath)
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        userName: userName.toLowerCase()
    })

    const createdUser = await User.findById(user._id)
    .select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    )
    // res.status(200).json({
    //     message: "ok"
    // })
})

const loginUser = asyncHandler(async (req, res) => {
    const {userName, password, email} = req.body
    console.log(req.body)
    if(!(userName || email)){
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user){
        throw new ApiError(404, "User does not exists")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {refreshToken, accessToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken, options)
    .cookie("refreshToken",refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, refreshToken, accessToken
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new:true
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
            "User logged Out"
        )
    )
})

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if( incomingRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Refresh token is expired or invalid")
        }
    
        const {newRefreshToken, accessToken} = generateAccessTokenAndRefreshToken(user._id)
    
        const options = {
            httpOnly: true,
            secure: true
        }
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken".newRefreshToken, options)
        .json(
            new ApiResponse(200,
                {
                refreshToken: newRefreshToken, accessToken
                },
                "Access Token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const updateUserPassword = asyncHandler(async (req, res) => {
    const {oldPassword, newPassword} = req.body;

    if(oldPassword === newPassword){
        throw new ApiError(400, "Please enter a different password")
    }

    const user = User.findById(req.user?._id)

    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isOldPasswordCorrect){
        throw new ApiError(400, "Entered password doesn't match")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200,
            {},
            "Password changed Successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res.
    status(200).
    json(
        new ApiResponse(
            200,
            req.user,
            "User fetched Successfully"
        )
    )
})

const updateAccountDetails = asyncHandler( async (req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName,
                email
            }
        },
        {
            new: true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account details updated Successfully"
        )
    )
})

const udpateUserAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(404,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading the avatar file")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:
            {
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar image got updated Successfully"
        )
    )
})

const updateUserCoverImage = asyncHandler( async(req,res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(404, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage){
        throw new ApiError(400, "Error while uploading cover image file")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover Image got updated successfully"
        )
    )
})

const getUserChannelProfile = asyncHandler( async(req,res) => {
    const {username} = req.params

    if(!username){
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            } 
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscription",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size: "$subscribers"
                },
                channelsSubscribedTo:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in: [req.user?._id, "subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelsSubscribedTo: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel){
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    )
})

const getWatchHistory = asyncHandler( async (req, res) => {
    const user = User.aggregate([
        {
            $match:{
                _id: mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName: 1,
                                        userName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch histroy fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    updateUserPassword,
    updateAccountDetails,
    udpateUserAvatarImage,
    updateUserCoverImage,
    getWatchHistory,
    getUserChannelProfile
}