import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
  // console.log("publish video is hitting");
  const { title, description } = req.body;
  if (!title && !description) {
    throw new ApiError(401, "Title and description required");
  }
  const localVideoPath = await req.files?.video[0].path;
  const localThumbnailPath = req.files?.thumbnail[0].path;
  if (!localThumbnailPath && !localVideoPath) {
    throw new ApiError(401, "Video and Thumbnail are required");
  }
  const video = await uploadOnCloudinary(localVideoPath);
  const thumbnail = await uploadOnCloudinary(localThumbnailPath);
  // console.log(video, thumbnail, title, description);
  const videoPublish = await Video.create({
    videoFile: video?.url,
    thumbnail: thumbnail?.url,
    title,
    description,
    duration: video?.duration,
    owner: req.user?._id,
  });
  // console.log(videoPublish);
  if (!videoPublish) {
    throw new ApiError(401, "Error while publishing video");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, videoPublish, "Video is successfully published")
    );
});
const getAllVideos = asyncHandler(async (req, res) => {
  console.log("Get all videos is hitting");
  const { page = 1, limit = 20, query, sortBy, sortType, userId } = req.query;

  const options = {
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
    sort: {},
  };
  if (sortBy) {
    options.sort[sortBy] = sortType === "asc" ? 1 : -1;
  } else {
    options.sort["createdAt"] = -1;
  }
  const searchCondition = {
    $and: [
      {
        isPublished: true,
      },
    ],
  };
  console.log("options", options);
  if (query) {
    searchCondition.$and.push({
      $or: [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ],
    });
  }
  if (userId) {
    searchCondition.$and.push({ owner: new mongoose.Types.ObjectId(userId) });
  }
  console.log("searchCondition", searchCondition);
  const videoAggregate = Video.aggregate([
    {
      $match: searchCondition,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              avatar: 1,
              fullName: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  console.log("videoAggregate", videoAggregate);
  const fetchedVideos = await Video.aggregatePaginate(videoAggregate, options);
  console.log("fetchedVideos", fetchedVideos);
  return res
    .status(200)
    .json(new ApiResponse(200, fetchedVideos, "Video fetched Successfully"));
});
const getVideoById = asyncHandler(async (req, res) => {
  // console.log("Get video by Id is hitting");
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(401, "Video Id is missing");
  }
  const fetchedVideo = await Video.findById(videoId);
  if (!fetchedVideo) {
    throw new ApiError(401, "Video does not exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, fetchedVideo, "Video fetch by Id is successful")
    );
});
const updateVideo = asyncHandler(async (req, res) => {
  console.log("Update video is hitting");
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;
  if (!videoId) {
    throw new ApiError(401, "Video Id is required for updating video");
  }
  if (!(title || description || thumbnailLocalPath)) {
    throw new ApiError(
      401,
      "Title , description or thumbnail any one is required "
    );
  }
  const updateFields = {};
  if (title) {
    updateFields.title = title;
  }
  if (description) {
    updateFields.description = description;
  }
  if (thumbnailLocalPath) {
    const updateThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!updateThumbnail) {
      throw new ApiError(500, "Cloudanry error while updating thumbnail");
    }
    updateFields.thumbnail = updateThumbnail?.url;
  }
  console.log(updateFields);
  const updateInstance = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: updateFields,
    },
    {
      new: true,
    }
  );
  console.log("Update Instance", updateInstance);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateInstance,
        "Video details is updated successfully"
      )
    );
});
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  // console.log("Delete Video is hitting", videoId);
  if (!videoId) {
    throw new ApiError(401, "Video Id is required");
  }
  const deleteVideoInstance = await Video.findByIdAndDelete(videoId);
  if (!deleteVideoInstance) {
    throw new ApiError(400, "Video does not exits");
  }
  // console.log(deleteVideoInstance);
  return res
    .status(200)
    .json(
      new ApiResponse(200, deleteVideoInstance, "Video deleted successfully")
    );
});
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw new ApiError(401, "Video id is required");
  }
  const videoDetails = await Video.findById(videoId);
  console.log(req.user?._id);
  console.log(videoDetails.owner, Video.owner);

  if (req.user?._id.toString() !== videoDetails.owner.toString()) {
    throw new ApiError(401, "Unauthorized request by user");
  }
  const isPublished = !videoDetails.isPublished;
  const toggledVideo = await Video.findByIdAndUpdate(videoId, {
    $set: {
      isPublished: isPublished,
    },
  });
  if (!toggledVideo) {
    throw new ApiError(401, "Video don't exits");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, toggledVideo, "Toggled successfully"));
});

export {
  publishVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
