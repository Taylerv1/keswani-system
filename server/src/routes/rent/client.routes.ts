import { Router } from "express";
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
} from "../../controllers/rent/client.controller";
import { requireAccess } from "../../middlewares/role.middleware";

const router = Router();

// CRUD
router.get("/", getClients);
router.get("/:id", getClientById);
router.post("/", requireAccess("rent"), createClient);
router.patch("/:id", requireAccess("rent"), updateClient);
router.delete("/:id", requireAccess("rent"), deleteClient);

export default router;
