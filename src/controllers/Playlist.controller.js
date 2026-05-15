import mongoose, {isValidObjectId} from "mongoose"
import { playlist } from "../models/Playlist.model.js"
import { Video } from "../models/video.model.js"
import { ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async(req,res)=>{
    const{name , description} = req.body

    if(!name?.trim()){
        throw new ApiError(400,"Playlist name is required")

    }

    //create Playlist

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id,
        videos: []
    })

    //response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist created Successfully"
        )
    )
})

//get User playlist

const getUserPlaylist = asyncHandler(async(req,res)=>{
    const {userId} = req.params

    //validation occurs
    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User id")
    }

    //fetch playlist

    const Playlists = Playlist.find({
        owner: userId

    }).populate(
        "owner",
        "username fullName avatar"
    )

    //response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "User playlist fetched Successfully"
        )
    )
})


//GetUserPlaylistById

const getPlaylistById = asyncHandler(async(req,res)=>{
    const{playlistId} = req.params

    /validation
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,  "Invalid id")
    }

    //fetchplaylist
    const playlist = 
    Playlist.findById(playlistId)
    .populate(
        "owner",
        "username fullName avatar"
    ).populate({
        path: "videos",
        populate:{
            path:"owner",
            select:"username fullName  avatar"
        }
    })

    //existence check
    if(!playlist){
        throw new ApiError(404, "playlist not found")
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


//ADD VIDEO TO PLAYLIST


const addVideotoPlaylist = asyncHandler(async(req,res)=>{
    const{playlistId,videoId} = req.params

    //validation of Id's
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }


    //find playlist

    const playlist = await Playlist.findById(playlistId)

    //existence check
    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    //ownership check
    if(playlist.owner.toString()!== req.user?._id.toString()){
        throw new ApiError(
            403, "Unauthorized request"
        )
    }

    //prevent duplicate videos
    if(playlist.videos.includes(videoId)){
        throw new ApiError(400, "video already exist in playlist")

    }

    //add video to playlist

    playlist.videos.push(videoId)
    //save changes
    await playlist.save()

    //response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video added to playlist successfully"
        )
    )

})



//remove video from playlist

const removeVideoFromPlaylist = asyncHandler(async(req,res)=>{
    const{playlistId, videoId} = req.params

    //validateId's

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "playlistid is Invalid")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "videoId is not valid")
    }

    //find playlist
    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(403, "Unauthorized request")
    }

    //remove video

    playlist.videos.pull(videoId)

    //save changes

    await playlist.save()

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Video removed from playlist successfully"
        )
    )
})



//Delete playlist

const deletePlaylist = asyncHandler(async(req,res)=>{
    const{playlistId} = req.params

    if(!playlistId){
        throw new ApiError(400, "Invalid playlist id")
    }

    //find playlist
    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404, "playlist not found")
    }

    //ownership check

    if(playlist.owner.toString() !==req.user?._id.toString()){
        throw new ApiError(403, "UNAUTHORIZED REQUEST")
    }


    //delete playlist

    Playlist.findByIdAndDelete(playlistId)

    //response
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





//updatePlaylist

const updatePlaylist = asyncHandler(async(req, res) => {

    const { playlistId } = req.params

    const { name, description } = req.body

    // validate id
    if (!isValidObjectId(playlistId)) {
        throw new ApiError(
            400,
            "Invalid playlist id"
        )
    }

    // find playlist
    const playlist =
        await Playlist.findById(playlistId)

    // existence check
    if (!playlist) {
        throw new ApiError(
            404,
            "Playlist not found"
        )
    }

    // ownership check
    if (
        playlist.owner.toString() !==
        req.user?._id.toString()
    ) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    // update fields
    playlist.name =
        name || playlist.name

    playlist.description =
        description || playlist.description

    // save changes
    await playlist.save()

    // response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "Playlist updated successfully"
        )
    )

})


export{
    createPlaylist,
    getUserPlaylist,
    getPlaylistById,
    addVideotoPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

