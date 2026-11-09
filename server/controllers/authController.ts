import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db";

// STUDENT REGISTRATION
export const register = async (req: Request, res: Response) => {
    try {
        const {
            first_name,
            middle_name,
            last_name,
            email,
            password,
            student_staff_id
        } = req.body;

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                success: false,
                message: "Password must contain at least 8 characters."
            });
        }

        // Check if email already exists
        const [existingUsers] = await db.execute(
            "SELECT user_id FROM users WHERE email = ?",
            [email]
        );

        if ((existingUsers as any[]).length > 0) {
            return res.status(409).json({
                success: false,
                message: "Email is already registered."
            });
        }

        // Check student/staff ID if provided
        if (student_staff_id) {
            const [existingIds] = await db.execute(
                "SELECT user_id FROM users WHERE student_staff_id = ?",
                [student_staff_id]
            );

            if ((existingIds as any[]).length > 0) {
                return res.status(409).json({
                    success: false,
                    message: "Student or staff ID is already registered."
                });
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Always register as student
        await db.execute(
            `INSERT INTO users
            (first_name, middle_name, last_name, email,
             password, student_staff_id, role, status)
            VALUES (?, ?, ?, ?, ?, ?, 'student', 'active')`,
            [
                first_name,
                middle_name || null,
                last_name,
                email,
                hashedPassword,
                student_staff_id || null
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Student account created successfully."
        });

    } catch (error) {
        console.error("Registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed."
        });
    }
};

// USER LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required."
            });
        }

        const [rows] = await db.execute(
            `SELECT user_id, first_name, middle_name, last_name,
                    email, password, role, status
             FROM users
             WHERE email = ?`,
            [email]
        );

        const users = rows as any[];

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const user = users[0];

        if (user.status !== "active") {
            return res.status(403).json({
                success: false,
                message: "Your account is not active."
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password."
            });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new Error("JWT_SECRET is not configured.");
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            secret,
            { expiresIn: "1d" }
        );

        return res.status(200).json({
            success: true,
            message: "Login successful.",
            token,
            user: {
                user_id: user.user_id,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed."
        });
    }
};