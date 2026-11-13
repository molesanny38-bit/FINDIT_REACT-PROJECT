import { Request, Response } from "express";
import db from "../config/db";

// ==========================================
// GET CLAIMS
// ==========================================
export const getClaims = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id || !user.role) {
      return res.status(401).json({
        message: "Invalid user authentication.",
      });
    }

    let query = `
      SELECT
        claims.claim_id,
        claims.item_id,
        claims.claimant_id,
        claims.claim_description,
        claims.claim_status,
        claims.reviewed_by,
        claims.reviewed_at,
        claims.created_at,
        items.item_name,
        items.item_type,
        users.first_name,
        users.last_name
      FROM claims
      INNER JOIN items
        ON claims.item_id = items.item_id
      INNER JOIN users
        ON claims.claimant_id = users.user_id
    `;

    const params: number[] = [];

    if (user.role === "student") {
      query += " WHERE claims.claimant_id = ?";
      params.push(user.user_id);
    } else if (user.role !== "staff" && user.role !== "admin") {
      return res.status(403).json({
        message: "You are not authorized to view claims.",
      });
    }

    query += " ORDER BY claims.created_at DESC";

    const [claims] = await db.query(query, params);

    return res.status(200).json(claims);
  } catch (error) {
    console.error("Get claims error:", error);

    return res.status(500).json({
      message: "Failed to retrieve claims.",
    });
  }
};

// ==========================================
// SUBMIT A CLAIM
// ==========================================
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

    if (user.role !== "student") {
      return res.status(403).json({
        message: "Only students can submit claims.",
      });
    }

    if (
      !item_id ||
      !Number.isInteger(Number(item_id)) ||
      typeof claim_description !== "string" ||
      !claim_description.trim()
    ) {
      return res.status(400).json({
        message: "Item ID and claim description are required.",
      });
    }

    const [items]: any = await db.query(
      `SELECT item_id, item_type, status
       FROM items
       WHERE item_id = ?`,
      [item_id]
    );

    if (items.length === 0 || items[0].item_type !== "found") {
      return res.status(404).json({
        message: "Found item not found.",
      });
    }

    if (["claimed", "returned"].includes(items[0].status)) {
      return res.status(409).json({
        message: "This item has already been claimed or returned.",
      });
    }

    const [existingClaims]: any = await db.query(
      `SELECT claim_id
       FROM claims
       WHERE item_id = ?
       AND claimant_id = ?
       AND claim_status = 'pending'`,
      [item_id, claimant_id]
    );

    if (existingClaims.length > 0) {
      return res.status(409).json({
        message: "You already have a pending claim for this item.",
      });
    }

    await db.query(
      `INSERT INTO claims
       (item_id, claimant_id, claim_description, claim_status)
       VALUES (?, ?, ?, 'pending')`,
      [item_id, claimant_id, claim_description.trim()]
    );

    return res.status(201).json({
      message: "Claim submitted successfully!",
    });
  } catch (error) {
    console.error("Submit claim error:", error);

    return res.status(500).json({
      message: "Failed to submit claim.",
    });
  }
};

