import { Router } from "express";
import {
    createElectricityPayment,
    getElectricityPayments,
} from "../controllers/electricity-payment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireAccess("electricity"), getElectricityPayments);
router.post("/", requireAccess("electricity"), createElectricityPayment);

export default router;
