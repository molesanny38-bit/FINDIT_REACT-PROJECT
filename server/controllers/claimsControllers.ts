import type { Request, Response } from "express";
import db from "../config/db";
import { logActivity } from "../utils/activitylogger";


// 1. GET ALL CLAIMS
export const getClaims = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    let query = `
      SELECT
        c.claim_id,
        c.item_id,
        c.claimant_id,
        c.claim_description,
        c.claim_status,
        c.reviewed_by,
        c.reviewed_at,
        c.created_at,
        c.updated_at,

        i.item_name,
        i.item_type,
        i.status AS item_status,

        claimant.first_name AS claimant_first_name,
        claimant.last_name AS claimant_last_name,
        claimant.email AS claimant_email,

        reviewer.first_name AS reviewer_first_name,
        reviewer.last_name AS reviewer_last_name

      FROM claims c
      INNER JOIN items i ON c.item_id = i.item_id
      INNER JOIN users claimant ON c.claimant_id = claimant.user_id
      LEFT JOIN users reviewer ON c.reviewed_by = reviewer.user_id
    `;

    const params: any[] = [];

    // Students can only see their own claims.
    if (user.role === "student") {
      query += ` WHERE c.claimant_id = ?`;
      params.push(user.user_id);
}
    query += ` ORDER BY c.created_at DESC`;

    const [claims]: any = await db.query(query, params);

    return res.status(200).json(claims);
  } catch (error) {
    console.error("Get claims error:", error);

    return res.status(500).json({
      message: "Failed to retrieve claims.",
    });
  }
};



// 2. SUBMIT A CLAIM

