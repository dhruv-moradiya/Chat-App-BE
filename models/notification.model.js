import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receivers: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: [
        "mention_with_attachment",
        "new_message",
        "mention",
        "attachment",
        "replied",
        "friend_request",
        "friend_request_accepted",
        "friend_request_rejected",
        "reacted",
        "app_notification",
      ],
      required: true,
    },

    content: { type: String, required: true },

    subContent: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "subContentModel",
    },

    subContentModel: {
      type: String,
      required: false,
      enum: ["Message", "FriendRequest"],
    },

    isRead: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
