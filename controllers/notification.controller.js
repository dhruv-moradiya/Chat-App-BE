import Notification from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({
    receivers: req.user._id,
  })
    .populate("subContent")
    .populate("sender", "username _id profilePicture")
    .sort({ createdAt: -1 })
    .lean();

  const updatedNotifications = notifications.map((notification) => {
    if (notification.subContentModel === "Message") {
      return {
        ...notification,
        subContent: {
          attachments: notification.subContent.attachments,
          chat: notification.subContent.chat,
          _id: notification.subContent._id,
          text: notification.subContent.content,
        },
      };
    } else if (notification.subContentModel === "FriendRequest") {
      return {
        ...notification,
      };
    } else {
      return notification;
    }
  });

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedNotifications,
        "Notifications fetched successfully"
      )
    );
});

export { getAllNotifications };
