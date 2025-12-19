import { protectRoute } from "../middlewares/auth.middlewares.js";
import {
  login,
  logout,
  refreshToken,
  register,
} from "./../controllers/auth.controller.js";
import express from "express";
const router = express.Router();
router.post("/register", register);
router.post("/login", login);
router.post("/logout", protectRoute, logout);
router.post("/refresh-token", refreshToken);
export default router;
