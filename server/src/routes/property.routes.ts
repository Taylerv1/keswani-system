import { Router } from "express";
import {
    getProperties,
    getPropertyById,
    getPropertiesLookup,
    getElectricityBuildings,
    createElectricityBuilding,
    updateElectricityBuilding,
    deleteElectricityBuilding,
    createProperty,
    updateProperty,
    deleteProperty,
} from "../controllers/property.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

// All property routes require auth + employee verification
router.use(authenticate);

// Lookup (before /:id to avoid conflict)
router.get("/lookup", getPropertiesLookup);
router.get("/electricity/buildings", requireAccess("electricity"), getElectricityBuildings);
router.post("/electricity/buildings", requireAccess("electricity"), createElectricityBuilding);
router.patch("/electricity/buildings/:id", requireAccess("electricity"), updateElectricityBuilding);
router.delete("/electricity/buildings/:id", requireAccess("electricity"), deleteElectricityBuilding);

// CRUD
router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/", requireAccess("rent"), createProperty);
router.patch("/:id", requireAccess("rent"), updateProperty);
router.delete("/:id", requireAccess("rent"), deleteProperty);

export default router;
