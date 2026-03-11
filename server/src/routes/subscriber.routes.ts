import { Router } from "express";
import {
    createSubscriber,
    deleteSubscriber,
    getSubscriberById,
    getSubscribers,
    updateSubscriber,
} from "../controllers/subscriber.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requireAccess } from "../middlewares/role.middleware";

const router = Router();

router.use(authenticate);

router.get("/", requireAccess("electricity"), getSubscribers);
router.get("/:id", requireAccess("electricity"), getSubscriberById);
router.post("/", requireAccess("electricity"), createSubscriber);
router.patch("/:id", requireAccess("electricity"), updateSubscriber);
router.delete("/:id", requireAccess("electricity"), deleteSubscriber);

export default router;
