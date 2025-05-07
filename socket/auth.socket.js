import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

const handleAuth = async (socket) => {
  const cookies = cookie.parse(socket.handshake.headers.cookie || "");
  const token = cookies.token || socket.handshake.auth.token;

  if (!token) throw new ApiError(401, "Token missing");

  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
  const user = await User.findById(decoded._id).select(
    "-password -refreshToken -__v"
  );

  if (!user) throw new ApiError(401, "User not found");

  socket.join(user._id.toString());
  return user;
};

export default handleAuth;
