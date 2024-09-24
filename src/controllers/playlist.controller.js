import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //   console.log("Playlist is hitting");
  const { name, description, videoId } = req.body;
  console.log(name, description, videoId);
  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiError(200, "Invalid Video Id");
  }
  if (!name && !description && !videoId) {
    throw new ApiError(401, "Playlist name and description is required");
  }
  const playlist = await Playlist.create({
    name,
    description,
    videos: videoId,
    owner: req.user?._id,
  });
  //   console.log(playlist);
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Video added successfully"));
});

export { createPlaylist };
