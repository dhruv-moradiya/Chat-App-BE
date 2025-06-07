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
  "https://i.pinimg.com/736x/8c/66/23/8c662358d867966657a6118734ca98d1.jpg",
  "https://i.pinimg.com/736x/8a/e6/d2/8ae6d29abeb2e7eacae806d7a5e13c3b.jpg",
  "https://i.pinimg.com/736x/89/1d/ab/891dab0d971257580be08839de537fc5.jpg",
  "https://i.pinimg.com/736x/22/0a/dc/220adc665e49ee04d15e36728d059f4e.jpg",
  "https://i.pinimg.com/736x/a6/05/7e/a6057e6d925b2560c3e4e820419e7d17.jpg",
  "https://i.pinimg.com/736x/3c/4a/e4/3c4ae460ccc9d1d625c406d454693b76.jpg",
  "https://i.pinimg.com/736x/be/f7/9c/bef79c786120e5668982a8c280eca573.jpg",
  "https://i.pinimg.com/736x/ab/f3/3b/abf33b481a105643097168fc0243be6f.jpg",
  "https://i.pinimg.com/736x/6a/00/23/6a002386ea78db021976d0e4bcb6d76a.jpg",
  "https://i.pinimg.com/736x/fa/36/21/fa36219616d8cceb59c0a7c0519fb316.jpg",
  "https://i.pinimg.com/736x/e4/4a/db/e44adba2a2eadc97952121fbf75f1ec8.jpg",
  "https://i.pinimg.com/736x/55/bf/9a/55bf9a78e93732272965d9b95d33ceab.jpg",
  "https://i.pinimg.com/736x/46/a2/df/46a2df4a2ab2c150cfd864dc9f90186d.jpg",
  "https://i.pinimg.com/736x/91/80/46/9180464bb4c672ce1a081076ec8f4619.jpg",
  "https://i.pinimg.com/736x/dd/eb/37/ddeb372120560fffecafcca2dfcc30a1.jpg",
  "https://i.pinimg.com/736x/1e/a4/82/1ea482b79e4781e62a440c036e82bdf5.jpg",
  "https://i.pinimg.com/736x/78/e6/cf/78e6cf22df3dce593661888bba82add1.jpg",
  "https://i.pinimg.com/474x/7c/22/e0/7c22e0b5d6cd7e71419b92244d801266.jpg",
  "https://i.pinimg.com/474x/76/83/46/768346c82bf1fd11e3cee503f13cf57a.jpg",
  "https://i.pinimg.com/736x/1b/9d/1b/1b9d1b24140f05b987c9bda1a6f10fa5.jpg",
  "https://i.pinimg.com/736x/11/48/01/1148010bc6df885075a558384b3dbc6b.jpg",
  "https://i.pinimg.com/736x/d4/db/31/d4db3148c5c5f8906a86d076a8cc1003.jpg",
  "https://i.pinimg.com/736x/a5/9a/08/a59a0818efb684808d235bf3b2a84ca9.jpg",
  "https://i.pinimg.com/736x/54/bf/34/54bf340d7c6d3ce855c9a4cc9c1c114d.jpg",
  "https://i.pinimg.com/736x/77/83/37/778337851def4eea5ef7743859b64250.jpg",
  "https://i.pinimg.com/736x/c6/39/09/c6390947f2099284a1e4bb35abf8355c.jpg",
  "https://i.pinimg.com/736x/c2/64/bd/c264bd9161f53e30519b7e79ace1b582.jpg",
  "https://i.pinimg.com/736x/51/3c/9d/513c9d4db3dd1860e356486c8ab69eb0.jpg",
  "https://i.pinimg.com/736x/14/97/93/1497930f5e27b94c58d8a53a4be20f33.jpg",
  "https://i.pinimg.com/736x/14/ae/99/14ae99bf84ad98525007f5c4372b74e2.jpg",
  "https://i.pinimg.com/736x/c7/3d/31/c73d310af6bb0f009a07628fde2c57eb.jpg",
  "https://i.pinimg.com/736x/d7/fb/77/d7fb77cf2a0022bf73cdb6d0cf33de77.jpg",
  "https://i.pinimg.com/736x/54/cd/6c/54cd6c312e0dc5066d2c9fbdf6f43868.jpg",
  "https://i.pinimg.com/736x/09/e9/a4/09e9a4c3fab0a356d251f4a17924e36d.jpg",
  "https://i.pinimg.com/736x/4d/ca/91/4dca91e0ec9fcbe311bec5a580f267e9.jpg",
  "https://i.pinimg.com/736x/b7/59/ad/b759ad40a8e93de4950b652bba77d4ec.jpg",
  "https://i.pinimg.com/736x/1c/10/28/1c1028e8832b043b5d35e503912e8f07.jpg",
  "https://i.pinimg.com/736x/c8/a6/f2/c8a6f2559db3534a24bb8739f39e42d2.jpg",
  "https://i.pinimg.com/736x/1d/ce/62/1dce6207f39e880bfd9771706988735e.jpg",
  "https://i.pinimg.com/736x/80/f4/25/80f425cfb1b0cc24d4ceee549ddbad6a.jpg",
  "https://i.pinimg.com/736x/2a/e7/6b/2ae76b07c1af9dd439db123aae8702b4.jpg",
  "https://i.pinimg.com/736x/d2/a9/af/d2a9afddf2d7b2b328929501e23df795.jpg",
  "https://i.pinimg.com/736x/57/91/b1/5791b1a4f09f145d8b5538841f99968e.jpg",
  "https://i.pinimg.com/736x/ff/02/6d/ff026d488a2c32affc95fd0aac3d7d9c.jpg",
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

const NOTIFICATION_TYPES = Object.freeze({
  NEW_MESSAGE: "new_message",
  MENTION: "mention",
  ATTACHMENT: "attachment",
  REPLIED: "replied",
  FRIEND_REQUEST: "friend_request",
  FRIEND_REQUEST_ACCEPTED: "friend_request_accepted",
  FRIEND_REQUEST_REJECTED: "friend_request_rejected",
  REACTED: "reacted",
  APP_NOTIFICATION: "app_notification",
});

export { PROFILE_PICS, ChatEventEnum, NOTIFICATION_TYPES };
