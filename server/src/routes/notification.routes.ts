import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";
import {
    getNotifications,
    getNotificationStats,
    createNotification,
    markNotificationRead,
    markAllNotificationsRead,
} from "../controllers/notification.controller";

const router = Router();

router.use(authenticate);

// Read
router.get("/", getNotifications);
router.get("/stats", getNotificationStats);

// Write — require rent or electricity access (broad access for notifications)
router.post("/", createNotification);

// Mark read
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;
