import { useState } from "react";
import { registerUser } from "../services/authService";

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

    const handleChange = (
        event: React.ChangeEvent<HTMLInputElement>
    ) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleRegister = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

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
        }
    };

    return (
        <div>
            <h1>FindIt Campus</h1>
            <h2>Create Student Account</h2>

            <form onSubmit={handleRegister}>
                <input
                    name="first_name"
                    placeholder="First Name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                />

                <input
                    name="middle_name"
                    placeholder="Middle Name (Optional)"
                    value={formData.middle_name}
                    onChange={handleChange}
                />

                <input
                    name="last_name"
                    placeholder="Last Name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                />

                <input
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    required
                />

                <input
                    name="student_staff_id"
                    placeholder="Student ID (Optional)"
                    value={formData.student_staff_id}
                    onChange={handleChange}
                />

                <button type="submit">
                    Register
                </button>
            </form>

            {message && <p>{message}</p>}
            <p>
               Already have an account?{" "}
                <a href="/login">Login here</a>
            </p>
        </div>
    );
}

export default Register;