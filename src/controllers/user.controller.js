import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


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

    if(!username || !email){
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
     const loggedInUser = await User.findById(user._id).select('-password - refreshToken')

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


export { 
    registerUser,
    loginUser,
    logoutUser
};