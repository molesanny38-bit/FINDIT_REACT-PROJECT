import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

import {
    FileText,
    Search,
    Package,
    PackageCheck,
    Clock,
    CheckCircle,
    Download,
    RefreshCw,
} from "lucide-react";

import {
    getReports,
    type ReportsData,
} from "../services/reportsService";

import "./Reports.css";

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
];

const Reports = () => {
    const [reports, setReports] = useState<ReportsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getReports(
                startDate || undefined,
                endDate || undefined
            );

            setReports(data);
        } catch (err: any) {
            console.error("Reports error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to load reports. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    const handleFilter = () => {
        if (startDate && endDate && startDate > endDate) {
            setError("Start date cannot be later than end date.");
            return;
        }

        fetchReports();
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");

        setTimeout(() => {
            fetchReportsWithoutDates();
        }, 0);
    };

    const fetchReportsWithoutDates = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getReports();
            setReports(data);
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "Failed to load reports."
            );
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!reports) return;

        const rows = [
            ["FINDIT CAMPUS - REPORT SUMMARY"],
            [],
            ["Metric", "Total"],
            ["Total Items", reports.summary.total_items],
            ["Lost Items", reports.summary.total_lost],
            ["Found Items", reports.summary.total_found],
            ["Pending Items", reports.summary.pending_items],
            ["Active Items", reports.summary.active_items],
            ["Matched Items", reports.summary.matched_items],
            ["Claimed Items", reports.summary.claimed_items],
            ["Returned Items", reports.summary.returned_items],
            ["Total Claims", reports.summary.total_claims],
            ["Pending Claims", reports.summary.pending_claims],
            ["Approved Claims", reports.summary.approved_claims],
            ["Rejected Claims", reports.summary.rejected_claims],
            [],
            ["MONTHLY REPORT"],
            ["Month", "Lost Items", "Found Items", "Total Items"],
            ...reports.monthlyReports.map((item) => [
                item.month,
                item.lost_items,
                item.found_items,
                item.total_items,
            ]),
            [],
            ["CATEGORY REPORT"],
            ["Category", "Total Items"],
            ...reports.categoryReports.map((item) => [
                item.category_name || "Uncategorized",
                item.total_items,
            ]),
        ];

        const csvContent = rows
            .map((row) =>
                row
                    .map((value) =>
                        `"${String(value ?? "").replace(/"/g, '""')}"`
                    )
                    .join(",")
            )
            .join("\n");

        const blob = new Blob(
            ["\uFEFF" + csvContent],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "FindIt-Campus-Reports.csv";
        link.click();

        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="reports-loading">
                <RefreshCw size={28} className="reports-spinner" />
                <p>Loading reports...</p>
            </div>
        );
    }

    if (error && !reports) {
        return (
            <div className="reports-error">
                <p>{error}</p>
                <button onClick={fetchReports}>
                    <RefreshCw size={16} />
                    Try Again
                </button>
            </div>
        );
    }

    if (!reports) return null;

    const summary = reports.summary;

    const statusData = reports.statusReports.map((item) => ({
        name: item.status.charAt(0).toUpperCase() + item.status.slice(1),
        value: Number(item.total),
    }));

    const categoryData = reports.categoryReports.map((item) => ({
        name: item.category_name || "Uncategorized",
        total: Number(item.total_items),
    }));

    const summaryCards = [
        {
            title: "Total Items",
            value: summary.total_items,
            icon: <Package size={23} />,
        },
        {
            title: "Lost Items",
            value: summary.total_lost,
            icon: <Search size={23} />,
        },
        {
            title: "Found Items",
            value: summary.total_found,
            icon: <PackageCheck size={23} />,
        },
        {
            title: "Pending Claims",
            value: summary.pending_claims,
            icon: <Clock size={23} />,
        },
        {
            title: "Approved Claims",
            value: summary.approved_claims,
            icon: <CheckCircle size={23} />,
        },
        {
            title: "Returned Items",
            value: summary.total_returned,
            icon: <FileText size={23} />,
        },
    ];

    return (
        <div className="reports-page">

            {/* Page Header */}
            <div className="reports-header">
                <div>
                    <h1>Reports & Analytics</h1>
                    <p>
                        Monitor lost and found activities in your campus.
                    </p>
                </div>

                <button
                    className="export-button"
                    onClick={exportCSV}
                >
                    <Download size={18} />
                    Export CSV
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="reports-warning">
                    {error}
                </div>
            )}

            {/* Date Filter */}
            <div className="reports-filter">
                <div className="date-input">
                    <label>Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="date-input">
                    <label>End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <button
                    className="filter-button"
                    onClick={handleFilter}
                >
                    <Search size={17} />
                    Apply Filter
                </button>

                <button
                    className="reset-button"
                    onClick={handleReset}
                >
                    <RefreshCw size={17} />
                    Reset
                </button>
            </div>

            {/* Summary Cards */}
            <div className="reports-summary">
                {summaryCards.map((card, index) => (
                    <div className="report-card" key={index}>
                        <div className="report-card-icon">
                            {card.icon}
                        </div>

                        <div>
                            <p>{card.title}</p>
                            <h2>{Number(card.value || 0)}</h2>
                        </div>
                    </div>
                ))}
            </div>

            {/* Monthly Reports */}
            <div className="reports-chart-container">
                <div className="chart-header">
                    <h2>Monthly Lost and Found Reports</h2>
                    <p>Number of items reported each month.</p>
                </div>

                <div className="chart-area">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={reports.monthlyReports}>
                            <CartesianGrid strokeDasharray="3 3" />

                            <XAxis dataKey="month" />
                            <YAxis allowDecimals={false} />

                            <Tooltip />
                            <Legend />

                            <Bar
                                dataKey="lost_items"
                                name="Lost Items"
                                fill="#ef4444"
                                radius={[5, 5, 0, 0]}
                            />

                            <Bar
                                dataKey="found_items"
                                name="Found Items"
                                fill="#10b981"
                                radius={[5, 5, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Status and Category Charts */}
            <div className="reports-chart-grid">

                <div className="reports-chart-container">
                    <div className="chart-header">
                        <h2>Item Status Distribution</h2>
                        <p>Distribution of reported item statuses.</p>
                    </div>

                    <div className="chart-area">
                        {statusData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusData}
                                        dataKey="value"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={100}
                                        label
                                    >
                                        {statusData.map((_, index) => (
                                            <Cell
                                                key={index}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>

                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="empty-chart">
                                No status data available.
                            </p>
                        )}
                    </div>
                </div>

                <div className="reports-chart-container">
                    <div className="chart-header">
                        <h2>Items by Category</h2>
                        <p>Most frequently reported item categories.</p>
                    </div>

                    <div className="chart-area">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData}>
                                <CartesianGrid strokeDasharray="3 3" />

                                <XAxis
                                    dataKey="name"
                                    angle={-20}
                                    textAnchor="end"
                                    height={70}
                                />

                                <YAxis allowDecimals={false} />
                                <Tooltip />

                                <Bar
                                    dataKey="total"
                                    name="Total Items"
                                    fill="#6366f1"
                                    radius={[5, 5, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* Claim Summary */}
            <div className="claim-report-section">
                <h2>Claims Overview</h2>

                <div className="claim-report-grid">
                    <div>
                        <span>Total Claims</span>
                        <h2>{summary.total_claims}</h2>
                    </div>

                    <div>
                        <span>Pending</span>
                        <h2>{summary.pending_claims}</h2>
                    </div>

                    <div>
                        <span>Approved</span>
                        <h2>{summary.approved_claims}</h2>
                    </div>

                    <div>
                        <span>Rejected</span>
                        <h2>{summary.rejected_claims}</h2>
                    </div>

                    <div>
                        <span>Cancelled</span>
                        <h2>{summary.cancelled_claims}</h2>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Reports;