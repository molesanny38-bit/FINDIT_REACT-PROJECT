export interface User {
    user_id: number;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    email: string;
    role: "admin" | "staff" | "student";
}

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    first_name: string;
    middle_name?: string;
    last_name: string;
    email: string;
    password: string;
    student_staff_id?: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    token?: string;
    user?: User;
}