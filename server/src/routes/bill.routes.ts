import { Router } from "express";
import {
    getElectricityBillById,
    getElectricityBills,
} from "../controllers/electricity-bill.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireAccess("electricity"), getElectricityBills);
router.get("/:id", requireAccess("electricity"), getElectricityBillById);

export default router;
