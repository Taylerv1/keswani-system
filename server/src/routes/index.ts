import { Router } from "express";
import authRoutes from "./auth.routes";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
router.use("/auth", authRoutes);

// Future route modules will be added here:
// router.use("/employees", employeeRoutes);
// router.use("/clients", clientRoutes);
// router.use("/properties", propertyRoutes);
// router.use("/contracts", contractRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/electricity", electricityRoutes);
// router.use("/expenses", expenseRoutes);

export default router;
