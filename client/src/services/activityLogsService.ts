import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface ActivityLog {
    log_id: number;
    user_id: number | null;
    action: string;
    details: string | null;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
}

export interface ActivityLogResponse {
    data: ActivityLog[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalRecords: number;
        limit: number;
    };
}

export interface ActivityLogParams {
    page?: number;
    limit?: number;
    search?: string;
    action?: string;
}

export const getActivityLogs = async (
    params: ActivityLogParams = {}
): Promise<ActivityLogResponse> => {
    const token = localStorage.getItem("token");

    const response = await axios.get(
        `${API_URL}/activity-logs`,
        {
            params,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );

    return response.data;
};