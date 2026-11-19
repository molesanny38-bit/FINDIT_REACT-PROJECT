import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Package,
  ClipboardCheck,
  GitCompare,
  Bell,
  FileText,
  Users,
  Activity,
  Settings,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  BarChart3,
  ShieldCheck,
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
    if (isAdmin) return "Administrator";
    if (isStaff) return "Campus Staff";
    return "Student";
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

      {/* SIDEBAR NAVIGATION (Desktop + Mobile Drawer) */}
      <aside
        id="app-navigation"
        className={`app-sidebar ${mobileNavOpen ? "open" : ""}`}
        aria-label="Application navigation"
      >
        <div className="sidebar-brand-header">
          <div className="sidebar-brand">
            <div className="brand-logo-badge" aria-hidden="true">
              <ShieldCheck size={24} />
            </div>
            <div>
              <span className="brand-title">FindIt Campus</span>
              <span className="brand-badge-role">{getRoleDisplayName()}</span>
            </div>
          </div>
          <button
            type="button"
            className="mobile-close-btn"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        {/* User Card inside Sidebar */}
        <div className="sidebar-user-card">
          <div className="sidebar-avatar" aria-hidden="true">
            {(user.first_name?.[0] || "U").toUpperCase()}
          </div>
          <div className="sidebar-user-info">
            <strong className="sidebar-user-name">
              {user.first_name ? `${user.first_name} ${user.last_name || ""}` : "Campus User"}
            </strong>
            <span className="sidebar-user-email">{user.email || "Logged In"}</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="sidebar-nav" aria-label="Main Navigation">
          <span className="nav-section-title">Navigation Menu</span>

          {/* DASHBOARD LINK (All Roles) */}
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            aria-current={location.pathname === "/dashboard" ? "page" : undefined}
          >
            <LayoutDashboard size={19} aria-hidden="true" />
            <span>Dashboard</span>
          </NavLink>

          {/* STUDENT MENU */}
          {isStudent && (
            <>
              <NavLink
                to="/browse-lost-items"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/browse-lost-items" ? "page" : undefined}
              >
                <Search size={19} aria-hidden="true" />
                <span>Browse Lost Items</span>
              </NavLink>

              <NavLink
                to="/browse-found-items"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/browse-found-items" ? "page" : undefined}
              >
                <Package size={19} aria-hidden="true" />
                <span>Browse Found Items</span>
              </NavLink>

              <NavLink
                to="/my-reports"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/my-reports" ? "page" : undefined}
              >
                <FileText size={19} aria-hidden="true" />
                <span>My Reports</span>
              </NavLink>

              <NavLink
                to="/claims"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/claims" ? "page" : undefined}
              >
                <ClipboardCheck size={19} aria-hidden="true" />
                <span>My Claims</span>
              </NavLink>

              <NavLink
                to="/matches"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/matches" ? "page" : undefined}
              >
                <GitCompare size={19} aria-hidden="true" />
                <span>Possible Matches</span>
              </NavLink>
            </>
          )}

          {/* STAFF & ADMIN ITEMS */}
          {(isStaff || isAdmin) && (
            <>
              <NavLink
                to="/items"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/items" ? "page" : undefined}
              >
                <Package size={19} aria-hidden="true" />
                <span>Manage Items</span>
              </NavLink>

              <NavLink
                to="/claims"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/claims" ? "page" : undefined}
              >
                <ClipboardCheck size={19} aria-hidden="true" />
                <span>Manage Claims</span>
              </NavLink>

              <NavLink
                to="/matches"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/matches" ? "page" : undefined}
              >
                <GitCompare size={19} aria-hidden="true" />
                <span>Possible Matches</span>
              </NavLink>

              <NavLink
                to="/reports"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/reports" ? "page" : undefined}
              >
                <BarChart3 size={19} aria-hidden="true" />
                <span>Reports & Analytics</span>
              </NavLink>
            </>
          )}

          {/* ADMIN EXCLUSIVES */}
          {isAdmin && (
            <>
              <NavLink
                to="/users"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/users" ? "page" : undefined}
              >
                <Users size={19} aria-hidden="true" />
                <span>Manage Users</span>
              </NavLink>

              <NavLink
                to="/activity-logs"
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
                aria-current={location.pathname === "/activity-logs" ? "page" : undefined}
              >
                <Activity size={19} aria-hidden="true" />
                <span>Activity Logs</span>
              </NavLink>
            </>
          )}

          {/* COMMON ACCOUNT & SETTINGS */}
          <span className="nav-section-title">Personal</span>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            aria-current={location.pathname === "/notifications" ? "page" : undefined}
          >
            <Bell size={19} aria-hidden="true" />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="nav-badge" aria-label={`${unreadCount} unread notifications`}>
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            aria-current={location.pathname === "/profile" ? "page" : undefined}
          >
            <UserIcon size={19} aria-hidden="true" />
            <span>My Profile</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            aria-current={location.pathname === "/settings" ? "page" : undefined}
          >
            <Settings size={19} aria-hidden="true" />
            <span>Settings</span>
          </NavLink>
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="sidebar-footer">
          <button
            type="button"
            className="sidebar-logout-btn"
            onClick={handleLogout}
            aria-label="Log out of FindIt Campus"
          >
            <LogOut size={18} aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="app-main-wrapper">
        {/* TOPBAR HEADER */}
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
              <Menu size={22} aria-hidden="true" />
            </button>

            <div className="topbar-branding">
              <span className="topbar-title">FindIt Campus</span>
              <span className="topbar-role-tag">{getRoleDisplayName()}</span>
            </div>
          </div>

          <div className="topbar-right">
            {/* Quick Accessibility Button */}
            <AccessibilityWidget variant="compact" />

            {/* Quick Dark/Light Theme Toggle */}
            <button
              type="button"
              className="topbar-icon-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
            </button>

            {/* Notifications Button */}
            <NavLink
              to="/notifications"
              className="topbar-icon-btn"
              aria-label={`View notifications (${unreadCount} unread)`}
              title="Notifications"
            >
              <Bell size={20} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="topbar-badge" aria-hidden="true">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>

            {/* User Profile Pill */}
            <NavLink to="/profile" className="topbar-user-pill" aria-label="Go to profile">
              <div className="topbar-user-avatar" aria-hidden="true">
                {(user.first_name?.[0] || "U").toUpperCase()}
              </div>
              <span className="topbar-user-name">
                {user.first_name || "Account"}
              </span>
            </NavLink>
          </div>
        </header>

        {/* MAIN OUTLET CONTAINER */}
        <main id="main-content" tabIndex={-1} role="main" className="app-content-body">
          <Outlet />
        </main>
      </div>

      {/* FLOATING ACCESSIBILITY WIDGET FOR EASY PWD ACCESS ACROSS PAGES */}
      <AccessibilityWidget variant="floating" />
    </div>
  );
};

export default AppLayout;
