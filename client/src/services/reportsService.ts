import axios from "axios";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Report summary
export interface ReportSummary {
    total_items: number;
    total_lost: number;
    total_found: number;
    pending_items: number;
    active_items: number;
    matched_items: number;
    claimed_items: number;
    returned_items: number;

    total_claims: number;
    pending_claims: number;
    approved_claims: number;
    rejected_claims: number;
    cancelled_claims: number;

    total_returned: number;
}

// Monthly report
export interface MonthlyReport {
    month: string;
    lost_items: number;
    found_items: number;
    total_items: number;
}

// Item status report
export interface StatusReport {
    status: string;
    total: number;
}

// Category report
export interface CategoryReport {
    category_name: string | null;
    total_items: number;
}

// Complete report response
export interface ReportsData {
    message: string;
    summary: ReportSummary;
    monthlyReports: MonthlyReport[];
    statusReports: StatusReport[];
    categoryReports: CategoryReport[];
}

// Get reports from backend
export const getReports = async (
    startDate?: string,
    endDate?: string
): Promise<ReportsData> => {
    const token = localStorage.getItem("token");

    const response = await axios.get(`${API_URL}/reports`, {
        headers: {
            Authorization: `Bearer ${token}`
        },
        params: {
            startDate,
            endDate
        }
    });

    return response.data;
};