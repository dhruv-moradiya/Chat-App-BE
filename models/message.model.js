import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: { type: String },
    attachments: [
      {
        url: {
          type: String,
        },
        fileName: {
          type: String,
        },
        publicId: {
          type: String,
        },
      },
    ],
    reactions: [
      {
        emoji: { type: String },
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    deletedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Users who have deleted the message for themselves
    isDeletedForAll: { type: Boolean }, // Indicates if the message is deleted for everyone
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    mentionedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", MessageSchema);

export default Message;
