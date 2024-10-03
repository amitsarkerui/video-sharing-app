import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/likes.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video ID");
  }
  const checkVideo = await Video.findById(videoId);
  if (!checkVideo) {
    throw new ApiError(400, "Video doesn't exists");
  }
  let message;
  const existsLike = await Like.findOne({
    video: videoId,
    likedBy: req.user?._id,
  });

  if (existsLike) {
    await Like.findByIdAndDelete(existsLike?._id);
    message = "Video Unlike successfully";
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
      comment: null,
    });
    message = "Video like successfully";
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});
const getVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Object ID");
  }
  const isExistsVideo = await Video.findById(videoId);
  if (!isExistsVideo) {
    throw new ApiError(401, "Video does not exists");
  }
  const videoLikes = await Like.find({ video: videoId })
    .populate("likedBy", "fullName username avatar")
    .exec();
  const videoLikesDetails = {
    videoLikes,
    likesCount: videoLikes.length,
  };
  console.log(videoLikesDetails);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoLikesDetails,
        "Video Likes fetched successfully"
      )
    );
});
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.body;
  const { videoId } = req.params;
  if (!(isValidObjectId(commentId) && isValidObjectId(videoId))) {
    throw new ApiError(400, "Invalid video or comment id");
  }
  let message;
  const existsLikes = await Like.findOne({
    comment: commentId,
    likedBy: req.user?._id,
  });
  if (existsLikes) {
    await Like.findByIdAndDelete(existsLikes?._id);
    message = "Comment Unlike Successfully";
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user?._id,
      comment: commentId,
    });
    message = "Comment like successfully";
  }
  return res.status(200).json(new ApiResponse(200, {}, message));
});

export { toggleVideoLike, getVideoLikes, toggleCommentLike };
