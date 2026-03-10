import { Router } from "express";
import {
    getElectricityDebts,
    getElectricityOverview,
    getElectricityReports,
} from "../controllers/electricity-insight.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/debts", requireAccess("electricity"), getElectricityDebts);
router.get("/reports", requireAccess("electricity"), getElectricityReports);
router.get("/overview", requireAccess("electricity"), getElectricityOverview);

export default router;
