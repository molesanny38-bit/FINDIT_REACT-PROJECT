import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../config/db";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

// =====================================================
// GET ALL MATCHES
// =====================================================

export const getMatches = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const isPrivileged = ["admin", "staff"].includes(user.role);

    const [matches] = await db.query<RowDataPacket[]>(
      `SELECT
        item_matches.match_id,
        item_matches.lost_item_id,
        item_matches.found_item_id,
        item_matches.matching_percentage,
        item_matches.match_status,
        item_matches.created_at,

        lost.item_name AS lost_item_name,
        lost.description AS lost_description,
        lost.color AS lost_color,
        lost.brand AS lost_brand,
        lost.date_lost_found AS lost_date,
        lost.status AS lost_status,
        lost.user_id AS lost_user_id,

        found.item_name AS found_item_name,
        found.description AS found_description,
        found.color AS found_color,
        found.brand AS found_brand,
        found.date_lost_found AS found_date,
        found.status AS found_status,
        found.user_id AS found_user_id,

        lost_user.first_name AS lost_first_name,
        lost_user.last_name AS lost_last_name,

        found_user.first_name AS found_first_name,
        found_user.last_name AS found_last_name,

        lost_location.location_name AS lost_location,
        found_location.location_name AS found_location,

        lost_category.category_name AS lost_category,
        found_category.category_name AS found_category,

        (
          SELECT image_path
          FROM item_images
          WHERE item_id = lost.item_id
          ORDER BY uploaded_at DESC
          LIMIT 1
        ) AS lost_image_path,

        (
          SELECT image_path
          FROM item_images
          WHERE item_id = found.item_id
          ORDER BY uploaded_at DESC
          LIMIT 1
        ) AS found_image_path

      FROM item_matches

      INNER JOIN items AS lost
        ON item_matches.lost_item_id = lost.item_id

      INNER JOIN items AS found
        ON item_matches.found_item_id = found.item_id

      LEFT JOIN users AS lost_user
        ON lost.user_id = lost_user.user_id

      LEFT JOIN users AS found_user
        ON found.user_id = found_user.user_id

      LEFT JOIN locations AS lost_location
        ON lost.location_id = lost_location.location_id

      LEFT JOIN locations AS found_location
        ON found.location_id = found_location.location_id

      LEFT JOIN categories AS lost_category
        ON lost.category_id = lost_category.category_id

      LEFT JOIN categories AS found_category
        ON found.category_id = found_category.category_id

      WHERE ${
        isPrivileged
          ? "1 = 1"
          : "(lost.user_id = ? OR found.user_id = ?)"
      }

      ORDER BY item_matches.created_at DESC`,
      isPrivileged
        ? []
        : [user.user_id, user.user_id]
    );

    return res.status(200).json(matches);
  } catch (error) {
    console.error("Get matches error:", error);

    return res.status(500).json({
      message: "Failed to retrieve matches.",
    });
  }
};

// =====================================================
// UPDATE MATCH STATUS
// CONFIRM OR DISMISS A MATCH
// =====================================================

export const updateMatchStatus = async (
  req: AuthRequest,
  res: Response
) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;
    const { match_status } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    if (!["confirmed", "dismissed"].includes(match_status)) {
      return res.status(400).json({
        message: "Invalid match status.",
      });
    }

    const isPrivileged = ["admin", "staff"].includes(user.role);

    await connection.beginTransaction();

    // Get the match and its two item owners
    const [matches] = await connection.query<RowDataPacket[]>(
      `SELECT
        item_matches.match_id,
        item_matches.match_status,
        lost.item_id AS lost_item_id,
        lost.item_name AS lost_item_name,
        lost.user_id AS lost_user_id,
        found.item_id AS found_item_id,
        found.item_name AS found_item_name,
        found.user_id AS found_user_id

      FROM item_matches

      INNER JOIN items AS lost
        ON item_matches.lost_item_id = lost.item_id

      INNER JOIN items AS found
        ON item_matches.found_item_id = found.item_id

      WHERE item_matches.match_id = ?
      FOR UPDATE`,
      [id]
    );

    if (matches.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Match not found.",
      });
    }

    const match = matches[0];

    // Check whether the user owns either item
    const ownsItem =
      Number(match.lost_user_id) === user.user_id ||
      Number(match.found_user_id) === user.user_id;

    if (!isPrivileged && !ownsItem) {
      await connection.rollback();

      return res.status(403).json({
        message: "You do not have permission to update this match.",
      });
    }

    // Only suggested matches can be reviewed
    if (match.match_status !== "suggested") {
      await connection.rollback();

      return res.status(400).json({
        message: "This match has already been reviewed.",
      });
    }

    // Update the match status
    await connection.query<ResultSetHeader>(
      `UPDATE item_matches
       SET match_status = ?
       WHERE match_id = ?`,
      [match_status, id]
    );

    // If the match is confirmed, update both item statuses
    if (match_status === "confirmed") {
      await connection.query<ResultSetHeader>(
        `UPDATE items
         SET status = 'matched'
         WHERE item_id IN (?, ?)`,
        [match.lost_item_id, match.found_item_id]
      );

      // Prepare notification for both item owners
      const title = "Item Match Confirmed!";

      const message =
        `A possible match between "${match.lost_item_name}" ` +
        `and "${match.found_item_name}" has been confirmed. ` +
        `Please contact the campus staff for the next steps ` +
        `in claiming or returning the item.`;

      // Avoid duplicate notifications if both items belong to one user
      const userIds = [
        ...new Set([
          Number(match.lost_user_id),
          Number(match.found_user_id),
        ]),
      ];

      // Send notifications
      for (const userId of userIds) {
        await connection.query<ResultSetHeader>(
          `INSERT INTO notifications (
            user_id,
            title,
            message,
            is_read
          ) VALUES (?, ?, ?, 0)`,
          [userId, title, message]
        );
      }
    }

    await connection.commit();

    return res.status(200).json({
      message:
        match_status === "confirmed"
          ? "Match confirmed successfully. Both item statuses have been updated and notifications have been sent."
          : "Match dismissed successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Update match status error:", error);

    return res.status(500).json({
      message: "Failed to update match status.",
    });
  } finally {
    connection.release();
  }
};