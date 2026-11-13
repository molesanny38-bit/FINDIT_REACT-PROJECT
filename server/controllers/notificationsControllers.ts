import { Request, Response } from "express";
import db from "../config/db";

// GET ALL NOTIFICATIONS FOR LOGGED-IN USER
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    const [notifications]: any = await db.query(
      `SELECT
        notification_id,
        user_id,
        title,
        message,
        is_read,
        created_at
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [user.user_id]
    );

    return res.status(200).json(notifications);
  } catch (error) {
    console.error("Get notifications error:", error);

    return res.status(500).json({
      message: "Failed to retrieve notifications.",
    });
  }
};

// GET UNREAD NOTIFICATION COUNT
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    const [result]: any = await db.query(
      `SELECT COUNT(*) AS unread_count
       FROM notifications
       WHERE user_id = ? AND is_read = 0`,
      [user.user_id]
    );

    return res.status(200).json({
      unread_count: result[0].unread_count,
    });
  } catch (error) {
    console.error("Unread count error:", error);

    return res.status(500).json({
      message: "Failed to retrieve unread notification count.",
    });
  }
};

// MARK ONE NOTIFICATION AS READ
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    const [result]: any = await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE notification_id = ? AND user_id = ?`,
      [id, user.user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      message: "Notification marked as read.",
    });
  } catch (error) {
    console.error("Mark notification as read error:", error);

    return res.status(500).json({
      message: "Failed to update notification.",
    });
  }
};

// MARK ALL NOTIFICATIONS AS READ
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    await db.query(
      `UPDATE notifications
       SET is_read = 1
       WHERE user_id = ? AND is_read = 0`,
      [user.user_id]
    );

    return res.status(200).json({
      message: "All notifications marked as read.",
    });
  } catch (error) {
    console.error("Mark all notifications as read error:", error);

    return res.status(500).json({
      message: "Failed to update notifications.",
    });
  }
};