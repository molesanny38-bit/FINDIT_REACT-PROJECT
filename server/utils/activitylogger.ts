import db from "../config/db";

interface ActivityLogData {
    user_id: number | null;
    action: string;
    details?: string;
}

export const logActivity = async ({
    user_id,
    action,
    details
}: ActivityLogData): Promise<void> => {
    try {
        await db.query(
            `
            INSERT INTO activity_logs
                (user_id, action, details)
            VALUES (?, ?, ?)
            `,
            [
                user_id,
                action,
                details || null
            ]
        );

    } catch (error) {
        // Logging errors should not interrupt the main operation.
        console.error("Activity logging error:", error);
    }
};