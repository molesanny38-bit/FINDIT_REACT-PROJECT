import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Package,
  Search,
  PackageCheck,
  Clock,
  CheckCircle,
  Users as UsersIcon,
  Bell,
  ArrowRight,
  FileText,
  GitCompare,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import "./Dashboard.css";

interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  lostItems: number;
  foundItems: number;
  pendingClaims: number;
  approvedClaims: number;
}

interface User {
  user_id?: number;
  first_name?: string;
  last_name?: string;
  role?: "admin" | "staff" | "student";
}

function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalItems: 0,
    lostItems: 0,
    foundItems: 0,
    pendingClaims: 0,
    approvedClaims: 0,
  });

  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Get logged-in user safely
  const storedUser = localStorage.getItem("user");
  let user: User = {};
  try {
    user = storedUser ? JSON.parse(storedUser) : {};
  } catch {
    user = {};
  }

  const isStudent = user.role === "student";
  const isStaff = user.role === "staff";
  const isAdmin = user.role === "admin";

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statsResponse, notificationResponse] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, { headers }),
          fetch(`${API_URL}/notifications/unread-count`, {
            headers,
          }),
        ]);

        if (!statsResponse.ok || !notificationResponse.ok) {
          throw new Error("Failed to load dashboard information.");
        }

        const statsData = await statsResponse.json();
        const notificationData = await notificationResponse.json();

        setStats(statsData.stats);
        setUnreadCount(
          Number(
            notificationData.unreadCount ??
              notificationData.count ??
              notificationData.unread_count ??
              0
          )
        );
      } catch (error) {
        console.error("Dashboard loading error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [API_URL, navigate]);

  const getDashboardTitle = () => {
    if (isStudent) return "Student Lost & Found Portal";
    if (isStaff) return "Staff Management Dashboard";
    if (isAdmin) return "Campus Administration Dashboard";
    return "Campus Dashboard";
  };

  return (
    <div className="dashboard-page">
      {/* WELCOME BANNER */}
      <section className="dashboard-welcome-banner" aria-labelledby="dashboard-heading">
        <div className="welcome-banner-content">
          <div className="welcome-role-badge">
            <ShieldCheck size={16} aria-hidden="true" />
            <span>{isAdmin ? "Admin Access" : isStaff ? "Staff Portal" : "Student Member"}</span>
          </div>
          <h1 id="dashboard-heading" className="welcome-title">
            Welcome back, {user.first_name || "Campus Member"}!
          </h1>
          <p className="welcome-subtitle">
            {getDashboardTitle()} — search for misplaced belongings, submit verification claims, or monitor report statuses in real time.
          </p>
        </div>

        {/* QUICK SHORTCUT ACTIONS */}
        <div className="welcome-actions" role="group" aria-label="Quick Actions">
          {isStudent ? (
            <>
              <Link to="/my-reports" className="btn-primary-action">
                <PlusCircle size={18} aria-hidden="true" />
                <span>Submit a Report</span>
              </Link>
              <Link to="/browse-lost-items" className="btn-secondary-action">
                <Search size={18} aria-hidden="true" />
                <span>Browse Lost</span>
              </Link>
              <Link to="/browse-found-items" className="btn-secondary-action">
                <Package size={18} aria-hidden="true" />
                <span>Browse Found</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/items" className="btn-primary-action">
                <Package size={18} aria-hidden="true" />
                <span>Manage Items</span>
              </Link>
              <Link to="/claims" className="btn-secondary-action">
                <CheckCircle size={18} aria-hidden="true" />
                <span>Review Claims</span>
              </Link>
              <Link to="/reports" className="btn-secondary-action">
                <FileText size={18} aria-hidden="true" />
                <span>View Analytics</span>
              </Link>
            </>
          )}
        </div>
      </section>

      {/* STATS OVERVIEW SECTION */}
      <section className="dashboard-section" aria-labelledby="stats-heading">
        <div className="section-header-wrap">
          <h2 id="stats-heading" className="dashboard-section-title">
            Campus Activity Summary
          </h2>
          <span className="section-indicator">Live Overview</span>
        </div>

        {loading ? (
          <div className="dashboard-loading-state" role="status" aria-live="polite">
            <div className="dashboard-spinner" aria-hidden="true" />
            <p>Loading dashboard statistics...</p>
          </div>
        ) : (
          <div className="stats-grid">
            {/* Total Items */}
            <div className="stat-card">
              <div className="stat-card-icon icon-blue" aria-hidden="true">
                <Package size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Total Items</span>
                <strong className="stat-number">{stats.totalItems}</strong>
                <span className="stat-subtext">All reported campus items</span>
              </div>
            </div>

            {/* Lost Reports */}
            <div className="stat-card">
              <div className="stat-card-icon icon-amber" aria-hidden="true">
                <Search size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Lost Reports</span>
                <strong className="stat-number">{stats.lostItems}</strong>
                <span className="stat-subtext">Items looking for owners</span>
              </div>
            </div>

            {/* Found Items */}
            <div className="stat-card">
              <div className="stat-card-icon icon-green" aria-hidden="true">
                <PackageCheck size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Found Items</span>
                <strong className="stat-number">{stats.foundItems}</strong>
                <span className="stat-subtext">Safely turned in to campus</span>
              </div>
            </div>

            {/* Pending Claims */}
            <div className="stat-card">
              <div className="stat-card-icon icon-orange" aria-hidden="true">
                <Clock size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Pending Claims</span>
                <strong className="stat-number">{stats.pendingClaims}</strong>
                <span className="stat-subtext">Awaiting verification</span>
              </div>
            </div>

            {/* Approved Claims */}
            <div className="stat-card">
              <div className="stat-card-icon icon-emerald" aria-hidden="true">
                <CheckCircle size={24} />
              </div>
              <div className="stat-card-info">
                <span className="stat-label">Approved Claims</span>
                <strong className="stat-number">{stats.approvedClaims}</strong>
                <span className="stat-subtext">Successfully resolved</span>
              </div>
            </div>

            {/* Admin & Staff Registered Users */}
            {(isAdmin || isStaff) && (
              <div className="stat-card">
                <div className="stat-card-icon icon-purple" aria-hidden="true">
                  <UsersIcon size={24} />
                </div>
                <div className="stat-card-info">
                  <span className="stat-label">Registered Users</span>
                  <strong className="stat-number">{stats.totalUsers}</strong>
                  <span className="stat-subtext">Active campus accounts</span>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* QUICK HIGHLIGHTS / NAVIGATION SECTION */}
      <section className="dashboard-grid-cards">
        {/* Status Highlights */}
        <div className="dashboard-card-panel">
          <div className="card-panel-header">
            <h3>System Status & Activity</h3>
            <span className="badge-online">Active</span>
          </div>
          <div className="card-panel-body">
            <p className="status-item">
              There are currently <strong>{stats.totalItems}</strong> recorded items in the FindIt system.
            </p>
            <p className="status-item">
              There are <strong>{stats.pendingClaims}</strong> claims undergoing verification by campus staff.
            </p>
            <p className="status-item">
              You currently have <strong>{unreadCount}</strong> unread notifications waiting in your inbox.
            </p>
          </div>
          <div className="card-panel-footer">
            <Link to="/notifications" className="card-panel-link">
              <Bell size={16} aria-hidden="true" />
              <span>View Notifications</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Helpful Shortcuts */}
        <div className="dashboard-card-panel">
          <div className="card-panel-header">
            <h3>Recommended Actions</h3>
          </div>
          <div className="card-panel-body list-actions">
            {isStudent ? (
              <>
                <Link to="/matches" className="quick-action-row">
                  <div className="quick-action-icon" aria-hidden="true">
                    <GitCompare size={18} />
                  </div>
                  <div>
                    <strong>Check Possible Item Matches</strong>
                    <p>Review automatic matches for your lost or found items.</p>
                  </div>
                </Link>
                <Link to="/claims" className="quick-action-row">
                  <div className="quick-action-icon" aria-hidden="true">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <strong>Track Submitted Claims</strong>
                    <p>Monitor your claim progress and retrieval instructions.</p>
                  </div>
                </Link>
              </>
            ) : (
              <>
                <Link to="/matches" className="quick-action-row">
                  <div className="quick-action-icon" aria-hidden="true">
                    <GitCompare size={18} />
                  </div>
                  <div>
                    <strong>Match Verification Queue</strong>
                    <p>Confirm potential matches between lost and found items.</p>
                  </div>
                </Link>
                <Link to="/claims" className="quick-action-row">
                  <div className="quick-action-icon" aria-hidden="true">
                    <CheckCircle size={18} />
                  </div>
                  <div>
                    <strong>Manage Claims Queue</strong>
                    <p>Approve or deny submitted student verification claims.</p>
                  </div>
                </Link>
              </>
            )}
          </div>
          <div className="card-panel-footer">
            <Link to="/settings" className="card-panel-link">
              <span>Adjust Personal & Accessibility Preferences</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
