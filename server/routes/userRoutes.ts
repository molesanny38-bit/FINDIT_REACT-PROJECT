
import { Router } from "express";

import {
    getUsers,
    updateUserRole,
    updateUserStatus,
    getMyProfile,
    updateMyProfile,
    changeMyPassword,
  } from "../controllers/userController";
import {
    authenticateToken,
    authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();


// PROFILE MANAGEMENT
// Available to all authenticated users


// Get logged-in user's profile
router.get(
    "/me",
    authenticateToken,
    getMyProfile
);

// Update logged-in user's profile
router.put(
    "/me",
    authenticateToken,
    updateMyProfile
);

// Change logged-in user's password
router.patch(
    "/me/password",
    authenticateToken,
    changeMyPassword
);


// USER MANAGEMENT
// Admin only


// Get all users
router.get(
    "/",
    authenticateToken,
    authorizeRoles("admin"),
    getUsers
);

// Update user role
router.patch(
    "/:id/role",
    authenticateToken,
    authorizeRoles("admin"),
    updateUserRole
);

// Update user account status
router.patch(
    "/:id/status",
    authenticateToken,
    authorizeRoles("admin"),
    updateUserStatus
);

export default router;
