import { Router } from "express";
import {
    createMeter,
    deleteMeter,
    getMeterById,
    getMeters,
    updateMeter,
} from "../controllers/meter.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireAccess("electricity"), getMeters);
router.get("/:id", requireAccess("electricity"), getMeterById);
router.post("/", requireAccess("electricity"), createMeter);
router.patch("/:id", requireAccess("electricity"), updateMeter);
router.delete("/:id", requireAccess("electricity"), deleteMeter);

export default router;
