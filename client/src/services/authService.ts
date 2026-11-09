import axios from "axios";
import type {
    LoginData,
    RegisterData,
    AuthResponse
} from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json"
    }
});

// STUDENT REGISTRATION
export const registerUser = async (
    data: RegisterData
): Promise<AuthResponse> => {
    const response = await api.post(
        "/auth/register",
        data
    );

    return response.data;
};

// USER LOGIN
export const loginUser = async (
    data: LoginData
): Promise<AuthResponse> => {
    const response = await api.post(
        "/auth/login",
        data
    );

    return response.data;
};