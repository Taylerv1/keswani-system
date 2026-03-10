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
import customerRoutes from "./customer.routes";
import pricingRoutes from "./pricing.routes";
import meterRoutes from "./meter.routes";
import readingRoutes from "./reading.routes";
import billRoutes from "./bill.routes";
import billPaymentRoutes from "./bill-payment.routes";
import electricityRoutes from "./electricity.routes";
import employeeRoutes from "./employee.routes";

const router = Router();

// Health check
router.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes
router.use("/auth", authRoutes);

// Customer-facing routes
router.use("/customer", customerRoutes);

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
router.use("/pricing", pricingRoutes);
router.use("/meters", meterRoutes);
router.use("/readings", readingRoutes);
router.use("/bills", billRoutes);
router.use("/bill-payments", billPaymentRoutes);
router.use("/electricity", electricityRoutes);
router.use("/employees", employeeRoutes);

// Future route modules:
// router.use("/electricity", electricityRoutes);
// router.use("/expenses", expenseRoutes);

export default router;
