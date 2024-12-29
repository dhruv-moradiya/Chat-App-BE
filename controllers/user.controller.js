import mongoose from "mongoose";
import { PROFILE_PICS } from "../constants/index.js";
import User from "../models/user.model.js";
import { createError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// GENERATE TOKENS
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating the access token"
    );
  }
};

// CREATE USER
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw createError.badRequest("User already exists");
  }

  const getUserProfilePicture = Math.floor(Math.random() * PROFILE_PICS.length);

  const user = await User.create({
    username,
    email,
    password,
    profilePicture: PROFILE_PICS[getUserProfilePicture],
  });

  if (!user) {
    throw createError.internalServerError("Failed to create user");
  }

  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
  };

  return res
    .status(201)
    .json(
      new ApiResponse(201, { user: userResponse }, "User created successfully")
    );
});

// LOGIN USER
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw createError.notFound("User not found");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw createError.wrongPassword("Invalid credentials");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };

  const userResponse = {
    _id: user._id,
    username: user.username,
    email: user.email,
    profilePicture: user.profilePicture,
    accessToken,
  };

  return res
    .status(200)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(
      new ApiResponse(200, { user: userResponse }, "User login successful")
    );
});

// LOGOUT USER
const logoutUser = asyncHandler(async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw createError.badRequest("No refresh token found");
  }

  const user = await User.findOne({ refreshToken });

  if (!user) {
    throw createError.unauthorized("Invalid refresh token");
  }

  user.refreshToken = null;
  await user.save();

  return res
    .status(200)
    .clearCookie("refreshToken")
    .clearCookie("accessToken")
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

// GET CURRENT USER
const getCurrentUser = asyncHandler(async (req, res) => {
  const { user } = req;

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User retrieved successfully"));
});

// GET ALL USERS
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users retrieved successfully"));
});

// GET USERS EXCLUDING FRIENDS
const getUsersExcludingFriends = asyncHandler(async (req, res) => {
  const currentUserId = new mongoose.Types.ObjectId(req.user._id);

  const users = await User.aggregate([
    {
      $match: {
        _id: { $ne: currentUserId },
      },
    },
    {
      $addFields: {
        isFriends: {
          $in: [currentUserId, "$friends"],
        },
      },
    },
    {
      $match: {
        isFriends: { $ne: true },
      },
    },
    {
      $project: {
        isFriends: 0,
        refreshToken: 0,
        password: 0,
      },
    },
  ]);

  if (!users) {
    throw createError.notFound("No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users retrieved successfully"));
});

// GET USERS EXCLUDING FRIENDS BASED ON SEARCH
const getUsersExcludingFriendsBasedOnSearch = asyncHandler(async (req, res) => {
  const currentUserId = new mongoose.Types.ObjectId(req.user._id);
  const { search } = req.query;

  const users = await User.aggregate([
    {
      $match: {
        _id: { $ne: currentUserId },
      },
    },
    {
      $addFields: {
        isFriends: {
          $in: [currentUserId, "$friends"],
        },
      },
    },
    {
      $match: {
        isFriends: { $ne: true },
        username: { $regex: search, $options: "i" },
      },
    },
    {
      $project: {
        isFriends: 0,
        refreshToken: 0,
        password: 0,
        __v: 0,
      },
    },
  ]);

  if (!users) {
    throw createError.notFound("No users found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users retrieved successfully"));
});

export {
  createUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  getAllUsers,
  getUsersExcludingFriends,
  getUsersExcludingFriendsBasedOnSearch,
};
