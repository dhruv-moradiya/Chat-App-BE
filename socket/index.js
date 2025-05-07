import cookie from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Chat from "../models/chat.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import Message from "../models/message.model.js";
import { logger } from "../utils/logger.js";
import { ChatEventEnum } from "../constants/index.js";
import { ManageNotifications } from "./notificationService.js";
import { uploadFilesToCloudinary } from "../utils/cloudinary.js";
import { stripBase64Prefix } from "../utils/helpers.js";
import handleAuth from "./auth.socket.js";
import {
  listenForCurrentActiveChat,
  listenForLeaveChatEvent,
} from "./chat.socket.js";
import { listeningForMessageSendEvent } from "./message.socket.js";

const emitError = (socket, error) => {
  socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, error);
};

const mountParticipantTypingEvent = (socket) => {
  socket.on(ChatEventEnum.TYPING_EVENT, (chatId) => {
    console.log(`User is typing. chatId: `, chatId);
    socket.to(chatId).emit(ChatEventEnum.TYPING_EVENT, chatId);
  });
};

const mountParticipantStopTypingEvent = (socket) => {
  socket.on(ChatEventEnum.STOP_TYPING_EVENT, (chatId) => {
    console.log(`User stopped typing. chatId: `, chatId);
    socket.to(chatId).emit(ChatEventEnum.STOP_TYPING_EVENT, chatId);
  });
};

const listeningForMessageReactionEvent = (io, socket) => {
  socket.on(
    ChatEventEnum.MESSAGE_REACT_EVENT,
    async ({ chatId, messageId, emoji, userId }) => {
      socket.broadcast.to(chatId).emit(ChatEventEnum.MESSAGE_REACT_EVENT, {
        chatId,
        messageId,
        emoji,
        userId,
      });
      try {
        const updatedMessage = await Message.findOneAndUpdate(
          { _id: messageId },
          { $push: { reactions: { userId, emoji } } },
          { new: true, upsert: false }
        );

        if (!updatedMessage) {
          return socket.emit(ChatEventEnum.ERROR_EVENT, {
            message: "Message not found.",
          });
        }

        socket.broadcast.to(chatId).emit(ChatEventEnum.MESSAGE_REACT_EVENT, {
          chatId,
          messageId,
          emoji,
          userId,
        });

        logger.info(
          `✅ Reaction added to message ${messageId} by user ${userId}`
        );
      } catch (error) {
        logger.error(`❌ Error updating message reaction: ${error.message}`);
        // socket.emit(ChatEventEnum.ERROR_EVENT, { message: "Failed to react to message." });
      }
    }
  );
};

const initializeSocket = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const user = await handleAuth(socket);
      socket.user = user;

      socket.emit(
        ChatEventEnum.CONNECTED_EVENT,
        `${user.username} is connected successfully.`
      );
      logger.info(`✨ ${user.username} is connected successfully.`);

      socket.emit("TEST_EVENT", {
        message: "Emit Test Event.",
      });

      mountParticipantTypingEvent(socket);
      mountParticipantStopTypingEvent(socket);
      listenForLeaveChatEvent(io, socket);
      listenForCurrentActiveChat(io, socket);
      listeningForMessageSendEvent(io, socket);
      listeningForMessageReactionEvent(io, socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        logger.info(
          `🚫 User disconnected ID: ${user._id.toString()} Username: ${
            user.username
          }`
        );
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
          socket.removeAllListeners();
        }
      });
    } catch (error) {
      logger.error(error);
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error?.message || "Something went wrong while connecting the socket"
      );
    }
  });
};

export { emitError, initializeSocket };
