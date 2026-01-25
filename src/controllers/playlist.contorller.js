import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from '../models/video.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description,videos} = req.body
    
    if(!name || !description){
        throw new ApiError(400,"Name and description are required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        videos:videos||[],
        owner:req.user._id
    })

    if(!playlist){
        throw new ApiError(500,"Not able to create the playlist")
    }
     return res
    .status(200)
    .json(
      new ApiResponse(200,playlist,"playlist created successfully")
    )

    //TODO: create playlist
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
  const playlist = await Playlist.aggregate([
       {
        $match:{
            owner:new mongoose.Types.ObjectId(userId)
        }
       },{
        $lookup:{
          from:"videos",
          localField:"videos",
          foreignField:"_id",
          as:"videos",
          pipeline:[
            {
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                 pipeline:[
                  {
                    $project:{//write this pipeline outside the owner field 
                      fullName:1,
                      username:1,
                      avatar:1
                    }
                  }
                 ]
              }
            },
            {
                $addFields:{
                  owner:{
                    $first:"$owner"
                  }
                }
              
            }
          ]
       }
    }
  ])
   return res
     .status(200)
     .json(
      new ApiResponse(
        200,
        playlist[0],
        "User Playlist fetched successfully"
      )
     )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
  const playlist = await Playlist.aggregate([
       {
        $match:{
            _id:new mongoose.Types.ObjectId(playlistId)
        }
       },{
        $lookup:{
          from:"videos",
          localField:"videos",
          foreignField:"_id",
          as:"videos",
          pipeline:[
            {
              $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner",
                 pipeline:[
                  {
                    $project:{//write this pipeline outside the owner field 
                      fullName:1,
                      username:1,
                      avatar:1
                    }
                  }
                 ]
              }
            },
            {
                $addFields:{
                  owner:{
                    $first:"$owner"
                  }
                }
              
            }
          ]
       }
    }
  ])
   return res
     .status(200)
     .json(
      new ApiResponse(
        200,
        playlist[0],
        "User Playlist fetched successfully"
      )
     )

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
      if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video id")
  }

   const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id
  })

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or access denied")
  }

  const videoExists = await Video.exists({ _id: videoId })
  if (!videoExists) {
    throw new ApiError(404, "Video not found")
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId }
    },
    { new: true }
  )
  return res.status(200).json(
    new ApiResponse(
      200,
      updatedPlaylist,
      "Video added to playlist successfully"
    )
  )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
     if (
    !mongoose.Types.ObjectId.isValid(playlistId) ||
    !mongoose.Types.ObjectId.isValid(videoId)
  ) {
    throw new ApiError(400, "Invalid playlist or video id")
  }

   const playlist = await Playlist.findOne({
    _id: playlistId,
    owner: req.user._id
  })

  if (!playlist) {
    throw new ApiError(404, "Playlist not found or access denied")
  }

  const videoExists = await Video.exists({ _id: videoId })
  if (!videoExists) {
    throw new ApiError(404, "Video not found")
  }
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId }
    },
    { new: true }
  )
  return res.status(200).json(
    new ApiResponse(
      200,
      updatedPlaylist,
      "Video remove from playlist successfully"
    )
  )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
     if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id")
  }


  const deletedPlaylist = await Playlist.findOneAndDelete({
    _id: playlistId,
    owner: req.user._id
  })

  if (!deletedPlaylist) {
    throw new ApiError(404, "Playlist not found or access denied")
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      deletedPlaylist,
      "Playlist deleted successfully"
    )
  )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
     if (!mongoose.Types.ObjectId.isValid(playlistId)) {
    throw new ApiError(400, "Invalid playlist id")
  }

  // 2️⃣ Ensure at least one field is provided
  if (!name && !description) {
    throw new ApiError(400, "At least one field (name or description) is required")
  }

  // 3️⃣ Update playlist with ownership check
  const updatedPlaylist = await Playlist.findOneAndUpdate(
    {
      _id: playlistId,
      owner: req.user._id
    },
    {
      $set: {
        ...(name && { name }),
        ...(description && { description })
      }
    },
    {
      new: true,
      runValidators: true
    }
  )

  if (!updatedPlaylist) {
    throw new ApiError(404, "Playlist not found or access denied")
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      updatedPlaylist,
      "Playlist updated successfully"
    )
  )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
