import mongoose , {isValidObjectId} from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const createTweet = asyncHandler(async(req,res)=>{
    const{content} = req.body
    if(!content?.trim()){
        throw new ApiError(400, "content is required")
    }

    const tweet = await Tweet.create({
        content,
        owner: req.user?._id
    })
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            "tweet created Successfully"
        )
    )

})


/*
Frontend opens profile
↓
Frontend sends userId
↓
Backend validates id
↓
MongoDB finds tweets
whose owner = userId
↓
Populate owner details
↓
Return tweets
↓
Frontend renders profile tweets

 */

const getUserTweets = asyncHandler(async(req ,res)=>{
    const{userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user Id")
    }
    const tweets = Tweet.find({
        owner: userId
        
    }).populate(
        "owner",
        "username fullName avatar"
    )

    if(!tweets){
        throw new ApiError(404, "tweets not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "User tweets fetched successfully"
        )
    )
})


const updateTweet = asyncHandler(async(req ,res)=>{
    const{tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetId")
    }

    if(!content?.trim()){
        throw new ApiError(400, "content is required")
    }

    //find tweet
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400, "tweet not found")
    }

    //ownership check

    if(
        tweet.owner.toString() !==
        req.user?._id.toString()
    ){
        throw new ApiError(403,
         "Unauthorized request" )
    }

    //update content

    tweet.content = content
    await tweet.save()

    //response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "tweet updated successfully"
        )
    )

    //delete tweet

    const deleteTweet = asyncHandler(async(req , res)=>{
        const{tweetId} = req.params
        if(!isValidObjectId(tweetId)){
            throw new ApiError(400, "Invalid tweetId")
        }

        //find tweet
        const tweet = await Tweet.findById(tweetId)

        //existence check
        if(!tweet){
            throw new ApiError(404, "Tweet Not Found")
        }

        //onwership check
        if(tweet.owner.toString()!==req.userId?._id.toString()){
            throw new ApiError(403,"Unauthroized request")
        }

        //delete tweet

        Tweet.findOneAndDelete(tweetId)

        //respinse sending 

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

    export{
        createTweet,
        getUserTweets,
        updateTweet,
        deleteTweet




    }

    
})