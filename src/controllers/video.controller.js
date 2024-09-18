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

export { publishVideo };
