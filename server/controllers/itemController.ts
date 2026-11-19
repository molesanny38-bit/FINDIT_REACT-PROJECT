import type { Request, Response } from "express";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../config/db";
import fs from "fs";
import path from "path";
import { logActivity } from "../utils/activitylogger";


// TYPES


interface AuthRequest extends Request {
    user?: {
        user_id: number;
        role: "admin" | "staff" | "student";
    };
}

interface ItemRow extends RowDataPacket {
    item_id: number;
    user_id: number;
    category_id: number;
    location_id: number;
    item_name: string;
    description: string;
    identifying_details: string | null;
    color: string | null;
    brand: string | null;
    item_type: "lost" | "found";
    date_lost_found: string;
    status: string;
}


// REMOVE IMAGE FILE

const removeImageFile = (filename: string) => {
    if (!filename) return;

    const imagePath = path.join(
        process.cwd(),
        "uploads",
        filename
    );

    if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
    }
};


// TEXT NORMALIZATION

const normalizeText = (text: string | null | undefined): string[] => {
    if (!text) return [];

    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(word => word.length > 2);
};


// TEXT SIMILARITY


const calculateTextSimilarity = (
    text1: string | null | undefined,
    text2: string | null | undefined
): number => {
    const words1 = normalizeText(text1);
    const words2 = normalizeText(text2);

    if (words1.length === 0 || words2.length === 0) {
        return 0;
    }

    const set1 = new Set(words1);
    const set2 = new Set(words2);

    const intersection = [...set1].filter(word =>
        set2.has(word)
    );

    const union = new Set([...set1, ...set2]);

    return intersection.length / union.size;
};


// CALCULATE MATCHING PERCENTAGE


const calculateMatchingPercentage = (
    lostItem: ItemRow,
    foundItem: ItemRow
): number => {
    let score = 0;

    // Item name - 25%
    const nameSimilarity = calculateTextSimilarity(
        lostItem.item_name,
        foundItem.item_name
    );

    score += nameSimilarity * 25;

    // Category - 20%
    if (lostItem.category_id === foundItem.category_id) {
        score += 20;
    }

    // Color - 15%
    if (
        lostItem.color &&
        foundItem.color &&
        lostItem.color.toLowerCase() === foundItem.color.toLowerCase()
    ) {
        score += 15;
    }

    // Brand - 10%
    if (
        lostItem.brand &&
        foundItem.brand &&
        lostItem.brand.toLowerCase() === foundItem.brand.toLowerCase()
    ) {
        score += 10;
    }

    // Location - 10%
    if (lostItem.location_id === foundItem.location_id) {
        score += 10;
    }

    // Description - 10%
    const descriptionSimilarity = calculateTextSimilarity(
        lostItem.description,
        foundItem.description
    );

    score += descriptionSimilarity * 10;

    // Identifying details - 10%
    const detailsSimilarity = calculateTextSimilarity(
        lostItem.identifying_details,
        foundItem.identifying_details
    );

    score += detailsSimilarity * 10;

    return Math.round(score * 100) / 100;
};


// GENERATE AUTOMATIC MATCHES


