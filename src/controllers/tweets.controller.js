import mongoose from "mongoose"
import asyncHandler from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { Tweet } from "../models/tweets.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"


const createTweet = asyncHandler(async (req,res) => {
    const {content} = req.body

    if(!content){
        throw new ApiError(400, "Please add some content in the tweet!")
    }

    const tweet = await Tweet.create({
        owner: mongoose.Types.ObjectId(req.user?._id),
        content
    })

    if(!tweet){
        throw new ApiError(400, "Something went wrong while creating the tweet.")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet got created successfully"
        )
    )

})

const getUserTweets = asyncHandler( async(req,res) => {
    const user = req.user

    const userTweets = await Tweet.aggregate(
        {
            $match:{
                owner: mongoose.Types.ObjectId(req.user?._id)
            }
        }
    )
    if(userTweets.length === 0){
        throw new ApiError(400,"No tweets are there for the logged in user")
    }

    return res
    .status(200)
    .json( new ApiResponse(200,userTweets,"User tweets fetched successfully"))
})

const updateTweet = asyncHandler( async (req, res) => {
    const tweetId = req.params

    if(!tweetId){
        throw new ApiError(400, "Invalid tweet Id")
    }

    const {content} = req.body

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {
            new: true
        }
    )
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet got updated successfully"
        )
    )
})

const deleteTweet = asyncHandler( async (req,res) => {
    const tweetId = req.params

    if(!tweetId){
        throw new ApiError(400, "Invalid Tweet delete request")
    }

    const deletedTweet = await Tweet.deleteOne({_id: tweetId})

    if(!deletedTweet){
        throw new ApiError(400, "ERROR: Tweet doesn't exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Tweet deleted Successfully"
        )
    )
})


export {createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}