import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";
import {
    getMaintenanceRequests,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
} from "../controllers/maintenance.controller";

const router = Router();

// All routes require employee auth
router.use(authenticate);

// Read
router.get("/", getMaintenanceRequests);
router.get("/:id", getMaintenanceById);

// Write — require 'rent' access
router.post("/", requireAccess("rent"), createMaintenance);
router.patch("/:id", requireAccess("rent"), updateMaintenance);
router.delete("/:id", requireAccess("rent"), deleteMaintenance);

export default router;
