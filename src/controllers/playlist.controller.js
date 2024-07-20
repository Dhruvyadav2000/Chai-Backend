import mongoose, { Schema } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse";


const createPlaylist = asyncHandler( async(req,res) => {
    const {name, description} = req.body

    if(!name && !description){
        throw new ApiError(400, "Name and Description are required")
    }

    const newPlaylist = await Playlist.create({
        name,
        description,
        owner: Schema.Types.ObjectId(req.user?._id)
    })

    if(!newPlaylist){
        throw new ApiError(400, "Something went wrong while creating the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newPlaylist,
            "Playlist got created successfully"
        )
    )
})

const getUserPlaylists = asyncHandler( async(req,res) => {
    const {userId} = req.params

    if(!userId){
        throw new ApiError(400, "Invalid User Id")
    }

    const playlist = Playlist.aggregate({
        $match:{
            owner: mongoose.Schema.Types.ObjectId(userId)
        }
    })

    if(!playlist){
        throw new ApiError(400, "No playlist is there for the logged in user")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "User's playlist fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler( async(req,res) => {
    const {playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400, "Playlist doesn't exists")
    }

    const playlist = Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400, "No data is there inside the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist fetched successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler( async(req,res)=>{
    const {playlistId, videoId} = req.params

    if(!playlistId || !videoId){
        throw new ApiError(400, "Invalid playlist and video Id")
    }

    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet:{
                video: videoId
            }
        },
        {
            new: true
        }
    )

    if(!newPlaylist){
        throw new ApiError(400, "Error while adding video to playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newPlaylist,
            "Video added to the playlist successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    
    if(!playlistId || !videoId){
        throw new ApiError(400, "Invalid playlist and video Id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:
            {
                video: videoId    
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(400, "Error while removing video from the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Video removed from the playlist successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400, "Invalid playlist Id")
    }

    const deletedPlaylist = Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(400, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Playlist deleted successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!playlistId){
        throw new ApiError(400, "Invalid playlist Id")
    }

    if([name, description].some((field) => field?.trim() === "")){
        throw new ApiError(400,"Name and description are required fields")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set:{
                name,
                description
            }
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(400, "No such playlist exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "Playlist updated successfully"
        )
    )
})
export {createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}