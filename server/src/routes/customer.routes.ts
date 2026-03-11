// ============================================================
// Keswani System — Customer Dashboard Routes
// Routes for authenticated clients to access their own data
// ============================================================

import { Router } from "express";
import { getCustomerDashboard } from "../controllers/customer.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// GET /api/customer/dashboard - get full dashboard data for authenticated client
router.get("/dashboard", getCustomerDashboard);

export default router;
