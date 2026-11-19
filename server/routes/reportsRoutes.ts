import { Router } from "express";
import { getReports } from "../controllers/reportsController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getReports);

export default router;