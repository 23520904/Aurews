import express from "express";
import {
  getBookmarks,
  getProfile,
  getReadingHistory,
  getUserPreferences,
  getUsers,
  switchBan,
  toggleFollow,
  updateProfile,
  updateUserPreferences,
} from "../controllers/user.controller.js";
import { authorize, protectRoute } from "../middlewares/auth.middlewares.js";
import { uploadAvatar } from "../utils/fileUpload.js"; // <--- SỬA LẠI ĐƯỜNG DẪN ĐÚNG

const router = express.Router();

// Middleware chung
router.use(protectRoute);

// 1. Quản lý Profile cá nhân
router.get("/me", getProfile);
router.put("/me", uploadAvatar, updateProfile);

// 2. Quản lý Sở thích
router.get("/me/preferences", getUserPreferences);
router.put("/me/preferences", updateUserPreferences);

// 3. Quản lý Lịch sử & Bookmark & Follow
router.get("/me/history", getReadingHistory);
router.get("/me/bookmarks", getBookmarks);
router.post("/:userId/follow", toggleFollow);

// --- ADMIN ROUTES ---
router.get("/", authorize("admin"), getUsers);
router.put("/:userId/ban", authorize("admin"), switchBan);

export default router;
