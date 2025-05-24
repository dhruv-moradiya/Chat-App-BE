import mongoose from "mongoose";

const emojiSchema = new mongoose.Schema({
  emoji: {
    type: String,
    require: true,
  },
  group: {
    type: String,
    require: true,
  },
  subgroup: {
    type: String,
    require: true,
  },
  annotation: {
    type: String,
    require: true,
  },
  tags: [String],
  order: Number,
  shortcodes: [String],
});

emojiSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

const Emoji = mongoose.model("Emoji", emojiSchema);

export default Emoji;
