import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  console.log("toggle is hitting");
  const { channelId } = req.params;
  const userId = req.user?._id || null;
  console.log(channelId, userId);
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(401, "Invalid Channel Id");
  }
  const channel = await User.findById(channelId);
  if (!channel) {
    throw ApiError(404, "Channel does not exits");
  }
  let message;
  const existingUser = await Subscription.findOne({
    channel: channelId,
    subscriber: userId,
  });
  if (existingUser) {
    await Subscription.findByIdAndDelete(existingUser?._id);
    message = "Successfully unsubscribe from this channel";
  } else {
    await Subscription.create({
      channel: channelId,
      subscriber: userId,
    });
    message = "User successfully subscribed to this channel";
  }
  res.status(200).json(new ApiResponse(200, {}, message));
});
const getChannelSubscriberList = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!mongoose.isValidObjectId(channelId)) {
    throw new ApiError(401, "Invalid Channel Id");
  }
  const checkChannel = await User.findById(channelId);
  if (!checkChannel) {
    throw new ApiError(400, "Channel doesn't exits");
  }
  const channelSubscribersList = await Subscription.find({
    channel: channelId,
  })
    .populate("subscriber", "fullName username avatar")
    .exec();

  console.log(channelSubscribersList);
  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channelSubscribersList,
        "Channel subscribe list fetched successfully"
      )
    );
});

export { toggleSubscription, getChannelSubscriberList };