export const submitClaim = async (req: Request, res: Response) => {
  try {
    const { item_id, claim_description } = req.body;
    const user = (req as any).user;
    const claimant_id = user?.user_id;

    if (!claimant_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    // Only students can submit claims.
    if (user.role !== "student") {
      return res.status(403).json({
        message: "Only students can submit claims.",
      });
    }

    // Validate the submitted information.
    if (
      !item_id ||
      !Number.isInteger(Number(item_id)) ||
      Number(item_id) <= 0 ||
      typeof claim_description !== "string" ||
      claim_description.trim().length < 10
    ) {
      return res.status(400).json({
        message:
          "A valid item ID and claim description of at least 10 characters are required.",
      });
    }

    if (claim_description.trim().length > 2000) {
      return res.status(400).json({
        message: "Claim description must not exceed 2000 characters.",
      });
    }

    // Check if the item exists and is a found item.
    const [items]: any = await db.query(
      `
      SELECT
        item_id,
        user_id,
        item_name,
        item_type,
        status
      FROM items
      WHERE item_id = ?
      `,
      [Number(item_id)]
    );

    if (items.length === 0 || items[0].item_type !== "found") {
      return res.status(404).json({
        message: "Found item not found.",
      });
    }

    const foundItem = items[0];

    // Students cannot claim items they personally reported as found.
    if (Number(foundItem.user_id) === Number(claimant_id)) {
      return res.status(403).json({
        message: "You cannot claim an item that you reported finding.",
      });
    }

    // Prevent claiming an item that has already been claimed or returned.
    if (["claimed", "returned"].includes(foundItem.status)) {
      return res.status(409).json({
        message: "This item has already been claimed or returned.",
      });
    }

    // Prevent duplicate pending or approved claims by the same student.
    const [existingClaims]: any = await db.query(
      `
      SELECT claim_id
      FROM claims
      WHERE item_id = ?
        AND claimant_id = ?
        AND claim_status IN ('pending', 'approved')
      `,
      [Number(item_id), Number(claimant_id)]
    );

    if (existingClaims.length > 0) {
      return res.status(409).json({
        message:
          "You already have a pending or approved claim for this item.",
      });
    }

    // Save the claim.
    const [claimResult]: any = await db.query(
      `
      INSERT INTO claims (
        item_id,
        claimant_id,
        claim_description,
        claim_status
      )
      VALUES (?, ?, ?, 'pending')
      `,
      [
        Number(item_id),
        Number(claimant_id),
        claim_description.trim(),
      ]
    );

    // Notify the staff/admin that a claim was submitted.
    const [staffUsers]: any = await db.query(
      `
      SELECT user_id
      FROM users
      WHERE role IN ('admin', 'staff')
        AND status = 'active'
      `
    );

    for (const staff of staffUsers) {
      await db.query(
        `
        INSERT INTO notifications (
          user_id,
          title,
          message,
          is_read,
          created_at
        )
        VALUES (?, ?, ?, 0, NOW())
        `,
        [
          staff.user_id,
          "New Claim Submitted",
          `A student submitted a claim for "${foundItem.item_name}". Please review the claim.`,
        ]
      );
    }

    // Record the activity.
    await logActivity({
      user_id: claimant_id,
      action: "Submitted Claim",
      details: `Submitted a claim for "${foundItem.item_name}" (Claim ID: ${claimResult.insertId}, Item ID: ${item_id})`,
    });

    return res.status(201).json({
      message: "Claim submitted successfully!",
      claim_id: claimResult.insertId,
    });
  } catch (error) {
    console.error("Submit claim error:", error);

    return res.status(500).json({
      message: "Failed to submit claim.",
    });
  }
};



// 3. REVIEW A CLAIM

export const reviewClaim = async (req: Request, res: Response) => {
  const connection = await db.getConnection();

  try {
    const user = (req as any).user;
    const reviewer_id = user?.user_id;
    const claim_id = Number(req.params.id);
    const { claim_status } = req.body;

    if (!reviewer_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    // Only staff and admins can review claims.
    if (!["admin", "staff"].includes(user.role)) {
      return res.status(403).json({
        message: "Only staff and administrators can review claims.",
      });
    }

    if (
      !Number.isInteger(claim_id) ||
      claim_id <= 0 ||
      !["approved", "rejected"].includes(claim_status)
    ) {
      return res.status(400).json({
        message: "Invalid claim ID or review status.",
      });
    }
 await connection.beginTransaction();

    // Lock the claim while reviewing it.
    const [claims]: any = await connection.query(
      `
      SELECT
        c.claim_id,
        c.item_id,
        c.claimant_id,
        c.claim_status,
        i.item_name,
        i.status AS item_status
      FROM claims c
      INNER JOIN items i ON c.item_id = i.item_id
      WHERE c.claim_id = ?
      FOR UPDATE
      `,
      [claim_id]
    );

    if (claims.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Claim not found.",
      });
    }

    const claim = claims[0];

    if (claim.claim_status !== "pending") {
      await connection.rollback();

      return res.status(409).json({
        message: "This claim has already been reviewed.",
      });
    }

    if (claim.claim_status === "pending" && claim_status === "approved") {
      if (["claimed", "returned"].includes(claim.item_status)) {
        await connection.rollback();

        return res.status(409).json({
          message: "This item has already been claimed or returned.",
        });
      }
    }

    // Update the claim.
    await connection.query(
      `
      UPDATE claims
      SET
        claim_status = ?,
        reviewed_by = ?,
        reviewed_at = NOW()
      WHERE claim_id = ?
      `,
      [claim_status, reviewer_id, claim_id]
    );

    // Update item status when the claim is approved.
    if (claim_status === "approved") {
      await connection.query(
        `
        UPDATE items
        SET status = 'claimed'
        WHERE item_id = ?
        `,
        [claim.item_id]
      );
    }

    // Notify the student about the review result.
    const notificationTitle =
      claim_status === "approved"
        ? "Claim Approved"
        : "Claim Rejected";

    const notificationMessage =
      claim_status === "approved"
        ? `Your claim for "${claim.item_name}" has been approved. Please coordinate with the staff for item verification and return.`
        : `Your claim for "${claim.item_name}" has been rejected. Please contact the staff for more information.`;

    await connection.query(
      `
      INSERT INTO notifications (
        user_id,
        title,
        message,
        is_read,
        created_at
      )
      VALUES (?, ?, ?, 0, NOW())
      `,
      [
        claim.claimant_id,
        notificationTitle,
        notificationMessage,
      ]
    );

    await connection.commit();

    await logActivity({
      user_id: reviewer_id,
      action:
        claim_status === "approved"
          ? "Approved Claim"
          : "Rejected Claim",
      details: `${claim_status} claim ID ${claim_id} for "${claim.item_name}".`,
    });

    return res.status(200).json({
      message: `Claim ${claim_status} successfully.`,
    });
  } catch (error) {
    await connection.rollback();

    console.error("Review claim error:", error);

    return res.status(500).json({
      message: "Failed to review claim.",
    });
  } finally {
    connection.release();
  }
};



// 4. MARK AN ITEM AS RETURNED

