import { Router } from "express";
import { requireAccess } from "../../middlewares/role.middleware";
import {
    getContracts,
    getContractById,
    createContract,
    updateContract,
    deleteContract,
} from "../../controllers/rent/contract.controller";

const router = Router();

// Read
router.get("/", getContracts);
router.get("/:id", getContractById);

// Write — require 'rent' access
router.post("/", requireAccess("rent"), createContract);
router.patch("/:id", requireAccess("rent"), updateContract);
router.delete("/:id", requireAccess("rent"), deleteContract);

export default router;
