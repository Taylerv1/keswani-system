import { Router } from "express";
import {
    createPricingPlan,
    getPricingPlans,
    updatePricingPlan,
} from "../controllers/pricing.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireAccess("electricity"), getPricingPlans);
router.post("/", requireAccess("electricity"), createPricingPlan);
router.patch("/:id", requireAccess("electricity"), updatePricingPlan);
router.put("/:id", requireAccess("electricity"), updatePricingPlan);

export default router;
