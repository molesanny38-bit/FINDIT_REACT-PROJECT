const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface User {
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

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getUsers = async (): Promise<User[]> => {
  const response = await fetch(`${API_URL}/users`, {
    headers: getHeaders(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to load users.");
  }

  return data.users;
};

export const updateUserRole = async (
  userId: number,
  role: User["role"]
) => {
  const response = await fetch(`${API_URL}/users/${userId}/role`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ role }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update role.");
  }

  return data;
};

export const updateUserStatus = async (
  userId: number,
  status: User["status"]
) => {
  const response = await fetch(`${API_URL}/users/${userId}/status`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update status.");
  }

  return data;
};