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
  console.log("Get video by Id is hitting");
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
export { publishVideo, getAllVideos, getVideoById };
