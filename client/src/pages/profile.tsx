
import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import {
    User,
    Mail,
    Shield,
    Calendar,
    Save,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
} from "lucide-react";
import "./profile.css";

interface UserProfile {
    user_id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    student_staff_id: string | null;
    role: "admin" | "staff" | "student";
    status: "active" | "inactive" | "suspended";
    created_at: string;
}

function Profile() {
    const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:5000/api";

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const token = localStorage.getItem("token");

    const authHeaders = {
        Authorization: `Bearer ${token}`,
    };

    // Load profile information
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/users/me`,
                { headers: authHeaders }
            );

            const user: UserProfile = response.data.user;

            setProfile(user);

            setFormData({
                first_name: user.first_name || "",
                middle_name: user.middle_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
            });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Failed to load profile information."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // Handle profile input changes
    const handleProfileChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Update profile
    const handleUpdateProfile = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");

            const response = await axios.put(
                `${API_URL}/users/me`,
                formData,
                { headers: authHeaders }
            );

            setMessage(response.data.message || "Profile updated successfully.");

            await fetchProfile();

            // Keep the local user information updated
            const storedUser = localStorage.getItem("user");

            if (storedUser) {
                const updatedUser = JSON.parse(storedUser);

                localStorage.setItem(
                    "user",
                    JSON.stringify({
                        ...updatedUser,
                        first_name: formData.first_name,
                        last_name: formData.last_name,
                        email: formData.email,
                    })
                );
            }
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Failed to update profile."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Handle password input changes
    const handlePasswordChange = (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const { name, value } = e.target;

        setPasswordData((previous) => ({
            ...previous,
            [name]: value,
        }));
    };

    // Change password
    const handleChangePassword = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New password and confirmation password do not match.");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setError("New password must be at least 8 characters.");
            return;
        }

        try {
            setChangingPassword(true);

            const response = await axios.patch(
                `${API_URL}/users/me/password`,
                {
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                },
                { headers: authHeaders }
            );

            setMessage(response.data.message || "Password changed successfully.");

            setPasswordData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setError(
                    err.response?.data?.message ||
                    "Failed to change password."
                );
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                <RefreshCw className="loading-icon" />
                <p>Loading profile...</p>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-container">
                <p className="profile-error">
                    {error || "Unable to load your profile."}
                </p>
                <button onClick={fetchProfile}>Try Again</button>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div>
                    <h1>My Profile</h1>
                    <p>View and manage your personal account information.</p>
                </div>
            </div>

            {message && (
                <div className="profile-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="profile-error">
                    {error}
                </div>
            )}

            <div className="profile-layout">

                {/* Profile Information */}
                <section className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-icon">
                            <User size={25} />
                        </div>

                        <div>
                            <h2>Personal Information</h2>
                            <p>Update your account details.</p>
                        </div>
                    </div>

                    <form onSubmit={handleUpdateProfile}>
                        <div className="profile-form-grid">

                            <div className="profile-field">
                                <label>First Name</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="profile-field">
                                <label>Middle Name</label>
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name}
                                    onChange={handleProfileChange}
                                />
                            </div>

                            <div className="profile-field">
                                <label>Last Name</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                            <div className="profile-field">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleProfileChange}
                                    required
                                />
                            </div>

                        </div>

                        <button
                            type="submit"
                            className="profile-save-button"
                            disabled={saving}
                        >
                            <Save size={17} />
                            {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </form>
                </section>

                {/* Account Information */}
                <section className="profile-card">
                    <div className="profile-card-header">
                        <div className="profile-icon">
                            <Shield size={25} />
                        </div>

                        <div>
                            <h2>Account Information</h2>
                            <p>Your registered account details.</p>
                        </div>
                    </div>

                    <div className="account-information">
                        <div className="account-info-row">
                            <User size={18} />
                            <div>
                                <span>Account ID</span>
                                <strong>#{profile.user_id}</strong>
                            </div>
                        </div>

                        <div className="account-info-row">
                            <Mail size={18} />
                            <div>
                                <span>Student/Staff ID</span>
                                <strong>
                                    {profile.student_staff_id || "Not provided"}
                                </strong>
                            </div>
                        </div>

                        <div className="account-info-row">
                            <Shield size={18} />
                            <div>
                                <span>Role</span>
                                <strong className="role-badge">
                                    {profile.role.toUpperCase()}
                                </strong>
                            </div>
                        </div>

                        <div className="account-info-row">
                            <Shield size={18} />
                            <div>
                                <span>Account Status</span>
                                <strong className={`status-badge ${profile.status}`}>
                                    {profile.status.toUpperCase()}
                                </strong>
                            </div>
                        </div>

                        <div className="account-info-row">
                            <Calendar size={18} />
                            <div>
                                <span>Registered On</span>
                                <strong>
                                    {new Date(profile.created_at).toLocaleDateString()}
                                </strong>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Change Password */}
                <section className="profile-card password-card">
                    <div className="profile-card-header">
                        <div className="profile-icon">
                            <Lock size={25} />
                        </div>

                        <div>
                            <h2>Change Password</h2>
                            <p>Keep your account secure.</p>
                        </div>
                    </div>

                    <form onSubmit={handleChangePassword}>
                        <div className="profile-field password-field">
                            <label>Current Password</label>

                            <div className="password-input-wrapper">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowCurrentPassword(!showCurrentPassword)
                                    }
                                    aria-label="Toggle current password visibility"
                                >
                                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="profile-field password-field">
                            <label>New Password</label>

                            <div className="password-input-wrapper">
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    minLength={8}
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword(!showNewPassword)
                                    }
                                    aria-label="Toggle new password visibility"
                                >
                                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="profile-field">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                minLength={8}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="profile-save-button"
                            disabled={changingPassword}
                        >
                            <Lock size={17} />
                            {changingPassword ? "Updating..." : "Change Password"}
                        </button>
                    </form>
                </section>

            </div>
        </div>
    );
}

export default Profile;
