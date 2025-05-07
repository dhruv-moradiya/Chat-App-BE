import { ChatEventEnum } from "../constants/index.js";
import Chat from "../models/chat.model.js";
import { logger } from "../utils/logger.js";

const listenForLeaveChatEvent = (io, socket) => {
  socket.on(ChatEventEnum.LEAVE_CHAT_EVENT, (chatId) => {
    console.log(`User left the chat. chatId: `, chatId);
    socket.leave(chatId);
  });
};

const listenForCurrentActiveChat = (io, socket) => {
  socket.on(
    ChatEventEnum.CURRENT_ACTIVE_CHAT_EVENT,
    async ({ chatId, userData }) => {
      // TODO: Add validation for chatId and userData
      if (!chatId || !userData?._id || !userData?.username) {
        logger.error("Chat ID and user data are required.");
        return;
      }

      const userId = userData._id;
      const userName = userData.username;

      io.to(userId).socketsJoin(chatId);
      logger.info(`${userName} joined to chat room: ${chatId}`);

      io.to(chatId).emit(ChatEventEnum.ROOM_CREATED_EVENT, {
        chatId,
        userName,
      });

      await Chat.updateOne(
        { _id: chatId },
        { $set: { [`unreadMessagesCounts.${userId}`]: 0 } }
      );
    }
  );
};

export { listenForLeaveChatEvent, listenForCurrentActiveChat };
