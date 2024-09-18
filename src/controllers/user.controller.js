import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log("From generate function", user);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    // console.log("Ass and ref token", accessToken, refreshToken);

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res
  console.log(req.body);
  const { username, email, fullName, password } = req.body;
  if (
    [username, email, fullName, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }
  const exitUser = await User.findOne({
    $or: [{ username }, { email }],
  });
  if (exitUser) {
    throw new ApiError(409, "User already exits with this email or userName");
  }
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
  }
  // console.log(req.files);
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar?.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );
  // console.log(createdUser);
  if (!createdUser) {
    throw new ApiError(500, "Something went while register user");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Created Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;
  // console.log(email, username);
  if (!username && !email) {
    throw new ApiError(400, "Username or Email is required");
  }
  const user = await User.findOne({
    $or: [{ email }, { username }],
  });
  // console.log(user);
  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }
  // console.log(user._id);
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );
  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged In Successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  console.log(req.user._id);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User log out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token expired or used");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    const options = {
      httpOnly: true,
      secure: true,
    };
    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});
const getCurrentUser = asyncHandler(async (req, res) => {
  // console.log("Get Current user hitting");
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});
const changeCurrentPassword = asyncHandler(async (req, res) => {
  // console.log("Change password is hitting");
  const { oldPassword, currentPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  // console.log(isPasswordCorrect);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }
  user.password = currentPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Change successfully"));
});
const updateAccountDetails = asyncHandler(async (req, res) => {
  // console.log("Update User Details is hitting");
  const { email, fullName } = req.body;
  if (!(email || fullName)) {
    throw new ApiError(401, "Please send email or full name");
  }
  if (email !== "") {
    const isEmailExist = await User.findOne({ email: email });
    if (isEmailExist) {
      throw new ApiError(401, "Email already exists");
    }
  }
  const updatedField = {};
  if (email) updatedField.email = email;
  if (fullName) updatedField.fullName = fullName;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: updatedField,
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Information updated successfully"));
});
const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;
  // console.log("local file path", avatarLocalPath);
  if (!avatarLocalPath) {
    throw new ApiError(401, "Avater file is missing");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // console.log("cloudaniry response", avatar, avatar.url);
  if (!avatar?.url) {
    throw new ApiError(400, "Error while uploading on cloadinary");
  }

  // console.log("hitting inside");
  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        avatar: avatar.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  console.log(user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated sccessfully"));
});
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;
  console.log("local file path", coverImageLocalPath);
  if (!coverImageLocalPath) {
    throw new ApiError(401, "CoverImage file is missing");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!coverImage?.url) {
    throw new ApiError(400, "Error while uploading on cloadinary");
  }

  console.log("hitting inside");
  const user = await User.findByIdAndUpdate(
    req.user?._id,

    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");
  // console.log(user);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated sccessfully"));
});
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // console.log("channel is hitting");
  const { username } = req.params;
  if (!username.trim().toLowerCase()) {
    throw new ApiError(401, "User Name is missing");
  }
  const channel = await User.aggregate([
    {
      $match: { username: username.toLowerCase() },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: { $size: { $ifNull: ["$subscriptions", []] } },
        channelsSubscribedToCount: {
          $size: { $ifNull: ["$subscribedTo", []] },
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);
  if (!channel.length) {
    throw new ApiError(404, "Channel dose not exits");
  }
  // console.log(channel);
  return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel fetched successfully"));
});
const getWatchHistory = asyncHandler(async (req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
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
        ],
      },
    },
  ]);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "Watch History fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
