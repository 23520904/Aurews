import express from "express";
import {
  createReport,
  getAllReports,
  resolveReport,
} from "../controllers/report.controller.js";
import { authorize, protectRoute } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// User gửi báo cáo (Cần đăng nhập)
router.post("/", protectRoute, createReport);

// Admin xem và xử lý báo cáo
router.get("/", protectRoute, authorize("admin"), getAllReports);
router.put("/:reportId", protectRoute, authorize("admin"), resolveReport);

export default router;
