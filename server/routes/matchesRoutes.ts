import { Router } from "express";

import {
  getMatches,
  updateMatchStatus,
} from "../controllers/matchesContoller";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, getMatches);

router.patch(
  "/:id/status",
  authenticateToken,
  updateMatchStatus
);

export default router;