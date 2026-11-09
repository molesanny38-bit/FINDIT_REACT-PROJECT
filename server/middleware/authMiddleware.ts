import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface AuthRequest extends Request {
    user?: {
        user_id: number;
        role: string;
    };
}

// Verify JWT
export const authenticateToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;

    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access denied. Please log in."
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({
            success: false,
            message: "Authentication configuration error."
        });
    }

    try {
        const decoded = jwt.verify(token, secret) as {
            user_id: number;
            role: string;
        };

        req.user = decoded;

        next();

    } catch {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token."
        });
    }
};

// Check user role
export const authorizeRoles = (...roles: string[]) => {
    return (
        req: AuthRequest,
        res: Response,
        next: NextFunction
    ) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this resource."
            });
        }

        next();
    };
};