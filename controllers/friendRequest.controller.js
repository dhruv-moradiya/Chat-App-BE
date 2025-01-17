import mongoose from "mongoose";
import User from "../models/user.model.js";
import Chat from "../models/chat.model.js";
import FriendRequest from "../models/friendrequest.model.js";
import { createError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ChatEventEnum } from "../constants/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// SEND FRIEND REQUEST
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

  const dataToEmit = {
    from: {
      username: req.user.username,
      _id: req.user._id,
      profilePicture: req.user.profilePicture,
      email: req.user.email,
    },
    _id: friendRequest._id,
    status: friendRequest.status,
    updatedAt: friendRequest.updatedAt,
    createdAt: friendRequest.createdAt,
  };

  console.log(`Emitting FRIEND_REQUEST_RECEIVE_EVENT to room ${receiverId}`);
  req.app
    .get("io")
    .to(receiverId.toString())
    .emit(ChatEventEnum.FRIEND_REQUEST_RECEIVE_EVENT, {
      data: dataToEmit,
      message: "You have a new friend request!",
    });

  return res
    .status(201)
    .json(
      new ApiResponse(201, friendRequest, "Friend request sent successfully")
    );
});

// ACCEPT FRIEND REQUEST
const acceptFriendRequest = asyncHandler(async (req, res) => {
  const { friendRequestId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(friendRequestId)) {
    throw createError.badRequest("Invalid friend request ID");
  }

  const friendRequest = await FriendRequest.findById(friendRequestId);
  if (!friendRequest) {
    throw createError.notFound("Friend request not found");
  }

  if (friendRequest.to.toString() !== req.user._id.toString()) {
    throw createError.forbidden(
      "You are not authorized to accept this request"
    );
  }

  if (friendRequest.status !== "pending") {
    throw createError.badRequest("Friend request already accepted or rejected");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Update friend request status
    friendRequest.status = "accepted";
    await friendRequest.save({ session });

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

    // Create a chat
    const chat = new Chat({
      participants: [user._id, friendRequestSender._id],
      messages: [],
      isGroup: false,
      unreadMessagesCounts: new Map([
        [user._id, 0],
        [friendRequestSender._id, 0],
      ]),
    });
    await chat.save({ session });

    const chatDetails = await Chat.aggregate(
      [
        { $match: { _id: chat._id } },
        {
          $lookup: {
            from: "users",
            localField: "participants",
            foreignField: "_id",
            as: "participants",
          },
        },
        {
          $project: {
            __v: 0,
            messages: 0,
            "participants.refreshToken": 0,
            "participants.__v": 0,
            "participants.friends": 0,
            "participants.mutedChats": 0,
            "participants.createdAt": 0,
            "participants.updatedAt": 0,
          },
        },
      ],
      { session } // Explicitly pass the session
    );

    // Commit transaction
    await session.commitTransaction();

    const acceptorDetails = {
      _id: user._id,
      username: user.username,
      profilePicture: user.profilePicture,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    req.app
      .get("io")
      .to(friendRequest.from.toString())
      .emit(ChatEventEnum.FRIEND_REQUEST_ACCEPT_EVENT, {
        acceptorDetails,
        chatDetails: chatDetails[0],
      });

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { acceptorDetails, chatDetails: chatDetails[0] },
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

// REJECT FRIEND REQUEST
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

// GET MY FRIEND REQUEST
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
        __v: 0,
        "from.password": 0,
        "from.refreshToken": 0,
        "from.__v": 0,
        "from.friends": 0,
        "from.mutedChats": 0,
        "from.createdAt": 0,
        "from.updatedAt": 0,
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

const getMyFriendsList = asyncHandler(async (req, res) => {
  const friends = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "friends",
        foreignField: "_id",
        as: "friends",
      },
    },
    {
      $unwind: {
        path: "$friends",
      },
    },
    {
      $project: {
        password: 0,
        refreshToken: 0,
        mutedChats: 0,
        createdAt: 0,
        password: 0,
        updatedAt: 0,
        __v: 0,
        "friends.password": 0,
        "friends.refreshToken": 0,
        "friends.mutedChats": 0,
        "friends.createdAt": 0,
        "friends.updatedAt": 0,
        "friends.__v": 0,
        "friends.friends": 0,
      },
    },
    {
      $group: {
        _id: "$_id",
        friends: { $push: "$friends" },
      },
    },
    {
      $project: {
        friends: 1,
        _id: 0,
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { friends: friends[0].friends },
        "Friend requests fetched successfully"
      )
    );
});

export {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getMyFriendRequest,
  getMyFriendsList,
};
