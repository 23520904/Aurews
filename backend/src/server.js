import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression"; // Nén response để app load nhanh hơn
import apiRoutes from "./routes/index.route.js";
import morgan from "morgan"; // Log request để dễ debug
import os from "os";
dotenv.config();

const PORT = process.env.PORT || 6666;
const app = express();
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: true, // Cho phép mọi IP trong mạng LAN gọi vào (để test trên điện thoại thật)
    credentials: true, // Để Client gửi được Cookie/Token
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

// 3. Compression - Giảm dung lượng JSON trả về (Tốt cho mạng 3G/4G)
app.use(compression());

app.use(express.json({ limit: "10mb" })); // Tăng giới hạn để nhận bài viết dài

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());

// Gom tất cả API vào prefix /api/v1 (hoặc /api) cho chuyên nghiệp
app.use("/api", apiRoutes);

// Test route đơn giản để xem server sống hay chết
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "Pong! Server is running fine." });
});

// === GLOBAL ERROR HANDLER (Xử lý lỗi tập trung) ===
// Giúp Server không bị crash khi có lỗi bất ngờ
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log lỗi ra console server để dev dễ fix
  console.error(`[Error] ${statusCode}: ${message}`);
  if (process.env.NODE_ENV !== "production") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    // Chỉ hiện stack trace ở môi trường dev
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
});

app.listen(PORT, () => {
  connectDB();

  // LOGIC TÌM IP LAN
  const networks = os.networkInterfaces();
  let myIP = "localhost";

  for (const name of Object.keys(networks)) {
    for (const net of networks[name]) {
      // Tìm IPv4 và không phải internal (127.0.0.1)
      if (net.family === "IPv4" && !net.internal) {
        myIP = net.address;
        break;
      }
    }
  }

  console.log(`\n🚀 Server is running on port ${PORT}`);
  console.log(`🏠 Local:   http://localhost:${PORT}`);
  console.log(
    `🌐 Network: http://${myIP}:${PORT}  <-- DÙNG IP NÀY CHO EXPO APP\n`
  );
});
