import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Playlist } from "../models/playlist.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

const isAuthUser = async (playlistId, userId) => {
  // console.log("is Auth user hitting");
  if (!isValidObjectId(playlistId) && !isValidObjectId(userId)) {
    throw new ApiError(400, "Either playlist Id or User Id is invalid");
  }
  const playlist = await Playlist.findById(playlistId);
  const checkUser = await User.findById(userId);
  if (!checkUser) {
    throw new ApiError(400, "User does not exists");
  }
  const isValidUser = playlist?.owner.toString() === userId.toString();
  if (!isValidUser) {
    throw new ApiError(400, "Unauthorized user to performs the operations");
  }
  return true;
};
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
  //   console.log(videoId, playlistId);
  if (!isValidObjectId(videoId) && !isValidObjectId(playlistId)) {
    throw new ApiError(401, "Invalid video or playlist ID");
  }
  await isAuthUser(playlistId, req.user?._id);
  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(401, "Playlist doesn't exist's");
  }
  if (playlist.videos.includes(videoId)) {
    throw new ApiError(400, "Video is already in the playlist");
  }
  playlist.videos.push(videoId);
  //   console.log(playlist);
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
const getUserPlayList = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }
  const isUserExists = await User.findById(userId);
  if (!isUserExists) {
    throw new ApiError(401, "User doesn't Exists");
  }
  const userPlaylist = await Playlist.find({ owner: userId });
  console.log(userPlaylist);
  if (userPlaylist.length === 0) {
    throw new ApiError(401, "Playlist doesn't exists");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylist, "User playlist fetched successfully")
    );
});
const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  const playlist = await Playlist.findById(playlistId);
  console.log(playlist);
  if (playlist === null) {
    throw new ApiError(400, "Playlist does not exists");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});
const deletePlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid Playlist id");
  }
  await isAuthUser(playlistId, req.user?._id);
  const isPlaylistExists = await Playlist.findById(playlistId);
  if (!isPlaylistExists) {
    throw new ApiError(400, "Playlist does not exists");
  }
  const deleteInstance = await Playlist.findByIdAndDelete(playlistId);
  return res
    .status(200)
    .json(
      new ApiResponse(200, deleteInstance, "Playlist deleted successfully")
    );
});
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid PlaylistId");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }
  await isAuthUser(playlistId, req.user?._id);
  const playlist = await Playlist.findById(playlistId);
  if (playlist === null) {
    throw new ApiError(401, "Playlist does not exists");
  }
  const isVideoInList = playlist.videos.includes(videoId);
  if (!isVideoInList) {
    throw new ApiError(400, "Video does not exists in the playlist");
  }
  const updateVideosList = playlist.videos.filter(
    (video) => video.toString() !== videoId
  );
  // console.log(updateVideosList);
  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlist,
    {
      $set: {
        videos: updateVideosList,
      },
    },
    { new: true }
  );
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "Video remove successfully from playlist"
      )
    );
});
export {
  createPlaylist,
  addVideoToPlayList,
  getUserPlayList,
  getPlaylistById,
  deletePlaylistById,
  removeVideoFromPlaylist,
};
