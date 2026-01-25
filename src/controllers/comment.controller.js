import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from '../models/video.model.js'
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
   const page = Number(req.query.page) || 1
const limit = Number(req.query.limit) || 10
    const skip=(page-1) *limit

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
  throw new ApiError(400, "Invalid videoId")
}
  const comments = await Comment.find({video:videoId})
                        .sort({createdAt:-1})
                        .skip(skip)
                        .limit(limit)

  return res.status(200).json(
    new ApiResponse(200,
        comments,
        "Comments fetched successfully"
    )
  )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
        const {videoId} = req.params
        const userId = req.user?._id
        const{content} = req.body

         if (!mongoose.Types.ObjectId.isValid(videoId)) {
  throw new ApiError(400, "Invalid videoId")
         }
     if(!userId){
        throw new ApiError(400,"userId is needed")
     }
     if(!content.trim()){
        throw new ApiError(400,"content is needed")
     }
     const videoExists = await Video.exists({ _id: videoId })
if (!videoExists) {
  throw new ApiError(404, "Video not found")
}

     const comment = await Comment.create({
        content:content.trim(),
        video:videoId,
        owner:userId
     })

     if(comment){
        return res.status(201).json(
            new ApiResponse(201,comment,"Comment added successfully")
        )
     }else{
        throw new ApiError(500,"Something went wrong while saving comment")
        
     }

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
     const{content} = req.body
     const userId = req.user?._id
     const comment = await Comment.findById(commentId)

     if(comment.owner.equals(userId)){
        throw new ApiError(400,"you are not the authorized to edit ")
     }
      if(!content||!content.trim()){
        throw new ApiError(400,"content is needed")
     }

     const updatedComment = await Comment.findOneAndUpdate(
        {_id:commentId},{
            $set:{
                content:content
            }
        },
        {new:true}
     )

     return res
     .status(200)
     .json(new ApiResponse(200,updatedComment,"Comment content is updated successfully"))
})


const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
     const { commentId } = req.params
     const userId = req.user._id

     const deletedComment = await Comment.findOneAndDelete({
        _id:commentId,
        owner:userId
     })
     if(!deletedComment){
        throw new ApiError(404,"Comment not found or you are not authorized to delete it")
     }

        return res
        .status(200)
        .json(
            new ApiResponse(200,deletedComment,"Comment deleted successfully")
        )
    
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
