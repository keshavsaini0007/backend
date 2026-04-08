import { v2 as cloudinary } from 'cloudinary'
import fs from 'fs'


// this configuration allows us to upload files to cloudinary and get the url of the uploaded file
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
})


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            return null
        }
        // Upload the file to Cloudinary
        const result = await cloudinary.uploader.upload(localFilePath, {resource_type: 'auto'})
        console.log("file is uploaded on cloudinary", result.url)
        return result
    }catch (error) {
        fs.unlinkSync(localFilePath)// remove the file from local storage if there is an error while uploading to cloudinary
        return null
    }
}

export default uploadOnCloudinary;