import { Router } from "express";
import {
    createReading,
    generateBillFromReading,
    getReadings,
} from "../controllers/reading.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireAccess("electricity"), getReadings);
router.post("/", requireAccess("electricity"), createReading);
router.post("/:id/generate-bill", requireAccess("electricity"), generateBillFromReading);

export default router;
