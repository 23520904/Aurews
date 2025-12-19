import express from "express";
const router = express.Router();

// GET comments không cần login cũng xem được
router.get("/:postId", getComments);

// Phải login mới được Comment hoặc Xóa
router.post("/:postId", verifyToken, createComment);
router.delete("/:commentId", verifyToken, deleteComment);

export default router;
