import { Router } from "express";

import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../controllers/userController";


import {
  authenticateToken,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

// Only administrators can manage users
router.get(
  "/",
  authenticateToken,
  authorizeRoles("admin"),
  getUsers
);

router.patch(
  "/:id/role",
  authenticateToken,
  authorizeRoles("admin"),
  updateUserRole
);

router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  updateUserStatus
);

export default router;