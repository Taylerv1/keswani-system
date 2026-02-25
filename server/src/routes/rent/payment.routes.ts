import { Router } from "express";
import { requireAccess } from "../../middlewares/role.middleware";
import {
    getPayments,
    getPaymentById,
    createPayment,
    updatePayment,
    deletePayment,
} from "../../controllers/rent/payment.controller";

const router = Router();

// Read
router.get("/", getPayments);
router.get("/:id", getPaymentById);

// Write — require 'rent' access
router.post("/", requireAccess("rent"), createPayment);
router.patch("/:id", requireAccess("rent"), updatePayment);
router.delete("/:id", requireAccess("rent"), deletePayment);

export default router;
