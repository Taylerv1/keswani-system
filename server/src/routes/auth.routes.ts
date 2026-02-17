import { Router } from "express";
import {
    login,
    forgotPassword,
    resetPassword,
    getMe,
    logout,
    refreshToken,
} from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// Public routes (no auth required)
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/refresh", refreshToken);

// Protected routes (auth required)
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

export default router;
