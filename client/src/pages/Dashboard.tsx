import { useNavigate, NavLink } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>FindIt Campus</h2>

        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/items">Items</NavLink>
          <NavLink to="/lost-reports">Lost Reports</NavLink>
          <NavLink to="/claims">Claims</NavLink>
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

        <section className="dashboard-cards">
          <div className="card">
            <h3>0</h3>
            <p>Total Items</p>
          </div>

          <div className="card">
            <h3>0</h3>
            <p>Lost Reports</p>
          </div>

          <div className="card">
            <h3>0</h3>
            <p>Pending Claims</p>
          </div>

          <div className="card">
            <h3>0</h3>
            <p>Registered Users</p>
          </div>
        </section>

        <section className="dashboard-content">
          <h2>Recent Activities</h2>
          <p>No activities available yet.</p>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;