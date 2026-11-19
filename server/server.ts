import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import authRoutes from "./routes/authRoutes";
import itemsRoutes from "./routes/itemsRoutes";
import claimsRoutes from "./routes/claimsRoutes";
import notificationsRoutes from "./routes/notificationsRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import usersRoutes from "./routes/userRoutes";
import matchesRoutes from "./routes/matchesRoutes";
import reportsRoutes from "./routes/reportsRoutes";
import activityLogsRoutes from "./routes/logsRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", usersRoutes);

app.use("/api/matches", matchesRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/activity-logs", activityLogsRoutes);

// Test route
app.get("/", (_req, res) => {
  res.send("FindIt Campus API is running!");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});