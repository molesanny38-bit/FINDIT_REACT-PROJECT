import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { registerUser } from "../services/authService";
import { AccessibilityWidget } from "../components/AccessibilityWidget";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import "./Register.css";

function Register() {
    const [formData, setFormData] = useState({
        first_name: "",
        middle_name: "",
        last_name: "",
        email: "",
        password: "",
        student_staff_id: ""
    });

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setMessage("");
        setIsLoading(true);

        try {
            const response = await registerUser(formData);

            setMessage(response.message);

            if (response.success) {
                setFormData({
                    first_name: "",
                    middle_name: "",
                    last_name: "",
                    email: "",
                    password: "",
                    student_staff_id: ""
                });
            }
        } catch {
            setMessage("Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <a href="#register-main-form" className="skip-link">Skip to registration form</a>

            {/* Background Decorations */}
            <div className="register-background-shape register-shape-one" aria-hidden="true"></div>
            <div className="register-background-shape register-shape-two" aria-hidden="true"></div>

            {/* Registration Card */}
            <div className="register-card">

                {/* Branding Section */}
                <div className="register-brand-section">
                    <div className="register-brand-content">

                        <div className="register-logo" aria-hidden="true">
                            <ShieldCheck size={28} />
                        </div>

                        <h1>FindIt Campus</h1>

                        <p className="register-brand-description">
                            Your campus lost and found companion.
                            Create an account and help reunite lost
                            belongings with their rightful owners.
                        </p>

                        <div className="register-feature">
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <p>Report lost and found belongings</p>
                        </div>

                        <div className="register-feature">
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <p>Connect with the campus community</p>
                        </div>

                        <div className="register-feature">
                            <CheckCircle2 size={18} aria-hidden="true" />
                            <p>Track your reports and claims</p>
                        </div>
                    </div>

                    <p className="register-brand-footer">
                        Making campus belongings easier to find.
                    </p>
                </div>

                {/* Registration Form Section */}
                <div className="register-form-section">
                    <div className="register-form-content">

                        <div className="register-mobile-logo" aria-hidden="true">
                            F
                        </div>

                        <span className="register-welcome">
                            GET STARTED
                        </span>

                        <h2>Create Your Account</h2>

                        <p className="register-subtitle">
                            Fill in your information to join FindIt Campus.
                        </p>

                        <form id="register-main-form" onSubmit={handleRegister}>

                            {/* Name Fields */}
                            <div className="register-form-row">

                                <div className="register-input-group">
                                    <label htmlFor="first_name">
                                        First Name
                                    </label>

                                    <input
                                        id="first_name"
                                        name="first_name"
                                        placeholder="Enter first name"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="register-input-group">
                                    <label htmlFor="middle_name">
                                        Middle Name <span>(Optional)</span>
                                    </label>

                                    <input
                                        id="middle_name"
                                        name="middle_name"
                                        placeholder="Enter middle name"
                                        value={formData.middle_name}
                                        onChange={handleChange}
                                    />
                                </div>

                            </div>

                            <div className="register-input-group">
                                <label htmlFor="last_name">
                                    Last Name
                                </label>

                                <input
                                    id="last_name"
                                    name="last_name"
                                    placeholder="Enter last name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="register-input-group">
                                <label htmlFor="email">
                                    Email Address
                                </label>

                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    placeholder="Enter your email address"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="register-input-group">
                                <label htmlFor="password">
                                    Password
                                </label>

                                <input
                                    id="password"
                                    type="password"
                                    name="password"
                                    placeholder="Create a password (at least 8 characters)"
                                    value={formData.password}
                                    onChange={handleChange}
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div className="register-input-group">
                                <label htmlFor="student_staff_id">
                                    Student / Staff ID <span>(Optional)</span>
                                </label>

                                <input
                                    id="student_staff_id"
                                    name="student_staff_id"
                                    placeholder="Enter your school ID"
                                    value={formData.student_staff_id}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Response Message */}
                            {message && (
                                <div
                                    className={`register-message ${
                                        message.toLowerCase().includes("success")
                                            ? "register-success"
                                            : "register-error"
                                    }`}
                                    role="status"
                                    aria-live="polite"
                                >
                                    {message}
                                </div>
                            )}

                            {/* Submit Button */}
                            <button
                                type="submit"
                                className="register-submit-button"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Account..." : "Create Account"}
                            </button>

                        </form>

                        {/* Login Link */}
                        <div className="register-login">
                            <p>
                                Already have an account?{" "}
                                <Link to="/login">Sign in</Link>
                            </p>
                        </div>

                        <p className="register-copyright">
                            © {new Date().getFullYear()} FindIt Campus. All rights reserved.
                        </p>

                    </div>
                </div>

            </div>

            {/* Floating Accessibility Widget */}
            <AccessibilityWidget variant="floating" />
        </div>
    );
}

export default Register;
