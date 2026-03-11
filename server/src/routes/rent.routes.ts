import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";
import { getRentOverview } from "../controllers/rent.controller";

const router = Router();

router.use(authenticate);

router.get("/overview", requireAccess("rent"), getRentOverview);

export default router;
