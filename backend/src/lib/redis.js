import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

// Kiểm tra xem biến môi trường có tồn tại không để tránh lỗi crash app thầm lặng
if (!process.env.UPSTASH_REDIS_URL) {
  console.error("Redis URL is missing in .env file!");
}

// Nếu không có biến môi trường thì dùng localhost
export const redis = new Redis(process.env.UPSTASH_REDIS_URL || "redis://localhost:6379");