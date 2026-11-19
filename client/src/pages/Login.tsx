import { useState } from "react";
import { Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import type { User } from "../types/auth";
import { Eye, EyeOff, Mail, Lock, Search, ShieldCheck } from "lucide-react";
import { AccessibilityWidget } from "../components/AccessibilityWidget";
import "./Login.css";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
            setLoading(true);
            setMessage("");

            const response = await loginUser({
                email,
                password
            });

            if (response.success && response.token && response.user) {
                localStorage.setItem("token", response.token);

                localStorage.setItem(
                    "user",
                    JSON.stringify(response.user as User)
                );

                window.location.href = "/dashboard";
            } else {
                setMessage("Unable to log in. Please check your credentials.");
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <a href="#login-main-form" className="skip-link">Skip to login form</a>

            <div className="login-background-shape shape-one" aria-hidden="true"></div>
            <div className="login-background-shape shape-two" aria-hidden="true"></div>

            <div className="login-card">

                {/* LEFT BRANDING SECTION */}
                <div className="login-brand-section">

                    <div className="login-brand-content">

                        <div className="login-logo" aria-hidden="true">
                            <Search size={30} strokeWidth={2.5} />
                        </div>

                        <h1>FindIt Campus</h1>

                        <p className="brand-description">
                            Making lost and found management easier
                            for everyone in our campus community.
                        </p>

                        <div className="login-feature">
                            <ShieldCheck size={20} className="login-feature-icon" aria-hidden="true" />
                            <span>Official Campus Retrieval System</span>
                        </div>

                    </div>

                    <p className="login-brand-footer">
                        Secure campus portal for students, faculty, and administrative staff.
                    </p>

                </div>

                {/* RIGHT FORM SECTION */}
                <div className="login-form-section">

                    <div className="login-form-container">

                        <div className="login-header">
                            <h2>Welcome Back</h2>
                            <p>Enter your campus credentials to access your account.</p>
                        </div>

                        {message && (
                            <div
                                className="login-alert"
                                role="alert"
                                aria-live="polite"
                            >
                                <p>{message}</p>
                            </div>
                        )}

                        <form id="login-main-form" onSubmit={handleLogin} className="login-form" noValidate>

                            <div className="form-group">

                                <label htmlFor="login-email">
                                    Email Address
                                </label>

                                <div className="input-container">
                                    <Mail className="input-icon" size={19} aria-hidden="true" />

                                    <input
                                        id="login-email"
                                        type="email"
                                        placeholder="student@university.edu"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        autoComplete="email"
                                        required
                                    />
                                </div>

                            </div>

                            <div className="form-group">

                                <label htmlFor="login-password">
                                    Password
                                </label>

                                <div className="input-container">
                                    <Lock className="input-icon" size={19} aria-hidden="true" />

                                    <input
                                        id="login-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        autoComplete="current-password"
                                        required
                                    />

                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                        aria-pressed={showPassword}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={19} aria-hidden="true" />
                                        ) : (
                                            <Eye size={19} aria-hidden="true" />
                                        )}
                                    </button>
                                </div>

                            </div>

                            <button
                                type="submit"
                                className="login-submit-button"
                                disabled={loading}
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>

                        </form>

                        <div className="login-register">
                            <p>
                                Don't have an account?{" "}
                                <Link to="/register">Create an account</Link>
                            </p>
                        </div>

                    </div>

                    <p className="login-copyright">
                        © {new Date().getFullYear()} FindIt Campus. All rights reserved.
                    </p>

                </div>

            </div>

            {/* Accessible PWD Floating Button on Login Screen */}
            <AccessibilityWidget variant="floating" />
        </div>
    );
}

export default Login;
