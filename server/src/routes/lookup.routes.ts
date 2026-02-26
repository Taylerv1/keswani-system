import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getLookups } from "../controllers/lookup.controller";

const router = Router();

router.use(authenticate);
router.get("/", getLookups);

export default router;
