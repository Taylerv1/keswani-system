import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getRentOverview } from "../controllers/rent.controller";

const router = Router();

router.use(authenticate);

router.get("/overview", getRentOverview);

export default router;
