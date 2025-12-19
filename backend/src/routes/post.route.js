import { authorize, protectRoute } from "./../middlewares/auth.middlewares.js";
import express from "express";
import { adminUpdateStatus, createPost, deletePost, getPostDetail, getPosts, restorePost, toggleLike, updatePost } from "../controllers/post.controller.js";
import { postImageUpload } from "../utils/fileUpload.js";
const router = express.Router();

// --- PUBLIC ROUTES (Ai cũng xem được) ---
router.get("/", getPosts);
router.get("/:slug", getPostDetail);

// --- PROTECTED ROUTES (Phải đăng nhập) ---
router.use(protectRoute); // Mọi route bên dưới đều cần Login

// 1. Tương tác (Reader/Author/Admin)
router.post("/:postId/like", toggleLike);

// 2. Quản lý bài viết (Author & Admin)
router.post(
  "/",
  authorize("author", "admin"),
  postImageUpload, // Upload ảnh bìa
  createPost
);

router.put(
  "/:postId",
  authorize("author", "admin"),
  postImageUpload,
  updatePost
);

router.delete("/:postId", authorize("author", "admin"), deletePost);

// 3. Admin Power (Duyệt bài, Khôi phục bài xóa)
router.put("/:postId/status", authorize("admin"), adminUpdateStatus);

router.post("/:postId/restore", authorize("admin"), restorePost);

export default router;
