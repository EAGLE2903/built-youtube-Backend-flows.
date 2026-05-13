import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


/*
we follow same rules here
1. get user details from frontend 
2. validation - not empty
3.check if user already exists: username, email
4. check for images, check for avatar
5. upload them to cloudinary , avatr
6. creat user object - create entry in db
7. remove password and refresh tokens from repsonse 
8. check for user creation
9. return response

 */

const generateAccessAndRefreshTokens = async(userId)=>{
    try {
    const user =  await User.findById(userId)
    const accessToken =  user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}

        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
        
    }
}

const registerUser = asyncHandler(async (req, res) => {

    console.log("STEP 1");

    const { fullName, email, username, password } = req.body;

    console.log("STEP 2");

    // 🔴 Validate fields
    if (
        [fullName, email, username, password].some((field) => !field?.trim())
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // 🔴 Ensure files are received
    if (!req.files) {
        throw new ApiError(400, "Files not received. Use form-data.");
    }

    // 🔴 Extract file paths
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    //the thing is if you dont want to put coverimage and you dont want to get error so just put this Syntax
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    console.log("FILES:", req.files);
    console.log("avatar path:", avatarLocalPath);
    console.log("cover path:", coverImageLocalPath);

    // 🔴 Avatar required
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 🔴 Check if user exists
    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }]
    });

    console.log("STEP 3");

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // 🔴 Upload to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    const coverImage = coverImageLocalPath
        ? await uploadOnCloudinary(coverImageLocalPath)
        : null;

    console.log("CLOUD AVATAR:", avatar?.url);
    console.log("CLOUD COVER:", coverImage?.url);

    if (!avatar) {
        throw new ApiError(500, "Avatar upload failed");
    }

    // 🔴 Create user
    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });

    console.log("✅ USER CREATED:", user._id);

    // 🔴 Remove sensitive fields
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    console.log("STEP 4");

    if (!createdUser) {
        throw new ApiError(500, "User creation failed");
    }

    // 🔴 Final response
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


const loginUser = asyncHandler(async(req,res) =>{
    //req body - data
    //username or email
    //find the user
    //password check
    //access and refresh token generation process
    //send them in cookies

    const{email,username,password} = req.body

    if(!(username || email)){
        throw new ApiError(400,"username or password is required")

    }

    const user = await User.findOne({
        $or:[{username},{email}] // this is or operator in this you can pass operators objects in arrays

    })

    if(!user){
        throw new ApiError(404, "User doesnot exist")
    }

    //check password

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid User credentials")
    }

    //generation of access and refresh tokens

    //as we have build a method for this already

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
     const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

    //sending cookies
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200).cookie("accessToken" , accessToken, options)
    .cookie("refreshToken" , refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
    )

    
})

const logoutUser = asyncHandler(async(req,res)=>{
   await  User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
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
    .json(new ApiResponse(200,{}, "User logged Out"))
    
})

//making access token end pointsss for not let user login again and again

const refreshAccessToken = asyncHandler(async(req,res)=>
{
    const IncomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!IncomingRefreshToken){
      throw new ApiError(401, "unauthorized request")
   }
    try{
    const decodedToken = jwt.verify(
        IncomingRefreshToken, 
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if(!user){
        throw new ApiError(401, "Invalid refresh token")
    }


    if(IncomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "refresh token is expired ot used")
    }

    const options = {
        httpOnly: true,
        secure: true
    }

   const {accessToken, newrefreshToken} =  await generateAccessAndRefreshTokens(user._id)
    return res
    .status(200)
    .cookie("accessToken" , accessToken , options)
    .cookie("refreshToken",  newrefreshToken , options)
    .json(
        new ApiResponse(
            200,
            {
                accessToken, refreshToken: newrefreshToken
            },
            "Access token refreshed"
        )
    )
} catch(error){
    throw new ApiError(401, error?.message || "Invalid refresh token")
}

})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const{oldPassword, newPassword} = req.body
     const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")


    
    }

    user.password  = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))

})


const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(200, req.user, "current user fetched successfully")
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
    const{fullName, email}= req.body

    if(!(fullName || email)){
        throw new ApiError(400, "all fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
           $set:{
            fullName,
            email: email
           }
        },
        {
            new: true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated succesfully"))
})


const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})





export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
};