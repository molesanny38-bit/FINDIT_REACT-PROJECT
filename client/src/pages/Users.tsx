import { useEffect, useState } from "react";
import {
  getUsers,
  updateUserRole,
  updateUserStatus,
} from "../services/usersService";


import type { User } from "../services/usersService";

function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load users."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (
    userId: number,
    role: User["role"]
  ) => {
    try {
      setError("");
      setMessage("");

      await updateUserRole(userId, role);

      setMessage("User role updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update role."
      );
    }
  };

  const handleStatusChange = async (
    userId: number,
    status: User["status"]
  ) => {
    try {
      setError("");
      setMessage("");

      await updateUserStatus(userId, status);

      setMessage("User status updated successfully.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update status."
      );
    }
  };

  const filteredUsers = users.filter((user) => {
    const fullName =
      `${user.first_name} ${user.middle_name || ""} ${user.last_name}`
        .toLowerCase();

    return (
      fullName.includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      String(user.user_id).includes(search)
    );
  });

  return (
    <div className="users-page">
      <div className="users-header">
        <div>
          <h1>User Management</h1>
          <p>Manage registered students, staff, and administrators.</p>
        </div>

        <button onClick={loadUsers}>Refresh Users</button>
      </div>

      <div className="users-summary">
        <div className="user-summary-card">
          <h3>{users.length}</h3>
          <p>Total Users</p>
        </div>

        <div className="user-summary-card">
          <h3>{users.filter((u) => u.role === "student").length}</h3>
          <p>Students</p>
        </div>

        <div className="user-summary-card">
          <h3>{users.filter((u) => u.role === "staff").length}</h3>
          <p>Staff</p>
        </div>

        <div className="user-summary-card">
          <h3>{users.filter((u) => u.status === "suspended").length}</h3>
          <p>Suspended</p>
        </div>
      </div>

      <div className="users-table-container">
        <div className="users-toolbar">
          <h2>Registered Users</h2>

          <input
            type="text"
            placeholder="Search name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {message && <p className="success-message">{message}</p>}
        {error && <p className="error-message">{error}</p>}

        {loading ? (
          <p>Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div className="table-responsive">
            <table className="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Student/Staff ID</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date Registered</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.user_id}</td>

                    <td>
                      {user.first_name}{" "}
                      {user.middle_name
                        ? `${user.middle_name} `
                        : ""}
                      {user.last_name}
                    </td>

                    <td>{user.email}</td>

                    <td>{user.student_staff_id || "N/A"}</td>

                    <td>
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user.user_id,
                            e.target.value as User["role"]
                          )
                        }
                      >
                        <option value="student">Student</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>

                    <td>
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleStatusChange(
                            user.user_id,
                            e.target.value as User["status"]
                          )
                        }
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>

                    <td>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Users;