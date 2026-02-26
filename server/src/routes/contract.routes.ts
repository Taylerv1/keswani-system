import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";
import {
    getContracts,
    getContractById,
    createContract,
    updateContract,
    deleteContract,
} from "../controllers/contract.controller";

const router = Router();

// All routes require employee auth
router.use(authenticate);

// Read
router.get("/", getContracts);
router.get("/:id", getContractById);

// Write — require 'rent' access
router.post("/", requireAccess("rent"), createContract);
router.patch("/:id", requireAccess("rent"), updateContract);
router.delete("/:id", requireAccess("rent"), deleteContract);

export default router;
