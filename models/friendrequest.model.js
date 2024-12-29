import mongoose from "mongoose";

const FriendRequestSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Request sender
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Request receiver
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    }, // Request status
  },
  { timestamps: true }
);

const FriendRequest = mongoose.model("FriendRequest", FriendRequestSchema);

export default FriendRequest;
