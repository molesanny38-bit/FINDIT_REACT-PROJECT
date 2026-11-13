
import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../config/db";
import fs from "fs";
import path from "path";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

// =====================================================
// HELPER: REMOVE UPLOADED IMAGE
// =====================================================

const removeImageFile = (imagePath: string) => {
  const filename = path.basename(imagePath);
  const fullPath = path.join(process.cwd(), "uploads", filename);

  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// =====================================================
// AUTOMATIC ITEM MATCHING ALGORITHM
// =====================================================

// Convert text into lowercase words for comparison
const normalizeText = (value: string | null): string[] => {
  if (!value) return [];

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 0);
};

// Calculate text similarity using Jaccard similarity
const calculateTextSimilarity = (
  value1: string | null,
  value2: string | null
): number => {
  if (!value1 || !value2) return 0;

  const words1 = new Set(normalizeText(value1));
  const words2 = new Set(normalizeText(value2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = [...words1].filter((word) =>
    words2.has(word)
  ).length;

  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
};

// Compare two item reports and calculate their matching percentage
const calculateMatchingPercentage = (
  lostItem: RowDataPacket,
  foundItem: RowDataPacket
): number => {
  const nameScore = calculateTextSimilarity(
    lostItem.item_name,
    foundItem.item_name
  );

  const categoryScore =
    lostItem.category_id === foundItem.category_id ? 1 : 0;

  const colorScore =
    lostItem.color &&
    foundItem.color &&
    lostItem.color.toLowerCase().trim() ===
      foundItem.color.toLowerCase().trim()
      ? 1
      : 0;

  const brandScore =
    lostItem.brand &&
    foundItem.brand &&
    lostItem.brand.toLowerCase().trim() ===
      foundItem.brand.toLowerCase().trim()
      ? 1
      : 0;

  const locationScore =
    lostItem.location_id === foundItem.location_id ? 1 : 0;

  const descriptionScore = calculateTextSimilarity(
    lostItem.description,
    foundItem.description
  );

  const identifyingScore = calculateTextSimilarity(
    lostItem.identifying_details,
    foundItem.identifying_details
  );

  const percentage =
    nameScore * 25 +
    categoryScore * 20 +
    colorScore * 15 +
    brandScore * 10 +
    locationScore * 10 +
    descriptionScore * 10 +
    identifyingScore * 10;

  return Number(percentage.toFixed(2));
};

// =====================================================
// GENERATE MATCHES AND SEND NOTIFICATIONS
// =====================================================

const generateMatches = async (itemId: number) => {
  // Get the newly reported item
  const [newItems] = await db.query<RowDataPacket[]>(
    `SELECT * FROM items WHERE item_id = ?`,
    [itemId]
  );

  if (newItems.length === 0) return;

  const newItem = newItems[0];

  // Determine the opposite item type
  const oppositeType =
    newItem.item_type === "lost" ? "found" : "lost";

  // Find existing reports of the opposite type
  const [candidates] = await db.query<RowDataPacket[]>(
    `SELECT * FROM items
     WHERE item_type = ?
     AND status IN ('pending', 'active', 'matched')
     AND item_id != ?`,
    [oppositeType, itemId]
  );

  for (const candidate of candidates) {
    const lostItem =
      newItem.item_type === "lost" ? newItem : candidate;

    const foundItem =
      newItem.item_type === "found" ? newItem : candidate;

    // Calculate matching percentage
    const percentage = calculateMatchingPercentage(
      lostItem,
      foundItem
    );

    // Save matches with at least 60% similarity
    if (percentage >= 60) {
      // Check whether this match already exists
      const [existingMatches] = await db.query<RowDataPacket[]>(
        `SELECT match_id
         FROM item_matches
         WHERE lost_item_id = ?
         AND found_item_id = ?`,
        [lostItem.item_id, foundItem.item_id]
      );

      // Avoid duplicate match records
      if (existingMatches.length === 0) {
        const [matchResult] = await db.query<ResultSetHeader>(
          `INSERT INTO item_matches (
            lost_item_id,
            found_item_id,
            matching_percentage,
            match_status
          ) VALUES (?, ?, ?, 'suggested')`,
          [
            lostItem.item_id,
            foundItem.item_id,
            percentage,
          ]
        );

        // Prepare notification details
        const title = "Possible Item Match Found!";

        const message =
          `Your ${lostItem.item_name} may match a found item: ` +
          `${foundItem.item_name}. Matching percentage: ${percentage}%. ` +
          `Please check the Possible Matches page.`;

        // Get both item owners
        // Set removes duplicate user IDs if both reports
        // belong to the same user.
        const userIds = [
          ...new Set([
            Number(lostItem.user_id),
            Number(foundItem.user_id),
          ]),
        ];

        // Send notification to each item owner
        for (const userId of userIds) {
          try {
            await db.query<ResultSetHeader>(
              `INSERT INTO notifications (
                user_id,
                title,
                message,
                is_read
              ) VALUES (?, ?, ?, 0)`,
              [userId, title, message]
            );

            console.log(
              `Notification sent to user ${userId} for match #${matchResult.insertId}`
            );
          } catch (notificationError) {
            console.error(
              `Notification error for user ${userId}:`,
              notificationError
            );
          }
        }

        console.log(
          `Possible match #${matchResult.insertId} created: ${percentage}%`
        );
      }
    }
  }
};

// =====================================================
// GET ALL ITEMS
// =====================================================

export const getItems = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const [items] = await db.query<RowDataPacket[]>(`
      SELECT
        items.item_id,
        items.category_id,
        items.location_id,
        items.item_name,
        items.description,
        items.identifying_details,
        items.color,
        items.brand,
        items.item_type,
        items.date_lost_found,
        items.status,
        categories.category_name,
        locations.location_name,
        users.first_name,
        users.last_name,
        (
          SELECT image_path
          FROM item_images
          WHERE item_images.item_id = items.item_id
          ORDER BY uploaded_at DESC
          LIMIT 1
        ) AS image_path
      FROM items
      LEFT JOIN categories
        ON items.category_id = categories.category_id
      LEFT JOIN locations
        ON items.location_id = locations.location_id
      LEFT JOIN users
        ON items.user_id = users.user_id
      ORDER BY items.created_at DESC
    `);

    return res.status(200).json(items);
  } catch (error) {
    console.error("Get items error:", error);

    return res.status(500).json({
      message: "Failed to retrieve items.",
    });
  }
};

