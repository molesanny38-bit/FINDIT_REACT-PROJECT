import { Request, Response } from "express";
import db from "../config/db";

// Get activity logs
export const getActivityLogs = async (
    req: Request,
    res: Response
) => {
    try {
        // Only administrators can view activity logs.
        if (!req.user || req.user.role !== "admin") {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin only."
            });
        }

        // Pagination
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 10)
        );

        const offset = (page - 1) * limit;

        // Search and filter
        const search =
            typeof req.query.search === "string"
                ? req.query.search.trim()
                : "";

        const action =
            typeof req.query.action === "string"
                ? req.query.action.trim()
                : "";

        const conditions: string[] = [];
        const params: (string | number)[] = [];

        if (search) {
            conditions.push(`
                (
                    activity_logs.action LIKE ?
                    OR activity_logs.details LIKE ?
                    OR users.first_name LIKE ?
                    OR users.last_name LIKE ?
                    OR users.email LIKE ?
                )
            `);

            const searchValue = `%${search}%`;

            params.push(
                searchValue,
                searchValue,
                searchValue,
                searchValue,
                searchValue
            );
        }

        if (action) {
            conditions.push("activity_logs.action = ?");
            params.push(action);
        }

        const whereClause =
            conditions.length > 0
                ? `WHERE ${conditions.join(" AND ")}`
                : "";

        // Get total number of matching logs
        const [countResult]: any = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM activity_logs
            LEFT JOIN users
                ON activity_logs.user_id = users.user_id
            ${whereClause}
            `,
            params
        );

        // Get activity logs
        const [logs]: any = await db.query(
            `
            SELECT
                activity_logs.log_id,
                activity_logs.user_id,
                activity_logs.action,
                activity_logs.details,
                activity_logs.created_at,
                users.first_name,
                users.last_name,
                users.email,
                users.role
            FROM activity_logs
            LEFT JOIN users
                ON activity_logs.user_id = users.user_id
            ${whereClause}
            ORDER BY activity_logs.created_at DESC
            LIMIT ? OFFSET ?
            `,
            [...params, limit, offset]
        );

        const total = Number(countResult[0].total);

        return res.status(200).json({
            success: true,
            message: "Activity logs retrieved successfully.",
            data: logs,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("Get activity logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve activity logs."
        });
    }
};