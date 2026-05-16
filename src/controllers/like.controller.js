import mongoose, {isValidObjectId} from "mongoose"
import {Likes} from "../models/likes.model.js"
import { Video } from "../models/video.model.js"
import { Comments } from "../models/comments.model.js"
import { Tweet } from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"



//toggle video like

const toggleVideoLike = asyncHandler(async(req,res)=>{
    const{videoId} = req.params

    if(!videoId){
        throw new ApiError(400, "Invalid videoId")
    }

    //check existing like 

    const existingLike = Likes.findOne({
        likedby: req.user?._id,
        video: videoId
    })

    //unlike

    if(existingLike){
        Likes.findByAndDelete(
            existingLike._id
        )

        return res
        .status(200)
        .json(
            new ApiResponse
            (
                200,
                {},
                "video unliked successfully"
            )
        )
    }

    //create like
    const like = Likes.create({
        likedby: req.user?._id,
        video: videoId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            like,
            "Video liked successfully"
        )
    )
})

//toggle comment like 


const toggleCommentLike =
asyncHandler(async(req, res) => {

    const { commentId } = req.params

    // validate comment id
    if (!isValidObjectId(commentId)) {
        throw new ApiError(
            400,
            "Invalid comment id"
        )
    }

    // check existing like
    const existingLike =
        await Like.findOne({

            likedBy: req.user?._id,

            comment: commentId

        })

    // unlike
    if (existingLike) {

        await Like.findByIdAndDelete(
            existingLike._id
        )

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Comment unliked successfully"
            )
        )

    }

    // create like
    const like = await Like.create({

        likedBy: req.user?._id,

        comment: commentId

    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            like,
            "Comment liked successfully"
        )
    )

})

//toggle comment like

const toggleTweetLike =
asyncHandler(async(req, res) => {

    const { tweetId } = req.params

    // validate tweet id
    if (!isValidObjectId(tweetId)) {
        throw new ApiError(
            400,
            "Invalid tweet id"
        )
    }

    // check existing like
    const existingLike =
        await Like.findOne({

            likedBy: req.user?._id,

            tweet: tweetId

        })

    // unlike
    if (existingLike) {

        await Like.findByIdAndDelete(
            existingLike._id
        )

        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Tweet unliked successfully"
            )
        )

    }

    // create like
    const like = await Like.create({

        likedBy: req.user?._id,

        tweet: tweetId

    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            like,
            "Tweet liked successfully"
        )
    )

})


//get liked videos by user


const getLikedVideos= asyncHandler(async(req,res)=>{
    //fetch liked videos

    const likedVideos = Likes.find({
        likedby: req.user?._id,
        video:{
            $exists: true
        }
    }).populate({
        path: "video",
        populate:{
            path: 'owner',
            select:  "username fullName avatar"
        }
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            likedVideos,
            "Liked videos fetched successfully"
        )
    )



})

export{
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}



