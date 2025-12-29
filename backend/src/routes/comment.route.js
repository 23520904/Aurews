import express from "express";
import {
  createComment,
  deleteComment,
  getComments,
  toggleLikeComment,
} from "../controllers/comment.controller.js";
import { protectRoute } from "../middlewares/auth.middlewares.js";
const router = express.Router();

// GET comments không cần login cũng xem được
router.get("/:postId", getComments);

// Phải login mới được Comment hoặc Xóa
router.post("/:postId", protectRoute, createComment);
router.delete("/:commentId", protectRoute, deleteComment);
router.put("/like/:commentId", protectRoute, toggleLikeComment);

export default router;
