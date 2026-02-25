import { Router } from "express";
import { getElectricityOverview } from "../controllers/electricity.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/overview", requireAccess("electricity"), getElectricityOverview);

export default router;
