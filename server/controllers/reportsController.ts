import { Request, Response } from "express";
import db from "../config/db";

export const getReports = async (
    req: Request,
    res: Response
) => {
    try {
        // Only admin and staff can access reports.
        if (!req.user || !["admin", "staff"].includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied. Admin and staff only."
            });
        }

        // Get optional date filters.
        const { startDate, endDate } = req.query;

        // Validate date format.
        const validDate = (value: unknown): boolean => {
            if (typeof value !== "string") return false;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return false;
            }

            const date = new Date(`${value}T00:00:00Z`);

            return (
                !Number.isNaN(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
            );
        };

        if (
            (startDate && !validDate(startDate)) ||
            (endDate && !validDate(endDate))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Use YYYY-MM-DD."
            });
        }

        if (
            startDate &&
            endDate &&
            new Date(startDate as string) > new Date(endDate as string)
        ) {
            return res.status(400).json({
                success: false,
                message: "Start date cannot be later than end date."
            });
        }

       
        //ITEM DATE CONDITIONS
       

        const itemConditions: string[] = [];
        const itemParams: string[] = [];

        if (startDate) {
            itemConditions.push("DATE(created_at) >= ?");
            itemParams.push(startDate as string);
        }

        if (endDate) {
            itemConditions.push("DATE(created_at) <= ?");
            itemParams.push(endDate as string);
        }

        const itemWhere =
            itemConditions.length > 0
                ? `WHERE ${itemConditions.join(" AND ")}`
                : "";

        
        //CLAIM DATE CONDITIONS
        

        const claimConditions: string[] = [];
        const claimParams: string[] = [];

        if (startDate) {
            claimConditions.push("DATE(created_at) >= ?");
            claimParams.push(startDate as string);
        }

        if (endDate) {
            claimConditions.push("DATE(created_at) <= ?");
            claimParams.push(endDate as string);
        }

        const claimWhere =
            claimConditions.length > 0
                ? `WHERE ${claimConditions.join(" AND ")}`
                : "";

        
        // RETURN DATE CONDITIONS
        

        const returnConditions: string[] = [];
        const returnParams: string[] = [];

        if (startDate) {
            returnConditions.push("DATE(returned_at) >= ?");
            returnParams.push(startDate as string);
        }

        if (endDate) {
            returnConditions.push("DATE(returned_at) <= ?");
            returnParams.push(endDate as string);
        }

        const returnWhere =
            returnConditions.length > 0
                ? `WHERE ${returnConditions.join(" AND ")}`
                : "";

        
        // ITEM SUMMARY
        

        const [itemSummary]: any = await db.query(
            `
            SELECT
                COUNT(*) AS total_items,
                COALESCE(SUM(item_type = 'lost'), 0) AS total_lost,
                COALESCE(SUM(item_type = 'found'), 0) AS total_found,
                COALESCE(SUM(status = 'pending'), 0) AS pending_items,
                COALESCE(SUM(status = 'active'), 0) AS active_items,
                COALESCE(SUM(status = 'matched'), 0) AS matched_items,
                COALESCE(SUM(status = 'claimed'), 0) AS claimed_items,
                COALESCE(SUM(status = 'returned'), 0) AS returned_items
            FROM items
            ${itemWhere}
            `,
            itemParams
        );

       
        // 5. CLAIMS SUMMARY
        

        const [claimSummary]: any = await db.query(
            `
            SELECT
                COUNT(*) AS total_claims,
                COALESCE(SUM(claim_status = 'pending'), 0) AS pending_claims,
                COALESCE(SUM(claim_status = 'approved'), 0) AS approved_claims,
                COALESCE(SUM(claim_status = 'rejected'), 0) AS rejected_claims,
                COALESCE(SUM(claim_status = 'cancelled'), 0) AS cancelled_claims
            FROM claims
            ${claimWhere}
            `,
            claimParams
        );

        
        //MONTHLY LOST AND FOUND REPORTS
        

        const [monthlyReports]: any = await db.query(
            `
            SELECT
                DATE_FORMAT(created_at, '%Y-%m') AS month,
                COALESCE(SUM(item_type = 'lost'), 0) AS lost_items,
                COALESCE(SUM(item_type = 'found'), 0) AS found_items,
                COUNT(*) AS total_items
            FROM items
            ${itemWhere}
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY month ASC
            `,
            itemParams
        );

       
        //ITEM STATUS REPORT
        
        const [statusReports]: any = await db.query(
            `
            SELECT
                status,
                COUNT(*) AS total
            FROM items
            ${itemWhere}
            GROUP BY status
            ORDER BY total DESC
            `,
            itemParams
        );

        
        // 8. CATEGORY REPORT
        

        const categoryConditions: string[] = [];
        const categoryParams: string[] = [];

        if (startDate) {
            categoryConditions.push("DATE(i.created_at) >= ?");
            categoryParams.push(startDate as string);
        }

        if (endDate) {
            categoryConditions.push("DATE(i.created_at) <= ?");
            categoryParams.push(endDate as string);
        }

        const categoryWhere =
            categoryConditions.length > 0
                ? `WHERE ${categoryConditions.join(" AND ")}`
                : "";

        const [categoryReports]: any = await db.query(
            `
            SELECT
                c.category_name,
                COUNT(i.item_id) AS total_items
            FROM items i
            LEFT JOIN categories c
                ON i.category_id = c.category_id
            ${categoryWhere}
            GROUP BY c.category_id, c.category_name
            ORDER BY total_items DESC
            `,
            categoryParams
        );

        
        //RETURNED ITEMS SUMMARY
        
        const [returnSummary]: any = await db.query(
            `
            SELECT COUNT(*) AS total_returned
            FROM item_returns
            ${returnWhere}
            `,
            returnParams
        );

       
        //SEND REPORTS RESPONSE
       

        return res.status(200).json({
            success: true,
            message: "Reports retrieved successfully.",

            summary: {
                ...itemSummary[0],
                ...claimSummary[0],
                total_returned: returnSummary[0].total_returned
            },

            monthlyReports,
            statusReports,
            categoryReports
        });

    } catch (error) {
        console.error("Get reports error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve reports."
        });
    }
};