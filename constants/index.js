const PROFILE_PICS = [
  "https://i.pinimg.com/736x/bb/8a/91/bb8a91a047deaa78f7a89228f80d92da.jpg",
  "https://i.pinimg.com/736x/85/9b/fc/859bfc031979806bb20c506c6b635371.jpg",
  "https://i.pinimg.com/736x/79/93/2a/79932a720af8bf88b3b11939e20ec03a.jpg",
  "https://i.pinimg.com/736x/f7/bd/5e/f7bd5e73267b7bd04eccfae88309b617.jpg",
  "https://i.pinimg.com/736x/87/5b/4f/875b4fb82c44a038466807b0dcf884cc.jpg",
  "https://i.pinimg.com/736x/5e/36/56/5e3656741b929f26de310d88c9c20e1d.jpg",
  "https://i.pinimg.com/736x/f0/29/fa/f029faf6749a9686b9e3e25b3400ef93.jpg",
  "https://i.pinimg.com/736x/57/ff/d2/57ffd2de1067686f07d41a56b2eb76df.jpg",
  "https://i.pinimg.com/736x/7f/d9/7a/7fd97ab0489510159c65b8359a46f5a1.jpg",
  "https://i.pinimg.com/736x/c5/bc/2d/c5bc2d1e01ddeaae5307885a28527b5f.jpg",
  "https://i.pinimg.com/474x/a0/40/21/a040217e61baa565bfd6388acf5e36bd.jpg",
  "https://i.pinimg.com/736x/1e/1d/f5/1e1df5de1a628d6d6f4d4a6ad8384a47.jpg",
  "https://i.pinimg.com/736x/bb/54/43/bb54438bced71017f01d912b7f516de4.jpg",
  "https://i.pinimg.com/736x/20/4c/0b/204c0ba410032e2cc47eaf0f8f504d8a.jpg",
  "https://i.pinimg.com/736x/d3/d2/fd/d3d2fd2cd727334cc4d46e5a03f2c91d.jpg",
  "https://i.pinimg.com/736x/8f/f5/b5/8ff5b524ad7bd0ec87ef4ac66248bde0.jpg",
  "https://i.pinimg.com/736x/cd/ae/3b/cdae3b65b08001cc46fe0c932e786ea1.jpg",
  "https://i.pinimg.com/736x/06/4e/2e/064e2e039909d204379434b8aeb6ca1c.jpg",
  "https://i.pinimg.com/736x/e7/89/3d/e7893d6368dd0d0a3030185367b30b8b.jpg",
  "https://i.pinimg.com/474x/5b/96/01/5b9601415f8b8df5e04a787504e5c09d.jpg",
  "https://i.pinimg.com/474x/a6/37/2c/a6372caecdd8ba4eeebdd18a2c9faf94.jpg",
  "https://i.pinimg.com/474x/33/fb/eb/33fbeb45315109aa81ed6a7d1551552c.jpg",
  "https://i.pinimg.com/474x/fd/c1/f0/fdc1f0ae43373e8753e8abf6e7cf7091.jpg",
];

const ChatEventEnum = Object.freeze({
  // User connection events
  CONNECTED_EVENT: "connected",
  DISCONNECT_EVENT: "disconnect",

  // Chat room management
  JOIN_CHAT_EVENT: "joinChat",
  LEAVE_CHAT_EVENT: "leaveChat",
  NEW_CHAT_EVENT: "newChat",

  // Group management
  UPDATE_GROUP_NAME_EVENT: "updateGroupName",
  GROUP_CHAT_DELETE_EVENT: "groupChatDeleted",
  USER_JOIN_GROUP_EVENT: "userJoinGroup",
  USER_LEAVE_GROUP_EVENT: "userLeaveGroup",

  // Messaging
  UPDATED_MESSAGE_WITH_ATTACHMENT_EVENT: "updatedMessageWithAttachment",
  DELETE_MESSAGE_FOR_EVERYONE_OR_SELF_EVENT: "deleteMessageForEveryoneOrSelf",
  MESSAGE_RECEIVED_EVENT: "messageReceived",
  MESSAGE_SEND_EVENT: "messageSent",
  MESSAGE_DELETE_EVENT: "messageDeleted",
  MESSAGE_EDIT_EVENT: "messageEdited",
  TYPING_EVENT: "typing",
  STOP_TYPING_EVENT: "stopTyping",

  // Reactions and interactions
  MESSAGE_LIKE_EVENT: "messageLiked",
  MESSAGE_REACT_EVENT: "messageReact",
  MESSAGE_REACTED_EVENT: "messageReacted",
  MESSAGE_REPLY_EVENT: "messageReplied",
  MESSAGE_MENTION_EVENT: "messageMentioned",

  // Chat features
  CHAT_PIN_EVENT: "chatPinned",
  CHAT_UNPIN_EVENT: "chatUnpinned",
  CHAT_MUTE_EVENT: "chatMuted",
  CHAT_UNMUTE_EVENT: "chatUnmuted",
  CURRENT_ACTIVE_CHAT_EVENT: "currentActiveChat",
  UNREAD_MESSAGE_EVENT: "unreadMessage",
  UNREAD_MESSAGE_COUNT_EVENT: "unreadMessageCount",

  // Room creation
  ROOM_CREATED_EVENT: "roomCreated",
  JOIN_ROOM_EVENT: "joinRoom",
  LEAVE_ROOM_EVENT: "leaveRoom",

  // Media
  MEDIA_SEND_EVENT: "mediaSent",
  MEDIA_RECEIVED_EVENT: "mediaReceived",

  // Notifications
  SEND_NOTIFICATION_EVENT: "sendNotification",

  // Errors
  SOCKET_ERROR_EVENT: "socketError",

  // Friend requests
  FRIEND_REQUEST_SEND_EVENT: "friendRequestSent",
  FRIEND_REQUEST_RECEIVE_EVENT: "friendRequestReceived",
  FRIEND_REQUEST_ACCEPT_EVENT: "friendRequestAccepted",
  FRIEND_REQUEST_DECLINE_EVENT: "friendRequestDeclined",

  // Notifications
  NOTIFICATION_EVENT: "notification",
});

export { PROFILE_PICS, ChatEventEnum };
