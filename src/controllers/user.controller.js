import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const registerUser = asyncHandler(async (req, res) => {

    console.log("STEP 1");

    const { fullName, email, username, password } = req.body;

    console.log("STEP 2");

    // ✅ FILE CHECK (NEW)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("FILES:", req.files);
    console.log("avatar path:", avatarLocalPath);
    console.log("cover path:", coverImageLocalPath);

    // 🔴 Validation
    if (
        [fullName, email, username, password].some((field) => !field?.trim())
    ) {
        throw new ApiError(400, "All fields are required");
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // 🔴 Check if user already exists
    const existedUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email }]
    });

    console.log("STEP 3");

    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }

    // 🔴 TEMP (still local path, not cloudinary yet)
    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        avatar: avatarLocalPath,
        coverImage: coverImageLocalPath || ""
    });

    console.log("✅ USER CREATED:", user._id);

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    console.log("STEP 4");

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});

export { registerUser };