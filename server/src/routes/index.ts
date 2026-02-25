import { Router } from "express";
import authRoutes from "./auth.routes";
import rentRoutes from "./rent";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
router.use("/auth", authRoutes);

// Rent module (all rent resources nested)
router.use("/rent", rentRoutes);

// Future route modules:
// router.use("/electricity", electricityRoutes);
// router.use("/expenses", expenseRoutes);

export default router;
