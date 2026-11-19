import { useEffect, useState } from "react";
import {
    getUsers,
    updateUserRole,
    updateUserStatus,
  } from "../services/usersService";
import type { User } from "../services/usersService";

import {
    Users as UsersIcon,
    GraduationCap,
    BriefcaseBusiness,
    UserX,
    Search,
    RefreshCw,
    ShieldCheck,
} from "lucide-react";

import "./Users.css";

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

        const searchText = search.toLowerCase();

        return (
            fullName.includes(searchText) ||
            user.email.toLowerCase().includes(searchText) ||
            String(user.user_id).includes(searchText)
        );
    });

    const totalStudents = users.filter(
        (user) => user.role === "student"
    ).length;

    const totalStaff = users.filter(
        (user) => user.role === "staff"
    ).length;

    
    const totalSuspended = users.filter(
        (user) => user.status === "suspended"
    ).length;

    const formatDate = (date: string) => {
        if (!date) return "N/A";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "N/A";

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="users-page">

            {/* HEADER */}

            <div className="users-header">
                <div>
                    <h1>User Management</h1>
                    <p>
                        Manage registered students, staff, and administrators.
                    </p>
                </div>

                <button
                    className="users-refresh-btn"
                    onClick={loadUsers}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh Users
                </button>
            </div>

            {/* SUMMARY CARDS */}

            <div className="users-summary">

                <div className="user-summary-card">
                    <div className="user-summary-icon">
                        <UsersIcon size={21} />
                    </div>
                    <div>
                        <p>Total Users</p>
                        <h3>{users.length}</h3>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="user-summary-icon student-icon">
                        <GraduationCap size={21} />
                    </div>
                    <div>
                        <p>Students</p>
                        <h3>{totalStudents}</h3>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="user-summary-icon staff-icon">
                        <BriefcaseBusiness size={21} />
                    </div>
                    <div>
                        <p>Staff</p>
                        <h3>{totalStaff}</h3>
                    </div>
                </div>

                <div className="user-summary-card">
                    <div className="user-summary-icon suspended-icon">
                        <UserX size={21} />
                    </div>
                    <div>
                        <p>Suspended</p>
                        <h3>{totalSuspended}</h3>
                    </div>
                </div>

            </div>

            {/* USERS TABLE */}

            <div className="users-table-container">

                <div className="users-toolbar">
                    <div>
                        <h2>Registered Users</h2>
                        <span>{filteredUsers.length} users found</span>
                    </div>

                    <div className="users-search">
                        <Search size={18} />

                        <input
                            type="text"
                            placeholder="Search name, email, or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* SUCCESS AND ERROR MESSAGES */}

                {message && (
                    <div className="users-message success-message">
                        <ShieldCheck size={17} />
                        {message}
                    </div>
                )}

                {error && (
                    <div className="users-message error-message">
                        {error}
                    </div>
                )}

                {/* LOADING */}

                {loading ? (
                    <div className="users-empty-state">
                        <RefreshCw className="users-loading-icon" size={25} />
                        <p>Loading users...</p>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="users-empty-state">
                        <UsersIcon size={35} />
                        <h3>No users found</h3>
                        <p>
                            No registered users match your search.
                        </p>
                    </div>
                ) : (

                    /* TABLE */

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

                                        <td>
                                            <span className="user-id">
                                                #{user.user_id}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="user-name-cell">
                                                <div className="user-avatar">
                                                    {user.first_name.charAt(0).toUpperCase()}
                                                </div>

                                                <strong>
                                                    {user.first_name}{" "}
                                                    {user.middle_name
                                                        ? `${user.middle_name} `
                                                        : ""}
                                                    {user.last_name}
                                                </strong>
                                            </div>
                                        </td>

                                        <td>{user.email}</td>

                                        <td>
                                            {user.student_staff_id || "N/A"}
                                        </td>

                                        <td>
                                            <select
                                                className={`user-role-select ${user.role}`}
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
                                                className={`user-status-select ${user.status}`}
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
                                            {formatDate(user.created_at)}
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