import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"

import {v2 as cloudinary } from "cloudinary"
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret:process.env.CLOUDINARY_API_SECRET  
    });

const getAllVideos = asyncHandler(async (req, res) => {
   let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  page = Number(page);
  limit = Number(limit);

  const pipeline = [];

  // 1️⃣ Filter by user (OPTIONAL)
  if (userId) {
    if (!mongoose.isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid userId");
    }

    pipeline.push({
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    });
  }

  // 2️⃣ Search
  if (query) {
    pipeline.push({
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      },
    });
  }

  // 3️⃣ Sorting (SAFE)
  pipeline.push({
    $sort: {
      [sortBy]: sortType === "asc" ? 1 : -1,
    },
  });

  // 4️⃣ Pagination
  pipeline.push(
    { $skip: (page - 1) * limit },
    { $limit: limit }
  );

  // 5️⃣ Populate owner
  pipeline.push(
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    { $unwind: "$owner" }
  );

  const videos = await Video.aggregate(pipeline);

  return res.status(200).json(
    new ApiResponse(200, videos, "Videos fetched successfully")
  );
})

const publishAVideo = asyncHandler(async (req, res) => {
    
     const owner = req.user._id
    const { title, description,ispublished,} = req.body
     if(
    [title,description].some((field)=>
        field?.trim() === ""
    )
 ){
    throw new ApiError(400,"All fields are required")
 }

    const videoFileLocalPath = req.files?.videoFile[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

    if(!videoFileLocalPath){
        throw new ApiError(400,"Video file is required")
    }
    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail file is required")
    }

    const video = await uploadOnCloudinary(videoFileLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!(video || thumbnail)){
         throw new ApiError(400,"files file to uploaded")
    }

    const videoDatabase = await Video.create({
         videoFile:video.url || "",
         thumbnail:thumbnail.url || "",
         title:title,
         description:description,
         duration:video.duration || "00:00",
         views:"",
         ispublished:ispublished,
         owner:owner
    })
    const createdVideoDocument = await Video.findById(videoDatabase._id)

     if(!createdVideoDocument){
        throw new ApiError(500,"Something went wrong while registering the vidoe in the database")
      }

      return res.status(200)
      .json(
        new ApiResponse(200,createdVideoDocument,"Video saved and uploaded successfully")
      )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    const getVideo  = await Video.findById(videoId);

    return res 
    .status(200)
    .json(
        new ApiResponse(200,getVideo,"This is your video")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
   try {
      //TODO: update video details like title, description, thumbnail
    const { videoId } = req.params
    const {title,description} = req.body
    const thumbnailLocalPath = req.file?.path
     const oldthumbnail= await Video.findById(videoId)
    const oldthumbnailurl = oldthumbnail.thumbnail


    if(!thumbnailLocalPath){
    throw new ApiError(400,"thumbnail file is missing")
   }
   
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
   
    const updateVideo = await Video.findByIdAndUpdate(
        videoId,{
           $set:{
            title:title,
            description:description,
            thumbnail:thumbnail.url
           }
        },
           {new:true}
    )

   

const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  const publicIdWithExt = parts.slice(uploadIndex + 2).join("/");
  return publicIdWithExt.split(".")[0];
};

const publicIdoldthumbnail = getPublicIdFromUrl(oldthumbnailurl)

   const result =  await cloudinary.uploader.destroy(publicIdoldthumbnail,{
        resource_type:"image"
    })
    console.log(result);
    
    return res 
    .status(200)
    .json(
        new ApiResponse(200,updateVideo,"title description thumbnail updated successfully")
    )
   } catch (error) {
      throw new ApiError(500,error.message || "internal server error")
   }

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const deleteVideo = await Video.findByIdAndDelete(videoId);

    return res
    .status(200)
    .json(
        new ApiResponse(200,deleteVideo,"Video deleted successfully")
    )


})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Find the video first
    const video = await Video.findById(videoId);

    if (!video) {
        return res.status(404).json({ message: "Video not found" });
    }

    // Toggle the isPublished field
    video.isPublished = !video.isPublished;

    // Save the updated video
    const updatedVideo = await video.save();

    res.status(200).json(updatedVideo);
});


export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
