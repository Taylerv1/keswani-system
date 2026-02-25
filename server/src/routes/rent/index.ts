import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware";
import { getRentOverview } from "../../controllers/rent/overview.controller";
import propertyRoutes from "./property.routes";
import clientRoutes from "./client.routes";
import contractRoutes from "./contract.routes";
import maintenanceRoutes from "./maintenance.routes";
import paymentRoutes from "./payment.routes";
import notificationRoutes from "./notification.routes";

const router = Router();

// All rent routes require authentication
router.use(authenticate);

// Overview dashboard
router.get("/overview", getRentOverview);

// Sub-modules
router.use("/properties", propertyRoutes);
router.use("/clients", clientRoutes);
router.use("/contracts", contractRoutes);
router.use("/maintenance", maintenanceRoutes);
router.use("/payments", paymentRoutes);
router.use("/notifications", notificationRoutes);

export default router;
