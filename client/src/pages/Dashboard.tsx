import { useEffect, useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";

interface DashboardStats {
  totalUsers: number;
  totalItems: number;
  lostItems: number;
  foundItems: number;
  pendingClaims: number;
  approvedClaims: number;
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

  const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("token");

      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [statsResponse, notificationResponse] = await Promise.all([
          fetch(`${API_URL}/dashboard/stats`, { headers }),
          fetch(`${API_URL}/notifications/unread-count`, { headers }),
        ]);

        if (!statsResponse.ok || !notificationResponse.ok) {
          throw new Error("Failed to load dashboard information.");
        }

        const statsData = await statsResponse.json();
        const notificationData = await notificationResponse.json();

        setStats(statsData.stats);

        // Adjust this property if your unread-count controller
        // uses a different response format.
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
  }, [API_URL]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>FindIt Campus</h2>

        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/items">Items</NavLink>
          <NavLink to="/lost-reports">Lost Reports</NavLink>
          <NavLink to="/claims">Claims</NavLink>
          <NavLink to="/matches">Possible Matches</NavLink>
          <NavLink to="/notifications">
            Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">
                {unreadCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/users">Users</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>

        <button onClick={handleLogout}>Logout</button>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h2>Dashboard</h2>
          <p>Welcome to FindIt Campus!</p>
        </header>

        {loading ? (
          <p>Loading dashboard statistics...</p>
        ) : (
          <>
            <section className="dashboard-cards">
              <div className="card">
                <h3>{stats.totalItems}</h3>
                <p>Total Items</p>
              </div>

              <div className="card">
                <h3>{stats.lostItems}</h3>
                <p>Lost Reports</p>
              </div>

              <div className="card">
                <h3>{stats.foundItems}</h3>
                <p>Found Items</p>
              </div>

              <div className="card">
                <h3>{stats.pendingClaims}</h3>
                <p>Pending Claims</p>
              </div>

              <div className="card">
                <h3>{stats.approvedClaims}</h3>
                <p>Approved Claims</p>
              </div>

              <div className="card">
                <h3>{stats.totalUsers}</h3>
                <p>Registered Users</p>
              </div>
            </section>

            <section className="dashboard-content">
              <h2>Dashboard Overview</h2>
              <p>
                There are currently {stats.totalItems} registered
                items and {stats.pendingClaims} pending claims.
              </p>
              <p>
                You have {unreadCount} unread notifications.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default Dashboard;