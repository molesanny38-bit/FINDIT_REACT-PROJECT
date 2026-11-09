import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import  db  from "../config/db";

interface AuthRequest extends Request {
  user?: {
    user_id: number;
    role: string;
  };
}

// GET ALL ITEMS
export const getItems = async (req: AuthRequest, res: Response) => {
  try {
    const [items] = await db.query<RowDataPacket[]>(
      `SELECT
        items.item_id,
        items.category_id,
        items.location_id,
        items.item_name,
        items.description,
        items.color,
        items.brand,
        items.item_type,
        items.date_lost_found,
        items.status,
        categories.category_name,
        locations.location_name,
        users.first_name,
        users.last_name
      FROM items
      LEFT JOIN categories ON items.category_id = categories.category_id
      LEFT JOIN locations ON items.location_id = locations.location_id
      LEFT JOIN users ON items.user_id = users.user_id
      ORDER BY items.created_at DESC`
    );

    res.status(200).json(items);
  } catch (error) {
    console.error("Get items error:", error);
    res.status(500).json({ message: "Failed to retrieve items." });
  }
};

// ADD NEW ITEM
export const addItem = async (req: AuthRequest, res: Response) => {
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
      return res.status(401).json({ message: "Unauthorized." });
    }

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

    res.status(201).json({
      message: "Item reported successfully.",
      item_id: result.insertId,
    });
  } catch (error) {
    console.error("Add item error:", error);
    res.status(500).json({ message: "Failed to add item." });
  }
};

// GET ALL CATEGORIES
export const getCategories = async (req: Request, res: Response) => {
  try {
    const [categories] = await db.query<RowDataPacket[]>(
      "SELECT category_id, category_name FROM categories ORDER BY category_name ASC"
    );

    res.status(200).json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: "Failed to retrieve categories." });
  }
};

// GET ALL LOCATIONS
export const getLocations = async (req: Request, res: Response) => {
  try {
    const [locations] = await db.query<RowDataPacket[]>(
      "SELECT location_id, location_name FROM locations ORDER BY location_name ASC"
    );

    res.status(200).json(locations);
  } catch (error) {
    console.error("Get locations error:", error);
    res.status(500).json({ message: "Failed to retrieve locations." });
  }
};

// UPDATE ITEM
export const updateItem = async (req: AuthRequest, res: Response) => {
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
      return res.status(401).json({ message: "Unauthorized." });
    }

    const isPrivileged = ["admin", "staff"].includes(user.role);

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
        message: "Item not found or you do not have permission to edit it.",
      });
    }

    res.status(200).json({
      message: "Item updated successfully.",
    });
  } catch (error) {
    console.error("Update item error:", error);
    res.status(500).json({
      message: "Failed to update item.",
    });
  }
};

// DELETE ITEM
export const deleteItem = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const isPrivileged = ["admin", "staff"].includes(user.role);

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
        message: "Item not found or you do not have permission to delete it.",
      });
    }

    res.status(200).json({
      message: "Item deleted successfully.",
    });
  } catch (error) {
    console.error("Delete item error:", error);
    res.status(500).json({
      message: "Failed to delete item.",
    });
  }
};