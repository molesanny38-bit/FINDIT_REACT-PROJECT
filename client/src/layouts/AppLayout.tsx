import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Package,
  ClipboardCheck,
  GitCompare,
  Bell,
  Users,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  BarChart3,
  ShieldCheck,
  Plus,
  Compass,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { useAccessibility } from "../context/AccessibilityContext";
import { AccessibilityWidget } from "../components/AccessibilityWidget";
import "./AppLayout.css";

interface UserProfile {
  user_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: "admin" | "staff" | "student";
}

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useAccessibility();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  // Read current user
  let user: UserProfile = {};
  try {
    const raw = localStorage.getItem("user");
    user = raw ? JSON.parse(raw) : {};
  } catch {
    user = {};
  }

  const role = user.role || "student";
  const isStudent = role === "student";
  const isStaff = role === "staff";
  const isAdmin = role === "admin";

  // Close mobile drawer on route navigation
  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile nav drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileNavOpen) {
        setMobileNavOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileNavOpen]);

  // Fetch unread notification count
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(
            Number(data.unreadCount ?? data.count ?? data.unread_count ?? 0)
          );
        }
      } catch {
        // Silently catch network errors
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [API_URL]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const getRoleDisplayName = () => {
    if (isAdmin) return "Admin";
    if (isStaff) return "Staff";
    return "Student";
  };

  const getPageTitle = () => {
    const p = location.pathname;
    if (p.includes("/dashboard")) return "Dashboard";
    if (p.includes("/browse-lost-items")) return "Browse Lost Items";
    if (p.includes("/browse-found-items")) return "Browse Found Items";
    if (p.includes("/my-reports")) return "My Reports";
    if (p.includes("/claims")) return isStudent ? "My Claims" : "Manage Claims";
    if (p.includes("/matches")) return "Possible Matches";
    if (p.includes("/items")) return "Inventory Management";
    if (p.includes("/reports")) return "Analytics & Reports";
    if (p.includes("/users")) return "User Management";
    if (p.includes("/activity-logs")) return "Activity Logs";
    if (p.includes("/notifications")) return "Notifications";
    if (p.includes("/profile")) return "Account Profile";
    if (p.includes("/settings")) return "Settings & Accessibility";
    if (p.includes("/item-details")) return "Item Details";
    return "Dashboard";
  };

  return (
    <div className="app-shell">
      {/* Skip to Main Content Link for Keyboard and Screen Reader Accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* MOBILE BACKDROP OVERLAY */}
      {mobileNavOpen && (
        <div
          className="mobile-nav-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MINIMALIST PREMIUM SAAS SIDEBAR */}
      <aside
        id="app-navigation"
        className={`app-sidebar ${mobileNavOpen ? "open" : ""}`}
        aria-label="Application navigation"
      >
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <Link to="/dashboard" className="sidebar-brand" aria-label="FindIt Campus Home">
            <div className="brand-logo-badge" aria-hidden="true">
              <ShieldCheck size={20} strokeWidth={2.5} />
            </div>
            <div className="brand-text-block">
              <span className="brand-title">FindIt</span>
              <span className="brand-badge-pill">{getRoleDisplayName()}</span>
            </div>
          </Link>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Quick Goal Action Button for instant 1-click access */}
        <div className="sidebar-quick-action">
          {isStudent ? (
            <Link to="/my-reports" className="sidebar-primary-cta">
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              <span>Report an Item</span>
            </Link>
          ) : (
            <Link to="/items" className="sidebar-primary-cta">
              <Plus size={16} strokeWidth={2.5} aria-hidden="true" />
              <span>Manage Inventory</span>
            </Link>
          )}
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          {/* SECTION: OVERVIEW */}
          <div className="nav-group">
            <span className="nav-group-label">Overview</span>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              aria-current={location.pathname === "/dashboard" ? "page" : undefined}
            >
              <LayoutDashboard size={17} aria-hidden="true" />
              <span>Dashboard</span>
            </NavLink>
          </div>

          {/* SECTION FOR STUDENTS */}
          {isStudent && (
            <>
              <div className="nav-group">
                <span className="nav-group-label">Discovery</span>
                <NavLink
                  to="/browse-lost-items"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/browse-lost-items" ? "page" : undefined}
                >
                  <Search size={17} aria-hidden="true" />
                  <span>Browse Lost Items</span>
                </NavLink>

                <NavLink
                  to="/browse-found-items"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/browse-found-items" ? "page" : undefined}
                >
                  <Compass size={17} aria-hidden="true" />
                  <span>Browse Found Items</span>
                </NavLink>
              </div>

              <div className="nav-group">
                <span className="nav-group-label">My Activity</span>
                <NavLink
                  to="/my-reports"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/my-reports" ? "page" : undefined}
                >
                  <FolderOpen size={17} aria-hidden="true" />
                  <span>My Reports</span>
                </NavLink>

                <NavLink
                  to="/claims"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/claims" ? "page" : undefined}
                >
                  <ClipboardCheck size={17} aria-hidden="true" />
                  <span>My Claims</span>
                </NavLink>

                <NavLink
                  to="/matches"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/matches" ? "page" : undefined}
                >
                  <GitCompare size={17} aria-hidden="true" />
                  <span>Possible Matches</span>
                </NavLink>
              </div>
            </>
          )}

          {/* SECTION FOR STAFF & ADMIN */}
          {(isStaff || isAdmin) && (
            <>
              <div className="nav-group">
                <span className="nav-group-label">Operations</span>
                <NavLink
                  to="/items"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/items" ? "page" : undefined}
                >
                  <Package size={17} aria-hidden="true" />
                  <span>Manage Items</span>
                </NavLink>

                <NavLink
                  to="/claims"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/claims" ? "page" : undefined}
                >
                  <ClipboardCheck size={17} aria-hidden="true" />
                  <span>Review Claims</span>
                </NavLink>

                <NavLink
                  to="/matches"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/matches" ? "page" : undefined}
                >
                  <GitCompare size={17} aria-hidden="true" />
                  <span>Matches Queue</span>
                </NavLink>

                <NavLink
                  to="/reports"
                  className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                  aria-current={location.pathname === "/reports" ? "page" : undefined}
                >
                  <BarChart3 size={17} aria-hidden="true" />
                  <span>Reports & Analytics</span>
                </NavLink>
              </div>
            </>
          )}

          {/* ADMIN ONLY SECTION */}
          {isAdmin && (
            <div className="nav-group">
              <span className="nav-group-label">Administration</span>
              <NavLink
                to="/users"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/users" ? "page" : undefined}
              >
                <Users size={17} aria-hidden="true" />
                <span>Manage Users</span>
              </NavLink>

              <NavLink
                to="/activity-logs"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/activity-logs" ? "page" : undefined}
              >
                <Activity size={17} aria-hidden="true" />
                <span>Audit Trail Logs</span>
              </NavLink>
            </div>
          )}

          {/* COMMON PREFERENCES SECTION */}
          <div className="nav-group">
            <span className="nav-group-label">Preferences</span>
            <NavLink
              to="/notifications"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              aria-current={location.pathname === "/notifications" ? "page" : undefined}
            >
              <Bell size={17} aria-hidden="true" />
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="nav-badge" aria-label={`${unreadCount} unread notifications`}>
                  {unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              aria-current={location.pathname === "/settings" ? "page" : undefined}
            >
              <Settings size={17} aria-hidden="true" />
              <span>Settings & PWD</span>
            </NavLink>
          </div>
        </nav>

        {/* Sidebar Footer with Clean User Identity Card */}
        <div className="sidebar-footer">
          <Link to="/profile" className="sidebar-user-tile" aria-label="Open your profile">
            <div className="sidebar-avatar" aria-hidden="true">
              {(user.first_name?.[0] || "U").toUpperCase()}
            </div>
            <div className="sidebar-user-meta">
              <span className="sidebar-name">
                {user.first_name ? `${user.first_name} ${user.last_name || ""}` : "Campus User"}
              </span>
              <span className="sidebar-role">{user.email || getRoleDisplayName()}</span>
            </div>
          </Link>
          <button
            type="button"
            className="sidebar-signout-btn"
            onClick={handleLogout}
            aria-label="Sign Out"
            title="Sign Out"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="app-main-wrapper">
        {/* REFINED MINIMALIST TOPBAR */}
        <header className="app-topbar" role="banner">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-toggle"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              aria-label="Toggle navigation drawer"
              aria-expanded={mobileNavOpen}
              aria-controls="app-navigation"
            >
              <Menu size={20} aria-hidden="true" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="topbar-breadcrumbs">
              <Link to="/dashboard" className="breadcrumb-root">FindIt</Link>
              <ChevronRight size={14} className="breadcrumb-sep" aria-hidden="true" />
              <span className="breadcrumb-current">{getPageTitle()}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Quick Action Button for instant report access */}
            {isStudent && (
              <Link to="/my-reports" className="topbar-quick-cta" title="Report Lost or Found Item">
                <Plus size={15} strokeWidth={2.5} aria-hidden="true" />
                <span>Report Item</span>
              </Link>
            )}

            {/* Compact Accessibility Widget Toggle */}
            <AccessibilityWidget variant="compact" />

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              className="topbar-icon-action"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={17} aria-hidden="true" /> : <Moon size={17} aria-hidden="true" />}
            </button>

            {/* Notification Bell */}
            <NavLink
              to="/notifications"
              className="topbar-icon-action"
              aria-label={`View notifications (${unreadCount} unread)`}
              title="Notifications"
            >
              <Bell size={17} aria-hidden="true" />
              {unreadCount > 0 && <span className="topbar-dot-badge" aria-hidden="true" />}
            </NavLink>

            {/* Avatar Pill */}
            <Link to="/profile" className="topbar-user-avatar-link" aria-label="Go to profile">
              <div className="topbar-mini-avatar" aria-hidden="true">
                {(user.first_name?.[0] || "U").toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* MAIN BODY OUTLET */}
        <main id="main-content" tabIndex={-1} role="main" className="app-content-body">
          <Outlet />
        </main>
      </div>

      {/* Floating Accessibility Widget */}
      <AccessibilityWidget variant="floating" />
    </div>
  );
};

export default AppLayout;