// =====================================================
// ADD NEW ITEM
// =====================================================

export const addItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const {
      category_id,
      location_id,
      item_name,
      description,
      identifying_details,
      color,
      brand,
      item_type,
      date_lost_found,
    } = req.body;

    if (
      !category_id ||
      !location_id ||
      !item_name ||
      !item_type ||
      !date_lost_found
    ) {
      return res.status(400).json({
        message: "Please complete all required fields.",
      });
    }

    if (!["lost", "found"].includes(item_type)) {
      return res.status(400).json({
        message: "Item type must be lost or found.",
      });
    }

    const user_id = req.user?.user_id;

    if (!user_id) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    // Insert the new item
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO items (
        user_id,
        category_id,
        location_id,
        item_name,
        description,
        identifying_details,
        color,
        brand,
        item_type,
        date_lost_found,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        user_id,
        category_id,
        location_id,
        item_name.trim(),
        description || null,
        identifying_details || null,
        color || null,
        brand || null,
        item_type,
        date_lost_found,
      ]
    );

    const newItemId = result.insertId;

    // Save uploaded image
    if (req.file) {
      await db.query<ResultSetHeader>(
        `INSERT INTO item_images (
          item_id,
          image_path
        ) VALUES (?, ?)`,
        [newItemId, req.file.filename]
      );
    }

    // Automatically generate possible matches
    // Matching errors will not undo the successful item report.
    try {
      await generateMatches(newItemId);
    } catch (matchingError) {
      console.error(
        "Automatic matching error:",
        matchingError
      );
    }

    return res.status(201).json({
      message: "Item reported successfully.",
      item_id: newItemId,
    });
  } catch (error) {
    if (req.file) {
      removeImageFile(req.file.filename);
    }

    console.error("Add item error:", error);

    return res.status(500).json({
      message: "Failed to add item.",
    });
  }
};

// =====================================================
// GET ALL CATEGORIES
// =====================================================

