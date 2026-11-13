import { Router } from "express";

import {
  getClaims,
  submitClaim,
  reviewClaim,
  markClaimAsReturned,
  getReturnHistory,
} from "../controllers/claimsControllers";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

// Claims
router.get("/", authenticateToken, getClaims);
router.post("/", authenticateToken, submitClaim);

// Review claims
router.patch("/:id/review", authenticateToken, reviewClaim);

// Item returns
router.get("/returns", authenticateToken, getReturnHistory);
router.patch("/:id/return", authenticateToken, markClaimAsReturned);

export default router;