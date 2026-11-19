import { useEffect, useState } from "react";
import {
    Search,
    RefreshCw,
    ClipboardList,
    ChevronLeft,
    ChevronRight,
    Activity,
} from "lucide-react";

import {
    getActivityLogs,
    type ActivityLog,
} from "../services/activityLogsService";

import "./ActivityLogs.css";

const ActivityLogs = () => {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [action, setAction] = useState("");
    const [page, setPage] = useState(1);

    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

    const fetchLogs = async () => {
        try {
            setLoading(true);

            const response = await getActivityLogs({
                page,
                limit: 10,
                search,
                action,
            });

            setLogs(response.data);
            setTotalPages(response.pagination.totalPages);
            setTotalRecords(response.pagination.totalRecords);

        } catch (error) {
            console.error("Failed to fetch activity logs:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, search, action]);

    const getActionClass = (value: string) => {
        const normalized = value.toLowerCase();

        if (normalized.includes("login")) return "login";
        if (normalized.includes("registration")) return "registration";
        if (normalized.includes("added")) return "added";
        if (normalized.includes("updated")) return "updated";
        if (normalized.includes("deleted")) return "deleted";
        if (normalized.includes("approved")) return "approved";
        if (normalized.includes("rejected")) return "rejected";
        if (normalized.includes("claim")) return "claim";
        if (normalized.includes("returned")) return "returned";

        return "default";
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString();
    };

    return (
        <div className="activity-logs-page">

            <div className="activity-logs-header">
                <div>
                    <h1>Activity Logs</h1>
                    <p>Monitor and track activities performed in FindIt Campus.</p>
                </div>

                <button
                    className="activity-refresh-btn"
                    onClick={fetchLogs}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            <div className="activity-summary-card">
                <div className="activity-summary-icon">
                    <Activity size={25} />
                </div>

                <div>
                    <span>Total Activities</span>
                    <h2>{totalRecords}</h2>
                </div>
            </div>

            <div className="activity-logs-container">

                <div className="activity-toolbar">

                    <div className="activity-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search activities..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <select
                        value={action}
                        onChange={(e) => {
                            setAction(e.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All Activities</option>
                        <option value="User Registration">User Registration</option>
                        <option value="User Login">User Login</option>
                        <option value="Added Item">Added Item</option>
                        <option value="Updated Item">Updated Item</option>
                        <option value="Deleted Item">Deleted Item</option>
                        <option value="Submitted Claim">Submitted Claim</option>
                        <option value="Approved Claim">Approved Claim</option>
                        <option value="Rejected Claim">Rejected Claim</option>
                        <option value="Returned Item">Returned Item</option>
                    </select>

                </div>

                <div className="activity-table-wrapper">
                    <table className="activity-table">

                        <thead>
                            <tr>
                                <th>USER</th>
                                <th>ACTION</th>
                                <th>DETAILS</th>
                                <th>DATE & TIME</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="activity-empty">
                                        Loading activity logs...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="activity-empty">
                                        <ClipboardList size={35} />
                                        <p>No activity logs found.</p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.log_id}>
                                        <td>
                                            <div className="activity-user">
                                                <div className="activity-avatar">
                                                    {log.first_name?.charAt(0) || "U"}
                                                </div>

                                                <div>
                                                    <strong>
                                                        {log.first_name || "Unknown"}{" "}
                                                        {log.last_name || "User"}
                                                    </strong>

                                                    <small>
                                                        {log.email || "No email"}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span
                                                className={`activity-badge ${getActionClass(log.action)}`}
                                            >
                                                {log.action}
                                            </span>
                                        </td>

                                        <td className="activity-details">
                                            {log.details || "No details provided."}
                                        </td>

                                        <td className="activity-date">
                                            {formatDate(log.created_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>

                    </table>
                </div>

                <div className="activity-pagination">

                    <span>
                        Showing {logs.length} of {totalRecords} activities
                    </span>

                    <div>
                        <button
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((previous) => previous - 1)}
                        >
                            <ChevronLeft size={17} />
                        </button>

                        <span>
                            Page {page} of {Math.max(totalPages, 1)}
                        </span>

                        <button
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage((previous) => previous + 1)}
                        >
                            <ChevronRight size={17} />
                        </button>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default ActivityLogs;