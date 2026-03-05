import { Router } from "express";
import {
    getProperties,
    getPropertyById,
    getPropertiesLookup,
    getElectricityBuildings,
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

// CRUD
router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/", requireAccess("rent"), createProperty);
router.patch("/:id", requireAccess("rent"), updateProperty);
router.delete("/:id", requireAccess("rent"), deleteProperty);

export default router;
