import Emoji from "../models/emoji.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getEmojis = asyncHandler(async (req, res) => {
  const { group, subgroup, tag } = req.query;

  const query = {
    ...(group && { group }),
    ...(subgroup && { subgroup }),
    ...(tag && { tags: tag }),
  };

  const emojis = await Emoji.find(query);

  if (!emojis || emojis.length === 0) {
    return res.status(404).json(new ApiResponse(404, {}, "No emojis found"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, emojis, "Emojis retrieved successfully"));
});

export { getEmojis };
