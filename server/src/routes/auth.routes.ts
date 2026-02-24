import { Router } from "express";
import {
    login,
    forgotPassword,
    resetPassword,
    getMe,
    logout,
    refreshToken,
    updateProfile,
    changePassword,
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
router.patch("/profile", authenticate, updateProfile);
router.patch("/change-password", authenticate, changePassword);
router.post("/logout", authenticate, logout);

export default router;
