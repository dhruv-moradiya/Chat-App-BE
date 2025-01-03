import cookie from "cookie";
import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";
import { ChatEventEnum } from "../constants/index.js";

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

const initializeSocket = (io) => {
  console.log("SOCKET INITIALIZED RUN.");

  return io.on("connection", async (socket) => {
    console.log("User connected 🙏.", socket.id);
    socket.emit(ChatEventEnum.CONNECTED_EVENT, {
      message: "Socket connected successfully",
    });
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

      socket.user = user;

      socket.join(user._id.toString());

      socket.emit(ChatEventEnum.CONNECTED_EVENT);
      console.log(
        `User connected 🗼. userId: ${user._id.toString()} and username ${
          user.username
        }`
      );

      mountJoinChatEvent(socket);
      mountParticipantTypingEvent(socket);
      mountParticipantStopTypingEvent(socket);

      socket.on(ChatEventEnum.DISCONNECT_EVENT, () => {
        console.log(
          `User disconnected 🚫. userId: ${user._id.toString()} and username ${
            user.username
          }`
        );
        if (socket.user?._id) {
          socket.leave(socket.user._id.toString());
          socket.removeAllListeners();
        }
      });
    } catch (error) {
      socket.emit(
        ChatEventEnum.SOCKET_ERROR_EVENT,
        error?.message || "Something went wrong while connecting the socket"
      );
    }
  });
};

export { initializeSocket };
