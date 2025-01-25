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
  MESSAGE_RECEIVED_EVENT: "messageReceived",
  MESSAGE_DELETE_EVENT: "messageDeleted",
  MESSAGE_EDIT_EVENT: "messageEdited",
  TYPING_EVENT: "typing",
  STOP_TYPING_EVENT: "stopTyping",

  // Reactions and interactions
  MESSAGE_LIKE_EVENT: "messageLiked",
  MESSAGE_REACT_EVENT: "messageReacted",
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
});

export { PROFILE_PICS, ChatEventEnum };
