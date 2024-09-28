import { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Comment } from "../models/comment.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const isAuthUser = async (commentId, userId) => {
  if (!isValidObjectId(commentId) && !isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid ID");
  }
  const comment = await Comment.findById(commentId);
  const isUserExists = await User.findById(userId);
  if (isUserExists === null) {
    throw new ApiError(400, "User does not exists");
  }
  const isValidUser = comment?.owner?._id.toString() === userId.toString();
  if (!isValidUser) {
    throw new ApiError(400, "Unauthorized user to performs the operations");
  }
  return true;
};
const createComment = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video Id is invalid");
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user?._id,
  });
  res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});
const getAllVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const videoAllComments = await Comment.find({ video: videoId }).populate(
    "owner",
    "fullName username avatar"
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoAllComments,
        "All comments fetched successfully"
      )
    );
});
const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid ID");
  }
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  await isAuthUser(commentId, req.user?._id);
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );
  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment Updated"));
});
const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(401, "Invalid Comment Id");
  }
  await isAuthUser(commentId, req.user?._id);
  const isCommentExists = await Comment.findById(commentId);
  if (isCommentExists === null) {
    throw new ApiError(400, "Comment does not exists");
  }
  await Comment.findByIdAndDelete(commentId);
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Comment deleted successfully"));
});

export { createComment, getAllVideoComments, updateComment, deleteComment };
