import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler(async (req, res) => {
  //   console.log("Playlist is hitting");
  const { name, description, videoId } = req.body;
  //   console.log(name, description, videoId);
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
const addVideoToPlayList = asyncHandler(async (req, res) => {
  const { videoId, playlistId } = req.params;
  console.log(videoId, playlistId);
  if (!isValidObjectId(videoId) && !isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid video or playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(401, "Playlist doesn't exist's");
  }
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }
  playlist.videos.push(videoId);
  console.log(playlist);
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $set: {
        videos: playlist.videos,
      },
    },
    { new: true }
  );
  console.log(updatedPlaylist);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video added to playlist successfully"
      )
    );
});
export { createPlaylist, addVideoToPlayList };
