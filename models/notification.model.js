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

    notificationType: {
      type: String,
      enum: [
        "NEW_MESSAGE",
        "MENTION",
        "ATTACHMENT",
        "REPLIED",
        "APP_NOTIFICATION",
      ],
      required: true,
    },

    content: { type: String, required: true },

    message: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },

    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
