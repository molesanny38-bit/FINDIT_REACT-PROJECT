import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

// Authentication configuration
const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Get all notifications
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await axios.get(
    `${API_URL}/notifications`,
    getAuthConfig()
  );

  return response.data;
};

// Get unread notification count
export const getUnreadCount = async (): Promise<number> => {
  const response = await axios.get(
    `${API_URL}/notifications/unread-count`,
    getAuthConfig()
  );

  return response.data.unread_count;
};

// Mark one notification as read
export const markAsRead = async (id: number) => {
  const response = await axios.patch(
    `${API_URL}/notifications/${id}/read`,
    {},
    getAuthConfig()
  );

  return response.data;
};

// Mark all notifications as read
export const markAllAsRead = async () => {
  const response = await axios.patch(
    `${API_URL}/notifications/read-all`,
    {},
    getAuthConfig()
  );

  return response.data;
};