import { Router } from "express";
import {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    inviteClientAccess,
} from "../controllers/client.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

// All client routes require auth
router.use(authenticate);

// CRUD
router.get("/", requireAccess("rent"), getClients);
router.get("/:id", requireAccess("rent"), getClientById);
router.post("/", requireAccess("rent"), createClient);
router.patch("/:id", requireAccess("rent"), updateClient);
router.delete("/:id", requireAccess("rent"), deleteClient);
router.post("/:id/invite", requireAccess("rent"), inviteClientAccess);

export default router;
