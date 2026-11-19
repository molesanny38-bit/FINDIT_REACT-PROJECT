import { Request, Response } from "express";
import db from "../config/db";
import bcrypt from "bcrypt";

// Get all users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const [users]: any = await db.query(`
      SELECT
        user_id,
        first_name,
        middle_name,
        last_name,
        email,
        student_staff_id,
        role,
        status,
        created_at
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
    });
  }
};

// Update user role
export const updateUserRole = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = Number(req.params.id);
    const { role } = req.body;

    const validRoles = ["admin", "staff", "student"];

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    const currentUser = (req as any).user;

    if (Number(currentUser.user_id) === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const [result]: any = await db.query(
      "UPDATE users SET role = ? WHERE user_id = ?",
      [role, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: "User role updated successfully.",
    });
  } catch (error) {
    console.error("Update role error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role.",
    });
  }
};

// Update user status
export const updateUserStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "suspended"];

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid account status.",
      });
    }

    const currentUser = (req as any).user;

    if (Number(currentUser.user_id) === userId) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own account status.",
      });
    }

    const [result]: any = await db.query(
      "UPDATE users SET status = ? WHERE user_id = ?",
      [status, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      message: "User status updated successfully.",
    });
  } catch (error) {
    console.error("Update status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user status.",
    });
  }
};

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const [users]: any = await db.query(
            `SELECT
                user_id,
                first_name,
                middle_name,
                last_name,
                email,
                student_staff_id,
                role,
                status,
                created_at
            FROM users
            WHERE user_id = ?`,
            [currentUser.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User profile not found.",
            });
        }

        return res.json({
            success: true,
            user: users[0],
        });
    } catch (error) {
        console.error("Get profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve profile.",
        });
    }
};

export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const { first_name, middle_name, last_name, email } = req.body;

        if (!first_name?.trim() || !last_name?.trim() || !email?.trim()) {
            return res.status(400).json({
                success: false,
                message: "First name, last name, and email are required.",
            });
        }

        const [existingUsers]: any = await db.query(
            "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
            [email.trim(), currentUser.user_id]
        );

        if (existingUsers.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email address is already being used.",
            });
        }

        await db.query(
            `UPDATE users
             SET first_name = ?,
                 middle_name = ?,
                 last_name = ?,
                 email = ?
             WHERE user_id = ?`,
            [
                first_name.trim(),
                middle_name?.trim() || null,
                last_name.trim(),
                email.trim(),
                currentUser.user_id,
            ]
        );

        return res.json({
            success: true,
            message: "Profile updated successfully.",
        });
    } catch (error) {
        console.error("Update profile error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
        });
    }
};

export const changeMyPassword = async (req: Request, res: Response) => {
    try {
        const currentUser = (req as any).user;

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: "Current and new passwords are required.",
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 8 characters.",
            });
        }

        const [users]: any = await db.query(
            "SELECT password FROM users WHERE user_id = ?",
            [currentUser.user_id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        const passwordMatches = await bcrypt.compare(
            currentPassword,
            users[0].password
        );

        if (!passwordMatches) {
            return res.status(400).json({
                success: false,
                message: "Current password is incorrect.",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.query(
            "UPDATE users SET password = ? WHERE user_id = ?",
            [hashedPassword, currentUser.user_id]
        );

        return res.json({
            success: true,
            message: "Password changed successfully.",
        });
    } catch (error) {
        console.error("Change password error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to change password.",
        });
    }
};