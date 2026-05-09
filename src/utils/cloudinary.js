import dotenv from "dotenv";
dotenv.config();  // ✅ FORCE LOAD HERE

import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// CONFIG
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// DEBUG
console.log("CLOUDINARY CONFIG:", {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY ? "LOADED" : "MISSING",
    secret: process.env.CLOUDINARY_API_SECRET ? "LOADED" : "MISSING"
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        });

        // delete temp file
        fs.unlinkSync(localFilePath);

        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        console.log("CLOUDINARY ERROR:", error);
        return null;
    }
};

export { uploadOnCloudinary };