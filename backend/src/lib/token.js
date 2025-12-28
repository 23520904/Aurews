// File này giữ nguyên, logic đã ổn.
import jwt from "jsonwebtoken";
import {redis} from "./redis.js";

export const generateTokens = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
  return { accessToken, refreshToken };
};

export const storeRefreshToken = async (userId, refreshToken) => {
  // Key trong redis: "refresh_token:USER_ID"
  // Thời gian hết hạn trong Redis cũng nên khớp với token (7 ngày)
  await redis.set(
    `refresh_token:${userId}`,
    refreshToken,
    "EX",
    7 * 24 * 60 * 60
  );
};
