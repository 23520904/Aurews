// backend/src/routes/post.route.js
import express from "express";
import multer from "multer";
import {
  createPost,
  getPosts,
  getPostDetail,
  deletePost,
  updatePost,
  getAuthorPosts,
  toggleLike,
  getMyPosts,
  speakText,
  transcribeAudio,
  refineText,
  chatWithArticle,
  restorePost, // <--- Đảm bảo đã import hàm này
} from "../controllers/post.controller.js";
import {
  protectRoute,
  authorize,
  optionalAuth,
} from "../middlewares/auth.middlewares.js";
import { postImageUpload, uploadEditorImage } from "../utils/fileUpload.js";

const router = express.Router();

const upload = multer({ dest: "uploads/" });
// ==================================================================
// 1. CÁC ROUTE TĨNH (STATIC ROUTES) - PHẢI ĐẶT LÊN ĐẦU
// ==================================================================

// Lấy danh sách bài viết (Public - có optional auth để check user)
router.get("/", optionalAuth, getPosts);

// Lấy bài viết CỦA TÔI (Protected) -> ĐẶT Ở ĐÂY ĐỂ KHÔNG BỊ NHẦN VỚI SLUG
router.get("/me", protectRoute, getMyPosts);

// Lấy danh sách bài viết của author (API cũ, nếu còn dùng)
router.get("/author/my-posts", protectRoute, getAuthorPosts);

// Upload ảnh trong Editor
router.post(
  "/upload",
  protectRoute,
  authorize("admin", "author"),
  uploadEditorImage,
  (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    res.status(200).json({ url: req.file.path });
  }
);

// ==================================================================
// 2. CÁC ROUTE ĐỘNG (DYNAMIC ROUTES) - ĐẶT SAU CÙNG
// ==================================================================

// Lấy chi tiết bài viết (slug có thể là bất cứ chuỗi nào, nên phải đặt sau /me)
router.get("/:slug", optionalAuth, getPostDetail);

// Tạo bài viết
router.post(
  "/",
  protectRoute,
  authorize("admin", "author"),
  postImageUpload,
  createPost
);

// Cập nhật bài viết
router.put(
  "/:postId",
  protectRoute,
  authorize("admin", "author"),
  postImageUpload,
  updatePost
);

// Xóa bài viết
router.delete("/:postId", protectRoute, deletePost);

// Like/Unlike
router.post("/:postId/like", protectRoute, toggleLike);

router.put(
  "/:postId/restore",
  protectRoute,
  authorize("admin", "author"),
  restorePost
);

// Text-to-Speech
router.post("/speak", speakText);
router.post("/transcribe", protectRoute, upload.single("audio"), transcribeAudio);
router.post("/refine", protectRoute, refineText);
router.post("/chat-article", chatWithArticle);

export default router;
