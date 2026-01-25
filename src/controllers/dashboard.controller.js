import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
   const userId = req.user?._id
   
   const channel = await User.aggregate([
    {
        $match:{
            _id:userId
        },
    },
    {
            $lookup:{
          from:"subscriptions",
          localField:"_id",
          foreignField:"channel",
          as:"subscribers"
        }
    },
    {
        $lookup:{
            from:"videos",
            localField:"_id",
            foreignField:"owner",
            as:"totalvideos"
        }
    },
    {
      $lookup: {
        from: "likes",
        let: { userVideos: "$totalvideos._id" },
        pipeline: [
            { $match: { $expr: { $in: ["$video", "$$userVideos"] } } }
        ],
        as: "videoLikes"
    }
    },
    {
        $lookup:{
            from:"tweets",
            localField:"_id",
            foreignField:"owner",
            as:"usertweetslikes",
            pipeline:[
                {
                    $lookup:{
                        from:"likes",
                        localField:"owner",
                        foreignField:"tweet",
                        as:"tweetsLikes",
                        pipeline:[
                            {
                                $addFields:{
                                    tweetsLikes:{
                                        $size:"$tweetsLikes"
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        }
    },
    {
        $addFields:{

            videoLikes:{
                $size:"$videoLikes"
            },
            tweetLikes:{
                $size:"$usertweetslikes"
            },
            totalvideos:{
                $size:"$totalvideos"
            },
            subscriberCount:{
                $size:"$subscribers"
            }

        }
    },{
        $project:{
          fullName:1,
          username:1,
          channelsSubscribedToCount:1,
          isSubscribed:1,
          avatar:1,
          coverImage:1,
          email:1,
         videoLikes:1,
         tweetLikes:1,
         totalvideos:1,
         subscriberCount:1
        }
    }
   ])

    if (!channel?.length) {
         throw new ApiError(404,"channel does not exists")
       }

       return res
    .status(200)
    .json(
      new ApiResponse(200,channel[0],"User channel feteched successfully")
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id
   const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip=(page-1) *limit



    const allVideos = await Video.find({owner:userId})
                             .sort({createdAt:-1})
                            .skip(skip)
                             .limit(limit)
 const totalVideos = await Video.countDocuments({ owner: userId });
       return res.status(200).json(
    new ApiResponse(200,
        {allVideos,
        totalVideos
        },
        "ChannelVideo fetched successfully"
    )
  )                       

})

export {
    getChannelStats, 
    getChannelVideos
    }