import { ChatEventEnum } from "../constants/index.js";
import FriendRequest from "../models/friendrequest.model.js";
import Message from "../models/message.model.js";
import Notification from "../models/notification.model.js";

// === Notification Dispatcher ===
export const sendNotification = async (
  type,
  receiverId,
  subContent = null,
  subContentModel = null,
  io,
  otherData
) => {
  try {
    const modelHandlers = {
      Message: handleMessageNotification,
      FriendRequest: handleFriendRequestNotification,
    };

    const handler = modelHandlers[subContentModel];
    if (!handler) return;

    const notificationData = await handler({
      type,
      receiverId,
      subContent,
      io,
      otherData,
    });

    if (notificationData) {
      console.log("notificationData :>> ", notificationData);
      io.to(receiverId).emit(
        ChatEventEnum.NOTIFICATION_EVENT,
        notificationData
      );
      await Notification.create(notificationData);
    }
  } catch (error) {
    console.error("Notification Error:", error);
  }
};

const handleMessageNotification = async ({
  receiverId,
  subContent,
  otherData,
}) => {
  const message = await Message.findById(subContent).populate("sender", [
    "username",
    "profilePicture",
    "_id",
  ]);
  if (!message) throw new Error("Message not found");

  const type = getMessageNotificationType(
    message,
    receiverId,
    otherData?.isAttachment
  );
  return buildMessageNotification(message, type, receiverId);
};

const handleFriendRequestNotification = async ({
  type,
  receiverId,
  subContent,
}) => {
  const friendRequest = await FriendRequest.findById(
    subContent.toString()
  ).populate("from to", ["username", "profilePicture", "_id"]);
  if (!friendRequest) throw new Error("Friend request not found");

  return buildFriendRequestNotification(friendRequest, type, receiverId);
};

const getMessageNotificationType = (message, userId, isAttachment = false) => {
  const isMentioned = message.mentionedUsers?.some(
    (user) => user._id.toString() === userId
  );
  const isReacted = message.reactions?.some(
    (reaction) => reaction.user.toString() === userId
  );
  const isReply = Boolean(message.replyTo);

  if (isMentioned && isAttachment) return "mention_with_attachment";
  if (isMentioned) return "mention";
  if (isReacted) return "reacted";
  if (isReply) return "replied";
  if (isAttachment) return "attachment";
  return "new_message";
};

const buildMessageNotification = (message, type, receiverId) => {
  const sender = message.sender;
  const contentMap = {
    mention_with_attachment: `${sender.username} mentioned you with an attachment.`,
    mention: `${sender.username} mentioned you in a message.`,
    reacted: `${sender.username} reacted to your message.`,
    replied: `${sender.username} replied to your message.`,
    attachment: `${sender.username} sent you an attachment.`,
    new_message: `${sender.username} sent you a new message.`,
  };

  return {
    sender: sender._id,
    receivers: receiverId,
    type,
    content: contentMap[type],
    subContent: message._id,
    subContentModel: "Message",
  };
};

const buildFriendRequestNotification = (request, type, receiverId) => {
  const contentMap = {
    friend_request: {
      sender: request.from,
      content: `${request.from.username} sent you a friend request.`,
    },
    friend_request_accepted: {
      sender: request.to,
      content: `${request.to.username} accepted your friend request.`,
    },
    friend_request_rejected: {
      sender: request.from,
      content: `${request.from.username} rejected your friend request.`,
    },
  };

  const mapped = contentMap[type];
  return {
    sender: mapped.sender._id,
    receivers: receiverId,
    type,
    content: mapped.content,
    subContent: request._id,
    subContentModel: "FriendRequest",
  };
};
