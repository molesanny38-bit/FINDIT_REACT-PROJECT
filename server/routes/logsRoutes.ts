import { Router } from "express";
import { getActivityLogs } from "../controllers/activitylogsController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getActivityLogs);

export default router;