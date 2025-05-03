import Notification from "../models/notification.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllNotifications = asyncHandler(async (req, res) => {
  console.log(req.user);
  const notifications = await Notification.find({
    receivers: req.user._id,
  })
    .populate("sender", "_id username profilePicture")
    .populate("message", "_id content attachments")
    .sort({ createdAt: -1 });
  res
    .status(200)
    .json(
      new ApiResponse(200, notifications, "Notifications fetched successfully")
    );
});

export { getAllNotifications };
