import { Request, Response } from "express";
import db from "../config/db";

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