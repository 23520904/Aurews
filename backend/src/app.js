import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./lib/db.js";
import cors from "cors";
import cookieParser from "cookie-parser";
import compression from "compression";
import apiRoutes from "./routes/index.route.js";
import morgan from "morgan";

dotenv.config();

export const createApp = () => {
  const app = express();
  
  // Tắt ETag để luôn trả về 200 OK (Full Data) thay vì 304 (Not Modified)
  // Giúp dễ debug hơn trong quá trình phát triển
  app.set('etag', false);

  if (process.env.NODE_ENV !== "test" && process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
  }

  app.use(
    cors({
      origin: true,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
  );

  app.use(compression());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.use("/api", apiRoutes);

  app.get("/ping", (req, res) => {
    res.status(200).json({ message: "Pong! Server is running fine." });
  });

  app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    if (process.env.NODE_ENV !== "test") {
      console.error(`[Error] ${statusCode}: ${message}`);
    }

    res.status(statusCode).json({
      success: false,
      statusCode,
      message,
      stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
  });

  return app;
};
