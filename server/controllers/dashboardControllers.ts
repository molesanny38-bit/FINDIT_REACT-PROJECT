import { Request, Response } from "express";
import db from "../config/db";

export const getDashboardStats = async (
  req: Request,
  res: Response
) => {
  try {
    const [
      [totalUsers],
      [totalItems],
      [lostItems],
      [foundItems],
      [pendingClaims],
      [approvedClaims],
    ]: any = await Promise.all([
      db.query("SELECT COUNT(*) AS total FROM users"),
      db.query("SELECT COUNT(*) AS total FROM items"),
      db.query(
        "SELECT COUNT(*) AS total FROM items WHERE item_type = 'lost'"
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM items WHERE item_type = 'found'"
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM claims WHERE claim_status = 'pending'"
      ),
      db.query(
        "SELECT COUNT(*) AS total FROM claims WHERE claim_status = 'approved'"
      ),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers: Number(totalUsers[0].total),
        totalItems: Number(totalItems[0].total),
        lostItems: Number(lostItems[0].total),
        foundItems: Number(foundItems[0].total),
        pendingClaims: Number(pendingClaims[0].total),
        approvedClaims: Number(approvedClaims[0].total),
      },
    });
  } catch (error) {
    console.error("Dashboard statistics error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard statistics.",
    });
  }
};