import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
   const userId =  req.user?._id
   const {content} = req.body

   if(!content || !content.trim()){
    throw new ApiError(400,"content cant be empty")
   }
   const tweet = await  Tweet.create({
      owner:userId,
      content:content
   })

   if(!tweet){
    throw new ApiError(500,"Something went wrong while registering the tweet")
  }


  return res.status(201).json(
    new ApiResponse(201,tweet,"tweet registred Successfully")
  )
   
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }
    const allTweets =  await User.aggregate([
        {
            $match : {
          _id:new mongoose.Types.ObjectId(userId)
        }
        },{
           $lookup:{
          from:"tweets",
          localField:"_id",
          foreignField:"owner",
          as:"tweets"
        }
        },{
            $project:{
          fullName:1,
          username:1,
          avatar:1,
          coverImage:1,
          email:1,
          tweets:1,
        }
    }
    ])

    if (!allTweets?.length) {
      throw new ApiError(404,"tweets does not exists")
    }

    return res
    .status(200)
    .json(
      new ApiResponse(200,allTweets[0],"User channel feteched successfully")
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {tweetId} = req.params
    const {content}  = req.body
  const userId = req.user?._id

    if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID")
  }

  if (!content || !content.trim()) {
    throw new ApiError(400, "Content can't be empty")
  }

   const tweet = await Tweet.findOneAndUpdate(
    {
      _id: tweetId,
      owner: userId, 
    },
    {
      $set: { content: content.trim() },
    },
    { new: true }
  )
 if (!tweet) {
    throw new ApiError(404, "Tweet not found or unauthorized")
  }

  return res.status(200).json(
    new ApiResponse(200, tweet, "Tweet updated successfully")
  )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
     const {tweetId} = req.params
      const deleteTweet = await Tweet.findByIdAndDelete(tweetId);
     
         return res
         .status(200)
         .json(
             new ApiResponse(200,deleteTweet,"tweet deleted successfully")
         )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
