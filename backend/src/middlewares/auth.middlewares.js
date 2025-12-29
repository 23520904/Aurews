import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { setCookies } from "../lib/cookie.js";
import { generateTokens, storeRefreshToken } from "../lib/token.js";
import { redis } from "../lib/redis.js";
import asyncHandler from "../utils/asyncHandler.js";
/**
 * @desc    Middleware kiểm tra user đã đăng nhập chưa
 */
export const protectRoute = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - No access token provided",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user)
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: "Banned user" });
    }
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      const rt = req.cookies.refreshToken;
      if (!rt) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
      }
      try {
        const decodedRt = jwt.verify(rt, process.env.JWT_REFRESH_SECRET);
        const storedToken = await redis.get(
          `refresh_token:${decodedRt.userId}`
        );
        if (storedToken !== rt) {
          return res.status(401).json({ message: "Invalid refresh token" });
        }
        const { accessToken, refreshToken } = generateTokens(decodedRt.userId);
        await storeRefreshToken(decodedRt.userId, refreshToken);
        setCookies(res, accessToken, refreshToken);
        const user = await User.findById(decodedRt.userId);
        if (!user)
          return res
            .status(401)
            .json({ success: false, message: "User not found" });
        if (user.isBanned) {
          return res
            .status(403)
            .json({ success: false, message: "Banned user" });
        }
        req.user = user;
        return next();
      } catch (e) {
        return res
          .status(401)
          .json({ message: "Unauthorized - Refresh token expired or invalid" });
      }
    }
    return next(error);
  }
});

/**
 * @desc    Middleware kiểm tra vai trò (phân quyền)
 * @example authorize('admin') // Chỉ admin
 * @example authorize('admin', 'author') // Admin hoặc Author
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (roles.includes(req.user.role) && req.user) {
      next();
    } else
      return res.status(403).json({ success: false, message: "Access Denied" });
  };
};

/**
 * @desc    Middleware kiểm tra user (tùy chọn), không chặn nếu chưa login
 *          Dùng cho các route public nhưng cần biết user là ai (VD: xem post detail để biết đã like chưa)
 */
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return next(); // Không có token -> Guest -> Next
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const user = await User.findById(decoded.userId);

    if (user && !user.isBanned) {
      req.user = user;
    }
    // Nếu user không tồn tại hoặc bị ban, ta cứ coi như guest
    next();
  } catch (error) {
    // Token lỗi hoặc hết hạn -> Coi như guest
    next();
  }
});