export const getCategories = async (
  req: Request,
  res: Response
) => {
  try {
    const [categories] = await db.query<RowDataPacket[]>(
      `SELECT category_id, category_name
       FROM categories
       ORDER BY category_name ASC`
    );

    return res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);

    return res.status(500).json({
      message: "Failed to retrieve categories.",
    });
  }
};

// =====================================================
// GET ALL LOCATIONS
// =====================================================

export const getLocations = async (
  req: Request,
  res: Response
) => {
  try {
    const [locations] = await db.query<RowDataPacket[]>(
      `SELECT location_id, location_name
       FROM locations
       ORDER BY location_name ASC`
    );

    return res.status(200).json(locations);
  } catch (error) {
    console.error("Get locations error:", error);

    return res.status(500).json({
      message: "Failed to retrieve locations.",
    });
  }
};

// =====================================================
// UPDATE ITEM
// =====================================================

export const updateItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    const {
      category_id,
      location_id,
      item_name,
      description,
      identifying_details,
      color,
      brand,
      item_type,
      date_lost_found,
    } = req.body;

    if (
      !category_id ||
      !location_id ||
      !item_name ||
      !item_type ||
      !date_lost_found
    ) {
      return res.status(400).json({
        message: "Please complete all required fields.",
      });
    }

    if (!["lost", "found"].includes(item_type)) {
      return res.status(400).json({
        message: "Item type must be lost or found.",
      });
    }

    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const isPrivileged = ["admin", "staff"].includes(
      user.role
    );

    const [result] = await db.query<ResultSetHeader>(
      `UPDATE items SET
        category_id = ?,
        location_id = ?,
        item_name = ?,
        description = ?,
        identifying_details = ?,
        color = ?,
        brand = ?,
        item_type = ?,
        date_lost_found = ?
      WHERE item_id = ?
      ${isPrivileged ? "" : "AND user_id = ?"}`,
      [
        category_id,
        location_id,
        item_name.trim(),
        description || null,
        identifying_details || null,
        color || null,
        brand || null,
        item_type,
        date_lost_found,
        id,
        ...(isPrivileged ? [] : [user.user_id]),
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          "Item not found or you do not have permission to edit it.",
      });
    }

    // Replace existing image if a new image was uploaded
    if (req.file) {
      const [oldImages] = await db.query<RowDataPacket[]>(
        `SELECT image_path
         FROM item_images
         WHERE item_id = ?`,
        [id]
      );

      await db.query(
        "DELETE FROM item_images WHERE item_id = ?",
        [id]
      );

      await db.query(
        `INSERT INTO item_images (
          item_id,
          image_path
        ) VALUES (?, ?)`,
        [id, req.file.filename]
      );

      oldImages.forEach((image) => {
        removeImageFile(image.image_path);
      });
    }

    // Regenerate possible matches after updating item details
    try {
      await generateMatches(Number(id));
    } catch (matchingError) {
      console.error(
        "Updated item matching error:",
        matchingError
      );
    }

    return res.status(200).json({
      message: "Item updated successfully.",
    });
  } catch (error) {
    if (req.file) {
      removeImageFile(req.file.filename);
    }

    console.error("Update item error:", error);

    return res.status(500).json({
      message: "Failed to update item.",
    });
  }
};

// =====================================================
// DELETE ITEM
// =====================================================

export const deleteItem = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized.",
      });
    }

    const isPrivileged = ["admin", "staff"].includes(
      user.role
    );

    // Retrieve image paths before deleting the item
    const [images] = await db.query<RowDataPacket[]>(
      `SELECT image_path
       FROM item_images
       WHERE item_id = ?`,
      [id]
    );

    const [result] = await db.query<ResultSetHeader>(
      `DELETE FROM items
       WHERE item_id = ?
       ${isPrivileged ? "" : "AND user_id = ?"}`,
      [
        id,
        ...(isPrivileged ? [] : [user.user_id]),
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          "Item not found or you do not have permission to delete it.",
      });
    }

    // MySQL automatically deletes image records
    // because of ON DELETE CASCADE.
    // Remove the actual image files.
    images.forEach((image) => {
      removeImageFile(image.image_path);
    });

    return res.status(200).json({
      message: "Item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete item error:", error);

    return res.status(500).json({
      message: "Failed to delete item.",
    });
  }
};
