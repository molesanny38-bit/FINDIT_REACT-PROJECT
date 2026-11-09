import { useState } from "react";
import { loginUser } from "../services/authService";
import type { User } from "../types/auth";

function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");

    const handleLogin = async (
        event: React.FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        try {
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
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                setMessage(error.message);
            } else {
                setMessage("Login failed. Please try again.");
            }
        }
    };

    return (
        <div>
            <h1>FindIt Campus</h1>
            <h2>Login</h2>

            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />

                <button type="submit">
                    Login
                </button>
            </form>

            {message && <p>{message}</p>}
            <p>
              Don't have an account?{" "}
              <a href="/register">Create an account</a>
            </p>
        </div>
    );
}

export default Login;