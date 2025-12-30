import express from "express";
import {
  getBookmarks,
  getLikedPosts,
  getNotifications,
  getProfile,
  getUserPublicProfile,
  getFollowers,
  getFollowing,
  markNotificationsRead,
  getReadingHistory,
  getUserPreferences,
  getUsers,
  switchBan,
  toggleFollow,
  updateProfile,
  updateUserPreferences,
  getTopAuthors,
  toggleBookmark,
  searchUsers,
  getAdminDashboardStats,
  getAuthorStats,
} from "../controllers/user.controller.js";
import { uploadAvatar } from "../utils/fileUpload.js"; // <--- SỬA LẠI ĐƯỜNG DẪN ĐÚNG
import { authorize, protectRoute } from "../middlewares/auth.middlewares.js";

const router = express.Router();
// Thêm vào user.route.js
// PUBLIC ROUTE (Đặt trên router.use(protectRoute))
router.get("/top-authors", getTopAuthors);
router.get("/search", searchUsers); // Public Search Route
router.get("/:userId/profile", getUserPublicProfile);

router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);
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
router.get("/me/likes", getLikedPosts);

console.log("Check function:", getNotifications);

router.get("/me/notifications", getNotifications);
router.put("/me/notifications/read", markNotificationsRead);

router.post("/:userId/follow", toggleFollow);

// --- ADMIN ROUTES ---
router.get("/", authorize("admin"), getUsers);
router.put("/:userId/ban", authorize("admin"), switchBan);

router.post("/me/bookmarks/:postId", toggleBookmark); // [POST] để thực hiện hành động toggle

router.get("/analytics/growth", authorize("admin"), getAdminDashboardStats);

router.get("/author/stats", authorize("author", "admin"), getAuthorStats);
export default router;
