import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { ChatEventEnum } from "../constants/index.js";
import { logger } from "../utils/logger.js";

const emitError = (socket, error) => {
  socket.emit(ChatEventEnum.SOCKET_ERROR_EVENT, error);
};

const mountJoinChatEvent = (socket) => {
  socket.on(ChatEventEnum.JOIN_CHAT_EVENT, (chatId) => {
    console.log(`User joined the chat 🤝. chatId: `, chatId);
    socket.join(chatId);
  });
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

const listenForCurrentActiveChat = (io, socket) => {
  socket.on(
    ChatEventEnum.CURRENT_ACTIVE_CHAT_EVENT,
    ({ chatId, participants }) => {
      // TODO: Add validation for chatId and participants
      if (
        !chatId ||
        !Array.isArray(participants) ||
        participants.length === 0
      ) {
        logger.error("Chat ID and participants are required");
        return;
      }

      participants.forEach((user) => {
        io.to(user._id).socketsJoin(chatId);
        logger.info(
          `A User with ID: ${user._id} Username: ${user.username} added to chat room: ${chatId}`
        );
      });

      io.to(chatId).emit(ChatEventEnum.ROOM_CREATED_EVENT, {
        chatId,
        participants,
      });

      const participantsName = participants.map((p) => p.username).join(" | ");

      logger.info(
        `Room ${chatId} created with participants: ${participantsName}`
      );
    }
  );
};

const initializeSocket = (io) => {
  return io.on("connection", async (socket) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || "");

      let token = cookies.token;
      if (!token) {
        token = socket.handshake.auth.token;
      }

      if (!token) {
        throw new ApiError(401, "Un-authorized handshake. Token is missing");
      }

      const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findOne({ _id: decoded._id }).select(
        "-password -refreshToken -__v"
      );

      if (!user) {
        throw new ApiError(401, "Un-authorized handshake. User is missing");
      }

      socket.join(user._id.toString());
      socket.user = user;

      socket.emit(
        ChatEventEnum.CONNECTED_EVENT,
        `${user.username} is connected successfully.`
      );
      logger.info(`✨ ${user.username} is connected successfully.`);

      socket.emit("TEST_EVENT", {
        message: "Emit Test Event.",
      });

      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStopTypingEvent(socket);
      listenForCurrentActiveChat(io, socket);

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

export { initializeSocket };
