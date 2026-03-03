import { Router } from "express";
import authRoutes from "./auth.routes";
import propertyRoutes from "./property.routes";
import clientRoutes from "./client.routes";
import subscriberRoutes from "./subscriber.routes";
import contractRoutes from "./contract.routes";
import maintenanceRoutes from "./maintenance.routes";
import paymentRoutes from "./payment.routes";
import rentRoutes from "./rent.routes";
import lookupRoutes from "./lookup.routes";
import notificationRoutes from "./notification.routes";

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
router.use("/subscribers", subscriberRoutes);
router.use("/contracts", contractRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/payments", paymentRoutes);
router.use("/rent", rentRoutes);
router.use("/lookups", lookupRoutes);
router.use("/notifications", notificationRoutes);

// Future route modules:
// router.use("/employees", employeeRoutes);
// router.use("/electricity", electricityRoutes);
// router.use("/expenses", expenseRoutes);

export default router;