const generateMatches = async (itemId: number) => {
    const [items] = await db.query<ItemRow[]>(
        `SELECT *
         FROM items
         WHERE item_id = ?`,
        [itemId]
    );

    if (items.length === 0) return;

    const currentItem = items[0];

    const oppositeType =
        currentItem.item_type === "lost" ? "found" : "lost";

    const [possibleMatches] = await db.query<ItemRow[]>(
        `SELECT *
         FROM items
         WHERE item_type = ?
         AND status IN ('pending', 'active', 'matched')
         AND item_id != ?`,
        [oppositeType, itemId]
    );

    for (const candidate of possibleMatches) {
        const lostItem =
            currentItem.item_type === "lost"
                ? currentItem
                : candidate;

        const foundItem =
            currentItem.item_type === "found"
                ? currentItem
                : candidate;

        const percentage = calculateMatchingPercentage(
            lostItem,
            foundItem
        );

        // Only save matches with at least 60% similarity.
        if (percentage >= 60) {
            const [existingMatches] = await db.query<RowDataPacket[]>(
                `SELECT match_id
                 FROM item_matches
                 WHERE lost_item_id = ?
                 AND found_item_id = ?`,
                [
                    lostItem.item_id,
                    foundItem.item_id
                ]
            );

            if (existingMatches.length > 0) {
                await db.query(
                    `UPDATE item_matches
                     SET matching_percentage = ?
                     WHERE lost_item_id = ?
                     AND found_item_id = ?`,
                    [
                        percentage,
                        lostItem.item_id,
                        foundItem.item_id
                    ]
                );

                continue;
            }

            await db.query(
                `INSERT INTO item_matches
                 (
                    lost_item_id,
                    found_item_id,
                    matching_percentage,
                    match_status
                 )
                 VALUES (?, ?, ?, 'suggested')`,
                [
                    lostItem.item_id,
                    foundItem.item_id,
                    percentage
                ]
            );

            // Notify the user who reported the lost item.
            await db.query(
                `INSERT INTO notifications
                 (user_id, title, message)
                 VALUES (?, ?, ?)`,
                [
                    lostItem.user_id,
                    "Possible Item Match",
                    `A possible match was found for your reported item: ${lostItem.item_name}.`
                ]
            );

            // Notify the user who reported the found item.
            await db.query(
                `INSERT INTO notifications
                 (user_id, title, message)
                 VALUES (?, ?, ?)`,
                [
                    foundItem.user_id,
                    "Possible Item Match",
                    `A possible match was found for your reported item: ${foundItem.item_name}.`
                ]
            );
        }
    }};


// GET ALL ITEMS


export const getItems = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized."
            });
        }

        const [items] = await db.query<RowDataPacket[]>(
            `SELECT
                i.*,
                c.category_name,
                l.location_name,
                u.first_name,
                u.last_name,
                (
                    SELECT ii.image_path
                    FROM item_images ii
                    WHERE ii.item_id = i.item_id
                    ORDER BY ii.image_id DESC
                    LIMIT 1
                ) AS image_path
             FROM items i
             LEFT JOIN categories c
                ON i.category_id = c.category_id
             LEFT JOIN locations l
                ON i.location_id = l.location_id
             LEFT JOIN users u
                ON i.user_id = u.user_id
             ORDER BY i.created_at DESC`
        );

        return res.status(200).json(items);

    } catch (error) {
        console.error("Get items error:", error);

        return res.status(500).json({
            message: "Failed to retrieve items."
        });
    }
};


// ADD ITEM

