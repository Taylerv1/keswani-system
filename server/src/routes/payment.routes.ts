import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";
import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
} from "../controllers/payment.controller";

const router = Router();

// All routes require employee auth
router.use(authenticate);

// Read
router.get("/", getPayments);
router.get("/:id", getPaymentById);

// Write — require 'rent' access
router.post("/", requireAccess("rent"), createPayment);
router.patch("/:id", requireAccess("rent"), updatePayment);
router.delete("/:id", requireAccess("rent"), deletePayment);

export default router;