export const markClaimAsReturned = async (
  req: Request,
  res: Response
) => {
  const connection = await db.getConnection();

  try {
    const user = (req as any).user;
    const returned_by = user?.user_id;
    const claim_id = Number(req.params.id);

    const { receiver_name, return_notes } = req.body;

    if (!returned_by) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    // Only staff and admins can record returned items.
    if (!["admin", "staff"].includes(user.role)) {
      return res.status(403).json({
        message:
          "Only staff and administrators can record returned items.",
      });
    }

    if (
      !Number.isInteger(claim_id) ||
      claim_id <= 0 ||
      typeof receiver_name !== "string" ||
      !receiver_name.trim()
    ) {
      return res.status(400).json({
        message: "A valid claim ID and receiver name are required.",
      });
    }

    await connection.beginTransaction();

    // Get the claim and lock its record.
    const [claims]: any = await connection.query(
      `
      SELECT
        c.claim_id,
        c.item_id,
        c.claimant_id,
        c.claim_status,
        i.item_name,
        i.status AS item_status
      FROM claims c
      INNER JOIN items i ON c.item_id = i.item_id
      WHERE c.claim_id = ?
      FOR UPDATE
      `,
      [claim_id]
    );

    if (claims.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Claim not found.",
      });
}    const claim = claims[0];
    if (claim.claim_status !== "approved") {
      await connection.rollback();

      return res.status(400).json({
        message: "Only approved claims can be marked as returned.",
      });
}
    if (claim.item_status === "returned") {
      await connection.rollback();

      return res.status(409).json({
        message: "This item has already been returned.",
      });
    }

    // Check whether a return record already exists.
    const [existingReturns]: any = await connection.query(
      `
      SELECT return_id
      FROM item_returns
      WHERE claim_id = ?
      `,
      [claim_id]
    );

    if (existingReturns.length > 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "A return record already exists for this claim.",
      });
    }

    // Create the return record.
    await connection.query(
      `
      INSERT INTO item_returns (
        claim_id,
        item_id,
        claimant_id,
        returned_by,
        receiver_name,
        return_notes,
        returned_at
      )
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      `,
      [
        claim.claim_id,
        claim.item_id,
        claim.claimant_id,
        returned_by,
        receiver_name.trim(),
        return_notes?.trim() || null,
      ]
    );

    // Update the item status.
    await connection.query(
      `
      UPDATE items
      SET status = 'returned'
      WHERE item_id = ?
      `,
      [claim.item_id]
    );

    // Notify the student.
    await connection.query(
      `
      INSERT INTO notifications (
        user_id,
        title,
        message,
        is_read,
        created_at
      )
      VALUES (?, ?, ?, 0, NOW())
      `,
      [
        claim.claimant_id,
        "Item Returned",
        `Your claimed item "${claim.item_name}" has been recorded as returned.`,
      ]
    );

    await connection.commit();

    await logActivity({
      user_id: returned_by,
      action: "Returned Item",
      details: `Recorded the return of "${claim.item_name}" for claim ID ${claim_id}. Received by: ${receiver_name.trim()}.`,
    });

    return res.status(200).json({
      message: "Item return recorded successfully!",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Mark item as returned error:", error);

    return res.status(500).json({
      message: "Failed to record item return.",
    });
  } finally {
    connection.release();
  }
};



// 5. GET RETURN HISTORY

export const getReturnHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user?.user_id) {
      return res.status(401).json({
        message: "User authentication information is missing.",
      });
    }

    let query = `
      SELECT
        r.return_id,
        r.claim_id,
        r.item_id,
        r.claimant_id,
        r.returned_by,
        r.receiver_name,
        r.return_notes,
        r.returned_at,

        i.item_name,

        claimant.first_name AS claimant_first_name,
        claimant.last_name AS claimant_last_name,

        staff.first_name AS staff_first_name,
        staff.last_name AS staff_last_name

      FROM item_returns r
      INNER JOIN items i ON r.item_id = i.item_id
      INNER JOIN users claimant ON r.claimant_id = claimant.user_id
      INNER JOIN users staff ON r.returned_by = staff.user_id
    `;

    const params: any[] = [];

    // Students can only view their own return history.
    if (user.role === "student") {
      query += ` WHERE r.claimant_id = ?`;
      params.push(user.user_id);
}
    query += ` ORDER BY r.returned_at DESC`;

    const [returns]: any = await db.query(query, params);

    return res.status(200).json(returns);
  } catch (error) {
    console.error("Get return history error:", error);

    return res.status(500).json({
      message: "Failed to retrieve return history.",
    });
  }
};