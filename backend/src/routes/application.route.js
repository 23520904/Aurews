import { authorize, protectRoute } from "../middlewares/auth.middlewares.js";
import express from 'express'
import { authorApplicationUpload } from "../utils/fileUpload.js";
import { getAllApplications, getMyApplication, reviewApplication, submitApplication } from "../controllers/application.controller.js";
const router = express.Router();
router.use(protectRoute);

// --- ROUTE CHO USER (READER) ---
// Nộp đơn (Có upload file)
router.post(
  "/submit",
  protectRoute,
  authorApplicationUpload, // Middleware Multer xử lý file trước
  submitApplication
);

// Xem trạng thái đơn của mình
router.get("/me", protectRoute, getMyApplication);

// --- ROUTE CHO ADMIN ---
// Xem danh sách đơn
router.get("/admin/all", protectRoute, authorize("admin"), getAllApplications);

// Duyệt đơn
router.put(
  "/admin/:applicationId/review",
  protectRoute,
  authorize("admin"),
  reviewApplication
);
export default router;
