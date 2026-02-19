import { Router } from "express";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import clientRoutes from "./client.routes";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
router.use("/auth", authRoutes);

// Resource routes
router.use("/properties", propertyRoutes);
router.use("/clients", clientRoutes);

// Future route modules:
// router.use("/employees", employeeRoutes);
// router.use("/contracts", contractRoutes);
// router.use("/payments", paymentRoutes);
// router.use("/electricity", electricityRoutes);
// router.use("/expenses", expenseRoutes);

export default router;
