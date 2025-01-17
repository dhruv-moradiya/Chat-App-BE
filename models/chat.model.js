import mongoose from "mongoose";

const ChatSchema = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isGroup: { type: Boolean, default: false },
    coverImage: {
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
    chatName: { type: String },
    unreadMessagesCounts: {
      type: Map,
      of: Number,
      default: new Map(),
    },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Chat = mongoose.model("Chat", ChatSchema);

export default Chat;