export const addItem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized."
            });
        }

        const {
            category_id,
            location_id,
            item_name,
            description,
            identifying_details,
            color,
            brand,
            item_type,
            date_lost_found
        } = req.body;

        if (
            !category_id ||
            !location_id ||
            !item_name ||
            !description ||
            !item_type ||
            !date_lost_found
        ) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        if (!["lost", "found"].includes(item_type)) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(400).json({
                message: "Invalid item type."
            });
        }

        const [result] = await db.query<ResultSetHeader>(
            `INSERT INTO items
             (
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
             )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
            [
                user.user_id,
                category_id,
                location_id,
                item_name.trim(),
                description,
                identifying_details || null,
                color || null,
                brand || null,
                item_type,
                date_lost_found
            ]
        );

        const itemId = result.insertId;

        // Save uploaded image.
        if (req.file) {
            await db.query(
                `INSERT INTO item_images
                 (item_id, image_path)
                 VALUES (?, ?)`,
                [
                    itemId,
                    req.file.filename
                ]
            );
        }

        // Generate possible matches.
        try {
            await generateMatches(itemId);
        } catch (matchingError) {
            console.error(
                "Automatic matching error:",
                matchingError
            );
        }

        // Activity log.
        await logActivity({
            user_id: user.user_id,
            action: "Added Item",
            details: `Reported ${item_type} item: ${item_name.trim()} (Item ID: ${itemId})`
        });

        return res.status(201).json({
            message: "Item reported successfully.",
            item_id: itemId
        });

    } catch (error) {
        if (req.file) {
            removeImageFile(req.file.filename);
        }

        console.error("Add item error:", error);

        return res.status(500).json({
            message: "Failed to report item."
        });
    }
};


// GET CATEGORIES

export const getCategories = async (
    req: Request,
    res: Response
) => {
    try {
        const [categories] = await db.query<RowDataPacket[]>(
            `SELECT *
             FROM categories
             ORDER BY category_name ASC`
        );

        return res.status(200).json(categories);

    } catch (error) {
        console.error("Get categories error:", error);

        return res.status(500).json({
            message: "Failed to retrieve categories."
        });
    }
};


// GET LOCATIONS

export const getLocations = async (
    req: Request,
    res: Response
) => {
    try {
        const [locations] = await db.query<RowDataPacket[]>(
            `SELECT *
             FROM locations
             ORDER BY location_name ASC`
        );

        return res.status(200).json(locations);

    } catch (error) {
        console.error("Get locations error:", error);

        return res.status(500).json({
            message: "Failed to retrieve locations."
        });
    }
};


// UPDATE ITEM
// STUDENTS CAN ONLY EDIT THEIR OWN REPORTS.
// STAFF AND ADMIN CANNOT EDIT ITEM INFORMATION.


export const updateItem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const { id } = req.params;
        const user = req.user;

        if (!user) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(401).json({
                message: "Unauthorized."
            });
        }

        // Block staff and admin from editing item details.
        if (["admin", "staff"].includes(user.role)) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(403).json({
                message: "Staff and admin cannot edit reported item information."
            });
        }

        const itemId = Number(id);

        if (!Number.isInteger(itemId) || itemId <= 0) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(400).json({
                message: "Invalid item ID."
            });
        }

        const {
            category_id,
            location_id,
            item_name,
            description,
            identifying_details,
            color,
            brand,
            item_type,
            date_lost_found
        } = req.body;

        if (
            !category_id ||
            !location_id ||
            !item_name ||
            !description ||
            !item_type ||
            !date_lost_found
        ) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(400).json({
                message: "Please complete all required fields."
            });
        }

        if (!["lost", "found"].includes(item_type)) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(400).json({
                message: "Invalid item type."
            });
        }

        // Check ownership before updating.
        const [existingItems] = await db.query<ItemRow[]>(
            `SELECT *
             FROM items
             WHERE item_id = ?
             AND user_id = ?`,
            [
                itemId,
                user.user_id
            ]
        );

        if (existingItems.length === 0) {
            if (req.file) {
                removeImageFile(req.file.filename);
            }

            return res.status(404).json({
                message: "Item not found or you do not have permission to edit it."
            });
        }

        await db.query(
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
             AND user_id = ?`,
            [
                category_id,
                location_id,
                item_name.trim(),
                description,
                identifying_details || null,
                color || null,
                brand || null,
                item_type,
                date_lost_found,
                itemId,
                user.user_id
            ]
        );

        // Replace old image if a new image was uploaded.
        if (req.file) {
            const [oldImages] = await db.query<RowDataPacket[]>(
                `SELECT image_path
                 FROM item_images
                 WHERE item_id = ?`,
                [itemId]
            );

            await db.query(
                `DELETE FROM item_images
                 WHERE item_id = ?`,
                [itemId]
            );

            await db.query(
                `INSERT INTO item_images
                 (item_id, image_path)
                 VALUES (?, ?)`,
                [
                    itemId,
                    req.file.filename
                ]
            );

            oldImages.forEach(image => {
                removeImageFile(image.image_path);
            });
        }

        // Regenerate possible matches.
        try {
            await generateMatches(itemId);
        } catch (matchingError) {
            console.error(
                "Updated item matching error:",
                matchingError
            );
        }

        await logActivity({
            user_id: user.user_id,
            action: "Updated Item",
            details: `Updated item: ${item_name.trim()} (Item ID: ${itemId})`
        });

        return res.status(200).json({
            message: "Item updated successfully."
        });

    } catch (error) {
        if (req.file) {
            removeImageFile(req.file.filename);
        }

        console.error("Update item error:", error);

        return res.status(500).json({
            message: "Failed to update item."
        });
    }
};


