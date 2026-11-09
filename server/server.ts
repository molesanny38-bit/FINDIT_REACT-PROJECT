import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db";
import authRoutes from "./routes/authRoutes";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const PORT = process.env.PORT || 5000;

// Authentication routes
app.use("/api/auth", authRoutes);

// Home route
app.get("/", (req, res) => {
    res.json({
        message: "FindIt Campus API is running!"
    });
});

// Database connection test
app.get("/api/test-db", async (req, res) => {
    try {
        const connection = await db.getConnection();
        connection.release();

        res.json({
            success: true,
            message: "Successfully connected to FindIt Campus Database!"
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            success: false,
            message: "Database connection failed."
        });
    }
});

app.listen(PORT, () => {
    console.log(`FindIt Campus server running on port ${PORT}`);
});