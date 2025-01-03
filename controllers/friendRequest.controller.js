import mongoose from "mongoose";
import FriendRequest from "../models/friendrequest.model.js";
import User from "../models/user.model.js";
import { createError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Chat from "../models/chat.model.js";

const sendFriendRequest = asyncHandler(async (req, res) => {
  const { receiverId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    throw createError.badRequest("Invalid receiver id");
  }

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    throw createError.notFound("Receiver not found");
  }

  if (receiverId.toString() === req.user._id.toString()) {
    throw createError.badRequest("You can't send a friend request to yourself");
  }

  const existingFriendRequest = await FriendRequest.aggregate([
    {
      $match: {
        from: new mongoose.Types.ObjectId(req.user._id),
        to: new mongoose.Types.ObjectId(receiverId),
      },
    },
    {
      $project: {
        __v: 0,
      },
    },
  ]);

  if (existingFriendRequest.length > 0) {
    throw createError.badRequest("Friend request already sent");
  }

  const friendRequest = await FriendRequest.create({
    from: req.user._id,
    to: receiverId,
  });

  if (!friendRequest) {
    throw createError.internalServerError("Friend request could not be sent");
  }

  return res
    .status(201)
    .json(
      new ApiResponse(201, friendRequest, "Friend request sent successfully")
    );
});

const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { friendRequestId } = req.body;

  // Validate friendRequestId
  if (!mongoose.Types.ObjectId.isValid(friendRequestId)) {
    throw createError.badRequest("Invalid friend request ID");
  }

  // Fetch friend request
  const friendRequest = await FriendRequest.findById(friendRequestId);
  if (!friendRequest) {
    throw createError.notFound("Friend request not found");
  }

  // Authorization check
  if (friendRequest.to.toString() !== req.user._id.toString()) {
    throw createError.forbidden(
      "You are not authorized to accept this request"
    );
  }

  // Check friend request status
  if (friendRequest.status !== "pending") {
    throw createError.badRequest("Friend request already accepted or rejected");
  }

  // Accept the friend request
  friendRequest.status = "accepted";
  await friendRequest.save();

  // Add friends and create chat (using transaction)
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Fetch users
    const [user, friendRequestSender] = await Promise.all([
      User.findById(req.user._id).session(session),
      User.findById(friendRequest.from).session(session),
    ]);

    if (!user || !friendRequestSender) {
      throw createError.notFound("User or sender not found");
    }

    // Update friends list
    user.friends.push(friendRequest.from);
    friendRequestSender.friends.push(user._id);

    await Promise.all([
      user.save({ session }),
      friendRequestSender.save({ session }),
    ]);

    // Delete the friend request
    await FriendRequest.deleteOne({ _id: friendRequest._id }, { session });

    // Create a chat between the two users
    const chat = await Chat.create(
      [
        {
          participants: [user._id, friendRequestSender._id],
          messages: [],
          isGroup: false,
        },
      ],
      { session }
    );

    // Commit the transaction
    await session.commitTransaction();

    // Respond with success
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { friendRequest, chat },
          "Friend request accepted successfully"
        )
      );
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

const rejectFriendRequest = asyncHandler(async (req, res) => {
  const { friendRequestId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(friendRequestId)) {
    throw createError.badRequest("Invalid friend request id");
  }

  const friendRequest = await FriendRequest.findById(friendRequestId);

  if (!friendRequest) {
    throw createError.notFound("Friend request not found");
  }

  if (friendRequest.to.toString() !== req.user._id.toString()) {
    throw createError.forbidden(
      "You are not authorized to reject this request"
    );
  }

  if (friendRequest.status !== "pending") {
    throw createError.badRequest("Friend request already accepted or rejected");
  }

  friendRequest.status = "rejected";

  await friendRequest.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        friendRequest,
        "Friend request rejected successfully"
      )
    );
});

const getMyFriendRequest = asyncHandler(async (req, res) => {
  const currentUserId = new mongoose.Types.ObjectId(req.user._id);

  const friendRequests = await FriendRequest.aggregate([
    {
      $match: {
        to: currentUserId,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "from",
        foreignField: "_id",
        as: "from",
      },
    },
    {
      $unwind: {
        path: "$from",
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $project: {
        to: 0,
        "from.password": 0,
        "from.refreshToken": 0,
        "from.__v": 0,
        __v: 0,
        "from.friends": 0,
        "from.mutedChats": 0,
      },
    },
  ]);

  if (!friendRequests) {
    throw createError.notFound("Friend requests not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        friendRequests,
        "Friend requests fetched successfully"
      )
    );
});

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getMyFriendRequest,
};
