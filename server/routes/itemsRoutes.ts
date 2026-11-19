import { Router } from "express";

import {
    getItems,
    addItem,
    getCategories,
    getLocations,
    updateItem,
    updateItemStatus,
    deleteItem
} from "../controllers/itemController";

import { authenticateToken } from "../middleware/authMiddleware";
import upload from "../middleware/uploadMiddleware";

const router = Router();

router.get("/categories", authenticateToken, getCategories);
router.get("/locations", authenticateToken, getLocations);

router.get("/", authenticateToken, getItems);

router.post(
    "/",
    authenticateToken,
    upload.single("image"),
    addItem
);

router.patch(
    "/:id/status",
    authenticateToken,
    updateItemStatus
);

router.put(
    "/:id",
    authenticateToken,
    upload.single("image"),
    updateItem
);

router.delete(
    "/:id",
    authenticateToken,
    deleteItem
);

export default router;