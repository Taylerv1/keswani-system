import { Router } from "express";
import { requireAccess, requireAccessOrClient } from "../../middlewares/role.middleware";
import {
    getMaintenanceRequests,
    getMaintenanceById,
    createMaintenance,
    updateMaintenance,
    deleteMaintenance,
} from "../../controllers/rent/maintenance.controller";

const router = Router();

// Read
router.get("/", getMaintenanceRequests);
router.get("/:id", getMaintenanceById);

// Write — allow clients or employees with 'rent' access
router.post("/", requireAccessOrClient("rent"), createMaintenance);
router.patch("/:id", requireAccess("rent"), updateMaintenance);
router.delete("/:id", requireAccess("rent"), deleteMaintenance);

export default router;
