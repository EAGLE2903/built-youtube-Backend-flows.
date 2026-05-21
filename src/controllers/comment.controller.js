import mongoose, { isValidObjectId } from "mongoose"

import { Comment } from "../models/comment.model.js"

import { Video } from "../models/video.model.js"

import { ApiError } from "../utils/ApiError.js"

import { ApiResponse } from "../utils/ApiResponse.js"

import { asyncHandler } from "../utils/asyncHandler.js"



 //GET VIDEO COMMENTS


const getVideoComments = asyncHandler(async(req,res)=>{

    const { videoId } = req.params

    const { page = 1, limit = 10 } = req.query


    //validate video id

    if(!isValidObjectId(videoId)){
        throw new ApiError(
            400,
            "Invalid video id"
        )
    }


    //pagination calculations

    const pageNumber = Number(page)

    const limitNumber = Number(limit)

    const skip = 
        (pageNumber - 1) * limitNumber


    //total comments count

    const totalComments = 
        await Comment.countDocuments({

            video: videoId

        })


    //total pages

    const totalPages = 
        Math.ceil(
            totalComments / limitNumber
        )


    //next and previous page checks

    const hasNextPage =
        pageNumber < totalPages

    const hasPreviousPage =
        pageNumber > 1


    //fetch comments

    const comments =
        await Comment.find({

            video: videoId

        })

        .populate(
            "owner",
            "username avatar"
        )

        .sort({
            createdAt: -1
        })

        .skip(skip)

        .limit(limitNumber)


    //response

    return res
    .status(200)
    .json(
        new ApiResponse(

            200,

            {

                comments,

                currentPage: pageNumber,

                totalPages,

                totalComments,

                hasNextPage,

                hasPreviousPage

            },

            "Comments fetched successfully"

        )
    )

})




/*
|--------------------------------------------------------------------------
| ADD COMMENT
|--------------------------------------------------------------------------
*/

const addComment = asyncHandler(async(req,res)=>{

    const { videoId } = req.params

    const { content } = req.body


    //validate video id

    if(!isValidObjectId(videoId)){
        throw new ApiError(
            400,
            "Invalid video id"
        )
    }


    //validate content

    if(!content?.trim()){
        throw new ApiError(
            400,
            "Comment content is required"
        )
    }


    //create comment

    const comment =
        await Comment.create({

            content,

            video: videoId,

            owner: req.user?._id

        })


    //response

    return res
    .status(201)
    .json(
        new ApiResponse(

            201,

            comment,

            "Comment added successfully"

        )
    )

})




/*
|--------------------------------------------------------------------------
| UPDATE COMMENT
|--------------------------------------------------------------------------
*/

const updateComment = asyncHandler(async(req,res)=>{

    const { commentId } = req.params

    const { content } = req.body


    //validate comment id

    if(!isValidObjectId(commentId)){
        throw new ApiError(
            400,
            "Invalid comment id"
        )
    }


    //validate content

    if(!content?.trim()){
        throw new ApiError(
            400,
            "Content is required"
        )
    }


    //find comment

    const comment =
        await Comment.findById(commentId)


    //existence check

    if(!comment){
        throw new ApiError(
            404,
            "Comment not found"
        )
    }


    //ownership check

    if(
        comment.owner.toString() !==
        req.user?._id.toString()
    ){
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }


    //update comment

    comment.content = content


    //save changes

    await comment.save()


    //response

    return res
    .status(200)
    .json(
        new ApiResponse(

            200,

            comment,

            "Comment updated successfully"

        )
    )

})





/*
|--------------------------------------------------------------------------
| DELETE COMMENT
|--------------------------------------------------------------------------
*/

const deleteComment = asyncHandler(async(req,res)=>{

    const { commentId } = req.params


    //validate comment id

    if(!isValidObjectId(commentId)){
        throw new ApiError(
            400,
            "Invalid comment id"
        )
    }


    //find comment

    const comment =
        await Comment.findById(commentId)


    //existence check

    if(!comment){
        throw new ApiError(
            404,
            "Comment not found"
        )
    }


    //ownership check

    if(
        comment.owner.toString() !==
        req.user?._id.toString()
    ){
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }


    //delete comment

    await Comment.findByIdAndDelete(commentId)


    //response

    return res
    .status(200)
    .json(
        new ApiResponse(

            200,

            {},

            "Comment deleted successfully"

        )
    )

})




export {

    getVideoComments,

    addComment,

    updateComment,

    deleteComment

}