// UPDATE ITEM STATUS
// STAFF AND ADMIN ONLY

export const updateItemStatus = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized."
            });
        }

        if (!["admin", "staff"].includes(user.role)) {
            return res.status(403).json({
                message: "Only staff and admin can update item status."
            });
        }

        const itemId = Number(req.params.id);
        const { status } = req.body;

        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({
                message: "Invalid item ID."
            });
        }

        const allowedStatuses = [
            "pending",
            "active",
            "matched",
            "claimed",
            "returned",
            "rejected",
            "archived"
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                message: "Invalid item status."
            });
        }

        const [result] = await db.query<ResultSetHeader>(
            `UPDATE items
             SET status = ?
             WHERE item_id = ?`,
            [
                status,
                itemId
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Item not found."
            });
        }

        await logActivity({
            user_id: user.user_id,
            action: "Updated Item Status",
            details: `Changed item #${itemId} status to ${status}.`
        });

        return res.status(200).json({
            message: "Item status updated successfully."
        });

    } catch (error) {
        console.error("Update item status error:", error);

        return res.status(500).json({
            message: "Failed to update item status."
        });
    }
};


// DELETE ITEM

// STUDENTS CAN ONLY DELETE THEIR OWN REPORTS.
// ITEMS WITH EXISTING CLAIMS CANNOT BE DELETED.


export const deleteItem = async (
    req: AuthRequest,
    res: Response
) => {
    try {
        const user = req.user;

        if (!user) {
            return res.status(401).json({
                message: "Unauthorized."
            });
        }

        const itemId = Number(req.params.id);

        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({
                message: "Invalid item ID."
            });
        }

        const isPrivileged =
            ["admin", "staff"].includes(user.role);

        // Check whether the item exists and verify ownership.
        let query = `
            SELECT *
            FROM items
            WHERE item_id = ?
        `;

        const params: number[] = [itemId];

        if (!isPrivileged) {
            query += " AND user_id = ?";
            params.push(user.user_id);
        }

        const [items] = await db.query<ItemRow[]>(
            query,
            params
        );

        if (items.length === 0) {
            return res.status(404).json({
                message: "Item not found or you do not have permission to delete it."
            });
        }

        const item = items[0];

        // Check if the item has existing claims.
        const [claims] = await db.query<RowDataPacket[]>(
            `SELECT claim_id
             FROM claims
             WHERE item_id = ?
             LIMIT 1`,
            [itemId]
        );

        // Preserve claim history.
        if (claims.length > 0) {
            return res.status(409).json({
                message:
                    "This item cannot be deleted because it has existing claim records. Please preserve the claim history."
            });
        }

        // Get associated images before deleting the item.
        const [images] = await db.query<RowDataPacket[]>(
            `SELECT image_path
             FROM item_images
             WHERE item_id = ?`,
            [itemId]
        );

        // Delete the item.
        const [result] = await db.query<ResultSetHeader>(
            `DELETE FROM items
             WHERE item_id = ?`,
            [itemId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Item could not be deleted."
            });
        }

        // Remove associated image files.
        images.forEach(image => {
            removeImageFile(image.image_path);
        });

        // Record the activity.
        await logActivity({
            user_id: user.user_id,
            action: "Deleted Item",
            details: `Deleted ${item.item_type} item: ${item.item_name} (Item ID: ${itemId})`
        });

        return res.status(200).json({
            message: "Item deleted successfully."
        });

    } catch (error) {
        console.error("Delete item error:", error);

        return res.status(500).json({
            message: "Failed to delete item."
        });
    }};