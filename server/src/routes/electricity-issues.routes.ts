import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess, requireAccessOrClient } from "../middlewares/role.middleware";
import {
    getIssues,
    getIssueById,
    createIssue,
    updateIssue,
    deleteIssue,
} from "../controllers/electricity-issues.controller";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Read + Create — employees with electricity access OR the client themselves
router.get("/", requireAccessOrClient("electricity"), getIssues);
router.get("/:id", requireAccessOrClient("electricity"), getIssueById);
router.post("/", requireAccessOrClient("electricity"), createIssue);

// Update + Delete — employees only
router.patch("/:id", requireAccess("electricity"), updateIssue);
router.delete("/:id", requireAccess("electricity"), deleteIssue);

export default router;
