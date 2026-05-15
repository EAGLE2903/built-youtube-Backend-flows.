import mongoose , {isValidObjectId} from "mongoose"
import { User } from '../models/user.model.js'
import { Subscription } from '../models/subscription.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'

//toggle susbscribe?unsubscribe

const toggleSubscription = asyncHandler(async(req,res)=>{
    const{channelId} = req.params
    //validate channelId

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channelId")


    }

    //prevention of self subscription

    if(channelId === req.user?._id.toString()){
        throw new ApiError(  400, "you cannot subscribe to your channel")
      
    }

    //check if subscription alrady placed
    const existingSubscription = await Subscription.findOne({
        subsciber: req.user?._id,
        channel: channelId
    })

    //UnsubscribeLogic

    if(existingSubscription){
        await Subscription.findByIdAndDelete(
            existingSubscription._id
        )
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Channel Unsubscribe Successfully"
            )
        )
    }

    //subscribe logic

    const subscription = await Subscription.create({
        subsciber: req.user?._id,
        channel: channelId
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            subscription,
            "Channel Subscribed Successfully"
        )
    )
})


//get all subscriber of a channel
const getUserChannelSubscriber = asyncHandler(async(req,res)=>{
    const{channelId} = req.params
    //validation of channel id
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid channel id")
    }

    //find subscribers
    const subscribers = Subscription.find({
        channel: channelId
    }).populate(
        "subscriber",
        "username fullName avatar"
    )
})


//get channels subscribed by user

const getSubscribedChannels = asyncHandler(async(req,res)=>{
    const{subscriberId}  = req.params
    //validate subscriberId

    if(!isValidObjectId(subscriberId)){
        throw new ApiError(400, "Invalid Subscriber id")
    }

    //find subscribed channels

    const SubscribedChannels = await Subscription.find({
        subscriber: subscriberId
    }).populate(
        "channel",
        "username fullName avatar"
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, subscribedchannels,
            "Subscribed channels fetched successfully"
        )
    )
})

export{
    toggleSubscription,
    getUserChannelSubscriber,
    getSubscribedChannels
}
