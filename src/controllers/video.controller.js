import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"



const getAllVideos = asyncHandler(async (req, res) => {

    const {
        page = 1,
        limit = 10,
        query,
        sortBy = "createdAt",
        sortType = "desc",
        userId
    } = req.query

    // build filter object
    const filter = {}

    // search query
    if (query) {
        filter.title = {
            $regex: query,
            $options: "i"
        }
    }

    // filter by user
    if (userId) {

        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid user id")
        }

        filter.owner = userId
    }

    // sorting
    const sortOptions = {}

    sortOptions[sortBy] =
        sortType === "asc" ? 1 : -1

    // pagination calculations
    const skip =
        (parseInt(page) - 1) * parseInt(limit)

    // fetch videos
    const videos = await Video.find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate(
            "owner",
            "username fullName avatar"
        )

    // total videos count
    const totalVideos =
        await Video.countDocuments(filter)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {
                    videos,
                    totalVideos,
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(
                        totalVideos / limit
                    )
                },
                "Videos fetched successfully"
            )
        )

})



const publishAVideo = asyncHandler(async (req, res) => {

    const { title, description } = req.body

    // validation
    if (!title || !description) {
        throw new ApiError(
            400,
            "Title and description are required"
        )
    }

    // get files
    const videoLocalPath =
        req.files?.videoFile?.[0]?.path

    const thumbnailLocalPath =
        req.files?.thumbnail?.[0]?.path

    // validations
    if (!videoLocalPath) {
        throw new ApiError(
            400,
            "Video file is required"
        )
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(
            400,
            "Thumbnail is required"
        )
    }

    // upload video
    const videoFile =
        await uploadOnCloudinary(videoLocalPath)

    // upload thumbnail
    const thumbnail =
        await uploadOnCloudinary(thumbnailLocalPath)

    // upload validation
    if (!videoFile?.url) {
        throw new ApiError(
            500,
            "Error uploading video"
        )
    }

    if (!thumbnail?.url) {
        throw new ApiError(
            500,
            "Error uploading thumbnail"
        )
    }

    // create video document
    const video = await Video.create({

        title,
        description,

        videoFile: videoFile.url,

        thumbnail: thumbnail.url,

        duration: videoFile.duration || 0,

        owner: req.user?._id

    })

    // fetch created video
    const uploadedVideo =
        await Video.findById(video._id)
            .populate(
                "owner",
                "username fullName avatar"
            )

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                uploadedVideo,
                "Video published successfully"
            )
        )

})



const getVideoById = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    // validate id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    // fetch video
    const video = await Video.findById(videoId)
        .populate(
            "owner",
            "username fullName avatar"
        )

    // video existence check
    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Video fetched successfully"
            )
        )

})



const updateVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    const { title, description } = req.body

    // validate id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    // find video
    const video =
        await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // ownership check
    if (
        video.owner.toString() !==
        req.user?._id.toString()
    ) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    // update thumbnail if provided
    let thumbnailUrl = video.thumbnail

    const thumbnailLocalPath =
        req.file?.path

    if (thumbnailLocalPath) {

        const thumbnail =
            await uploadOnCloudinary(
                thumbnailLocalPath
            )

        if (!thumbnail?.url) {
            throw new ApiError(
                500,
                "Error uploading thumbnail"
            )
        }

        thumbnailUrl = thumbnail.url
    }

    // update video
    const updatedVideo =
        await Video.findByIdAndUpdate(

            videoId,

            {
                $set: {
                    title: title || video.title,
                    description:
                        description || video.description,
                    thumbnail: thumbnailUrl
                }
            },

            {
                new: true
            }

        ).populate(
            "owner",
            "username fullName avatar"
        )

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                "Video updated successfully"
            )
        )

})



const deleteVideo = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    // validate id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    // find video
    const video =
        await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // ownership check
    if (
        video.owner.toString() !==
        req.user?._id.toString()
    ) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    // delete video
    await Video.findByIdAndDelete(videoId)

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Video deleted successfully"
            )
        )

})



const togglePublishStatus = asyncHandler(async (req, res) => {

    const { videoId } = req.params

    // validate id
    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }

    // find video
    const video =
        await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video not found")
    }

    // ownership check
    if (
        video.owner.toString() !==
        req.user?._id.toString()
    ) {
        throw new ApiError(
            403,
            "Unauthorized request"
        )
    }

    // toggle publish status
    video.isPublished =
        !video.isPublished

    await video.save({
        validateBeforeSave: false
    })

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                video,
                "Publish status toggled successfully"
            )
        )

})



export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}