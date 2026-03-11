import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess, requireAccessOrClient } from "../middlewares/role.middleware";
import {
    getMaintenanceRequests,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
} from "../controllers/maintenance.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read
router.get("/", requireAccessOrClient("rent"), getMaintenanceRequests);
router.get("/:id", requireAccessOrClient("rent"), getMaintenanceById);

// Write
router.post("/", requireAccessOrClient("rent"), createMaintenance);
router.patch("/:id", requireAccess("rent"), updateMaintenance);
router.delete("/:id", requireAccess("rent"), deleteMaintenance);

export default router;