// ==========================================
// REVIEW A CLAIM
// ==========================================
export const reviewClaim = async (req: Request, res: Response) => {
  let connection: any;

  try {
    const { id } = req.params;
    const { claim_status } = req.body;

    const user = (req as any).user;

    if (!user || !["staff", "admin"].includes(user.role)) {
      return res.status(403).json({
        message: "You are not authorized to review claims.",
      });
    }

    if (!["approved", "rejected"].includes(claim_status)) {
      return res.status(400).json({
        message: "Invalid claim status.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [claims]: any = await connection.query(
      `SELECT
        claims.claim_id,
        claims.claimant_id,
        claims.claim_status,
        items.item_name
       FROM claims
       INNER JOIN items
         ON claims.item_id = items.item_id
       WHERE claims.claim_id = ?
       FOR UPDATE`,
      [id]
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

      return res.status(400).json({
        message: "This claim has already been reviewed or cancelled.",
      });
    }

    await connection.query(
      `UPDATE claims
       SET claim_status = ?,
           reviewed_by = ?,
           reviewed_at = NOW()
       WHERE claim_id = ?`,
      [claim_status, user.user_id, id]
    );

    const title =
      claim_status === "approved"
        ? "Claim Approved"
        : "Claim Rejected";

    const message =
      claim_status === "approved"
        ? `Your claim for "${claim.item_name}" has been approved. Please contact the school staff for the item release process.`
        : `Your claim for "${claim.item_name}" has been rejected. Please contact the school staff for more information.`;

    await connection.query(
      `INSERT INTO notifications
       (user_id, title, message, is_read)
       VALUES (?, ?, ?, 0)`,
      [claim.claimant_id, title, message]
    );

    await connection.commit();

    return res.status(200).json({
      message: `Claim ${claim_status} successfully! A notification has been sent to the student.`,
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Review claim error:", error);

    return res.status(500).json({
      message: "Failed to review claim.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ==========================================
// MARK CLAIM AS RETURNED
// ==========================================
export const markClaimAsReturned = async (
  req: Request,
  res: Response
) => {
  let connection: any;

  try {
    const { id } = req.params;
    const { receiver_name, return_notes } = req.body;

    const user = (req as any).user;

    // Only staff and admin can process returns
    if (!user || !["staff", "admin"].includes(user.role)) {
      return res.status(403).json({
        message: "Only staff and admin can process item returns.",
      });
    }

    // Validate receiver name
    if (
      typeof receiver_name !== "string" ||
      !receiver_name.trim()
    ) {
      return res.status(400).json({
        message: "Receiver name is required.",
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Find and lock the claim
    const [claims]: any = await connection.query(
      `SELECT
        claims.claim_id,
        claims.item_id,
        claims.claimant_id,
        claims.claim_status,
        items.item_name,
        items.status AS item_status
       FROM claims
       INNER JOIN items
         ON claims.item_id = items.item_id
       WHERE claims.claim_id = ?
       FOR UPDATE`,
      [id]
    );

    if (claims.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Claim not found.",
      });
    }

    const claim = claims[0];

    // Only approved claims can be returned
    if (claim.claim_status !== "approved") {
      await connection.rollback();

      return res.status(400).json({
        message: "Only approved claims can be marked as returned.",
      });
    }

    // Prevent duplicate returns
    if (claim.item_status === "returned") {
      await connection.rollback();

      return res.status(409).json({
        message: "This item has already been returned.",
      });
    }

    // Save return record
    await connection.query(
      `INSERT INTO item_returns
       (
         claim_id,
         item_id,
         claimant_id,
         returned_by,
         receiver_name,
         return_notes
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        claim.claim_id,
        claim.item_id,
        claim.claimant_id,
        user.user_id,
        receiver_name.trim(),
        typeof return_notes === "string" ? return_notes.trim() || null : null,
      ]
    );

    // Update item status
    await connection.query(
      `UPDATE items
       SET status = 'returned'
       WHERE item_id = ?`,
      [claim.item_id]
    );

    // Notify the student
    await connection.query(
      `INSERT INTO notifications
       (user_id, title, message, is_read)
       VALUES (?, ?, ?, 0)`,
      [
        claim.claimant_id,
        "Item Returned Successfully",
        `Your claimed item "${claim.item_name}" has been officially returned to you.`,
      ]
    );

    await connection.commit();

    return res.status(200).json({
      message: "Item returned successfully! The student has been notified.",
    });
  } catch (error: any) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Mark claim as returned error:", error);

    // Handle duplicate claim return
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A return record already exists for this claim.",
      });
    }

    return res.status(500).json({
      message: "Failed to process item return.",
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// ==========================================
// GET RETURN HISTORY
// ==========================================
export const getReturnHistory = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    if (!user || !user.user_id || !user.role) {
      return res.status(401).json({
        message: "Invalid user authentication.",
      });
    }

    let query = `
      SELECT
        item_returns.return_id,
        item_returns.claim_id,
        item_returns.item_id,
        item_returns.claimant_id,
        item_returns.returned_by,
        item_returns.receiver_name,
        item_returns.return_notes,
        item_returns.returned_at,
        items.item_name,
        items.item_type,
        claimant.first_name AS claimant_first_name,
        claimant.last_name AS claimant_last_name,
        staff.first_name AS staff_first_name,
        staff.last_name AS staff_last_name
      FROM item_returns
      INNER JOIN items
        ON item_returns.item_id = items.item_id
      INNER JOIN users AS claimant
        ON item_returns.claimant_id = claimant.user_id
      INNER JOIN users AS staff
        ON item_returns.returned_by = staff.user_id
    `;

    const params: number[] = [];

    // Students can only view their own return records
    if (user.role === "student") {
      query += " WHERE item_returns.claimant_id = ?";
      params.push(user.user_id);
    } else if (user.role !== "staff" && user.role !== "admin") {
      return res.status(403).json({
        message: "You are not authorized to view return history.",
      });
    }

    query += " ORDER BY item_returns.returned_at DESC";

    const [returns] = await db.query(query, params);

    return res.status(200).json(returns);
  } catch (error) {
    console.error("Get return history error:", error);

    return res.status(500).json({
      message: "Failed to retrieve return history.",
    });
  }
};