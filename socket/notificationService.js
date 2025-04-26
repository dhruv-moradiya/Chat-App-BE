import mongoose from "mongoose";
import { ChatEventEnum } from "../constants/index.js";

const NotificationTypeEnum = {
  MENTION: "MENTION",
  REACTED: "REACTED",
  REPLIED: "REPLIED",
  ATTACHMENT: "ATTACHMENT",
  APP_NOTIFICATION: "APP_NOTIFICATION",
  NEW_MESSAGE: "NEW_MESSAGE",
};

class ManageNotifications {
  constructor(io, userSocketId, message) {
    this.io = io;
    this.userSocketId = userSocketId;
    this.message = message;
  }

  async sendNotification(userId) {
    const notificationType = NotificationClassifier.classifyNotification(
      this.message,
      userId
    );

    const notificationData = NotificationDataBuilder.buildNotificationData(
      this.message,
      notificationType,
      userId
    );

    await this.#saveNotification(notificationData);

    this.io.to(userId).emit(ChatEventEnum.NOTIFICATION_EVENT, notificationData);
  }

  async #saveNotification(notificationData) {
    console.log("Saving notification to the database:", notificationData);
  }
}

class NotificationClassifier {
  static classifyNotification(message, userId) {
    const isMentioned = message.mentionedUsers?.some(
      (mentionedUser) => mentionedUser._id.toString() === userId
    );

    const isReacted = message.reactions?.some(
      (reaction) => reaction.user.toString() === userId
    );

    const isReply = !!message.replyTo;
    const hasAttachment = (message.attachments || []).length > 0;

    if (isMentioned && hasAttachment) {
      return "MENTION_WITH_ATTACHMENT";
    } else if (isMentioned) {
      return "MENTION";
    } else if (isReacted) {
      return "REACTED";
    } else if (isReply) {
      return "REPLIED";
    } else if (hasAttachment) {
      return "ATTACHMENT";
    } else {
      return "NEW_MESSAGE";
    }
  }
}

class NotificationDataBuilder {
  static buildNotificationData(message, notificationType, userId) {
    const chatId = message.chat._id.toString();
    const tempId = new mongoose.Types.ObjectId();

    const notificationMap = {
      MENTION_WITH_ATTACHMENT: {
        type: NotificationTypeEnum.MENTION,
        content: `${message.sender.username} mentioned you with an attachment.`,
      },
      MENTION: {
        type: NotificationTypeEnum.MENTION,
        content: `${message.sender.username} mentioned you in a message.`,
      },
      REACTED: {
        type: NotificationTypeEnum.REACTED,
        content: `${message.sender.username} reacted to your message.`,
      },
      REPLIED: {
        type: NotificationTypeEnum.REPLIED,
        content: `${message.sender.username} replied to your message.`,
      },
      ATTACHMENT: {
        type: NotificationTypeEnum.ATTACHMENT,
        content: `${message.sender.username} sent an attachment.`,
      },
      NEW_MESSAGE: {
        type: NotificationTypeEnum.NEW_MESSAGE,
        content: `${message.sender.username} sent a new message.`,
      },
    };

    const mapItem = notificationMap[notificationType];

    return {
      _id: tempId,
      chatId,
      isRead: false,
      receivers: userId,
      messageId: message._id,
      message: message.content,
      content: mapItem.content,
      sender: message.sender._id,
      notificationType: mapItem.type,
    };
  }
}

export { ManageNotifications };
