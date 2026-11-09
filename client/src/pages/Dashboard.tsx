function Dashboard() {
    const user = JSON.parse(
        localStorage.getItem("user") || "null"
    );

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        window.location.href = "/login";
    };

    return (
        <div>
            <h1>FindIt Campus Dashboard</h1>

            <h2>
                Welcome, {user?.first_name || "User"}!
            </h2>

            <p>Your role: {user?.role}</p>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default Dashboard;