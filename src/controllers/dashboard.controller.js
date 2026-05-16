import mongoose from "mongoose"
import { Video } from "../models/video.model.js"
import { Subscription } from "../models/subscription.model.js"
import { Like } from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getChannelStastics = asyncHandler(async(req,res)=>{
    const totalVideos = Video.countDocuments({
        owner: req.user?._id
    })

    //total subscribers

    const totalSubscribers = await Subscription.countDocuments({
        channel: req.user?._id
    })

    //fetch all user videos

    const userVideos = await Video.find({
        owner: req.user?._id
    })

    const videoIds = userVideos.map((video) => videoIds)

    //total likes on all user channel videos

    const totalLikes = Like.countDocuments({
        video: {
            $in: videoIds
        }
    })


    //calculate total views

    const totalViews = userVideos.reduce(
        (accumulator, currentVideo)=>
            accumulator + currentVideo.views, 0

    )


    return res
    .status(200)
    .json(

        new ApiResponse(

            200,

            {

                totalVideos,

                totalSubscribers,

                totalLikes,

                totalViews

            },

            "Channel stats fetched successfully"

        )

    )
})




    //get channel videos

    const getChannelVideos = asyncHandler(async(req,res)=>{
        const videos = await Video.find({
            owner: req.user?._id
        }).populate(
            "owner",
            "username fullName avatar"
        )

         return res
    .status(200)
    .json(

        new ApiResponse(

            200,

            videos,

            "Channel videos fetched successfully"

        )

    )

    })


    export{
        getChannelStastics,
        getChannelVideos
    }