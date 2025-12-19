import express from "express";
import authRoute from "./auth.route.js";
import userRoute from "./user.route.js";
import postRoute from "./post.route.js";
import reportRoutes from "./report.route.js";
import applicationRoute from "./application.route.js";
import commentRoutes from "./comment.route.js";

const router = express.Router();

// Định nghĩa Resource (Tên số nhiều thường được ưa chuộng trong RESTful)
router.use("/auth", authRoute);
router.use("/users", userRoute); // /api/users
router.use("/posts", postRoute); // /api/posts
router.use("/applications", applicationRoute); // /api/applications
router.use("/comments", commentRoutes); // /api/comments
router.use("/reports", reportRoutes);
export default router;
