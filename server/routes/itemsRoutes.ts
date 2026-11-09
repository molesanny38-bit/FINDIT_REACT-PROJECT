import { Router } from "express";

import {
  getItems,
  addItem,
  getCategories,
  getLocations,
  updateItem,
  deleteItem,
} from "../controllers/itemController";

import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/categories", authenticateToken, getCategories);
router.get("/locations", authenticateToken, getLocations);

router.get("/", authenticateToken, getItems);
router.post("/", authenticateToken, addItem);
router.put("/:id", authenticateToken, updateItem);
router.delete("/:id", authenticateToken, deleteItem);

export default router;