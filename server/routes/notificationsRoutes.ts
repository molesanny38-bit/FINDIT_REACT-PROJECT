import { Router } from "express";

import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationsControllers";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getNotifications);

router.get("/unread-count", authenticateToken, getUnreadCount);

router.patch("/read-all", authenticateToken, markAllAsRead);

router.patch("/:id/read", authenticateToken, markAsRead);

export default router;