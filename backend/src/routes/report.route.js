import express from "express";
import { protectRoute, authorize } from "../middlewares/auth.middlewares.js";
import {
  createReport,
  getAllReports,
  resolveReport,
} from "../controllers/report.controller.js";

const router = express.Router();

// User gửi báo cáo (Cần đăng nhập)
router.post("/", protectRoute, createReport);

// Admin xem và xử lý báo cáo
router.get("/", protectRoute, authorize("admin"), getAllReports);
router.put("/:reportId", protectRoute, authorize("admin"), resolveReport);

export default router;
