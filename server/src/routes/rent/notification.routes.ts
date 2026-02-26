import { Router } from "express";
import { requireAccess } from "../../middlewares/role.middleware";
import {
    getNotifications,
    getNotificationById,
    createNotification,
    updateNotification,
    markAllRead,
    deleteNotification,
} from "../../controllers/rent/notification.controller";

const router = Router();

// Bulk action (MUST be before /:id to avoid conflict)
router.patch("/mark-all-read", markAllRead);

// Read
router.get("/", getNotifications);
router.get("/:id", getNotificationById);

// Write — require 'rent' access
router.post("/", requireAccess("rent"), createNotification);
router.patch("/:id", requireAccess("rent"), updateNotification);
router.delete("/:id", requireAccess("rent"), deleteNotification);

export default router;
