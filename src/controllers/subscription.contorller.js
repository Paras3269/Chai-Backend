import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
   if(!isValidObjectId(channelId)){
    throw new ApiError(400,"Invalid channel id")
   }
   const existingSubscription = await Subscription.findOne({
    channel:channelId,
    subscriber:req.user._id
   })

   if(existingSubscription){
     await Subscription.deleteOne({_id:existingSubscription._id})

     return res.status(200).json(
        new ApiResponse(200,{},"Channel unsubscribed")
     )
   }

    await Subscription.create({
        channel:channelId,
        subscriber:req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200,{},"Channel subscribed")
    )

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    
     if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id")
  }

  // Find all subscriptions for this channel
  const subscriptions = await Subscription.find({ channel: channelId }).populate('subscriber', 'name email avatar')

  // Map to return only user info
  const subscribers = subscriptions.map(sub => sub.subscriber)

  return res.status(200).json(
    new ApiResponse(200, { subscribers }, "Subscribers fetched successfully")
  )
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber id")
  }

  // Find all subscriptions where this user is the subscriber
  const subscriptions = await Subscription.find({ subscriber: subscriberId })
    .populate('channel', 'name email avatar') // get channel info

  // Extract only channel info
  const channels = subscriptions.map(sub => sub.channel)

  return res.status(200).json(
    new ApiResponse(200, { channels }, "Subscribed channels fetched successfully")
  )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}