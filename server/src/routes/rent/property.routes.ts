import { Router } from "express";
import {
    getProperties,
    getPropertyById,
    getPropertiesLookup,
    createProperty,
    updateProperty,
    deleteProperty,
} from "../../controllers/rent/property.controller";
import { requireAccess } from "../../middlewares/role.middleware";

const router = Router();

// Lookup (before /:id to avoid conflict)
router.get("/lookup", getPropertiesLookup);

// CRUD
router.get("/", getProperties);
router.get("/:id", getPropertyById);
router.post("/", requireAccess("rent"), createProperty);
router.patch("/:id", requireAccess("rent"), updateProperty);
router.delete("/:id", requireAccess("rent"), deleteProperty);

export default router;
