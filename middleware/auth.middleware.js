import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createError } from "../utils/ApiError.js";
import User from "../models/user.model.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      next(createError.unauthorized("Access denied. No token provided"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if (!decoded?._id) {
      next(createError.unauthorized("Invalid token payload"));
    }

    const user = await User.findById(decoded._id)
      .select("-password -__v -friends -mutedChats")
      .lean();

    if (!user) {
      next(createError.unauthorized("User not found"));
    }

    let refreshTokenIat, refreshTokenExp;
    if (user.refreshToken) {
      const decodedRefresh = jwt.decode(user.refreshToken);
      if (decodedRefresh) {
        refreshTokenIat = decodedRefresh.iat;
        refreshTokenExp = decodedRefresh.exp;
      }
    }

    const { iat: accessTokenIat, exp: accessTokenExp } = decoded;

    delete user.refreshToken;

    req.user = {
      ...user,
      accessTokenIat,
      accessTokenExp,
      refreshTokenIat,
      refreshTokenExp,
    };

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);

    if (error.name === "JsonWebTokenError") {
      return next(createError.forbidden("Invalid token"));
    } else if (error.name === "TokenExpiredError") {
      return next(
        createError.forbidden("Token has expired, please get a new token")
      );
    }

    next(
      createError.internalServerError(
        "Authentication error occurred on the server"
      )
    );
  }
});

export { verifyJWT };
