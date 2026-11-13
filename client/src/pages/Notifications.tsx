import { useEffect, useState } from "react";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "../services/notificationService";

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Calculate unread notifications
  const unreadCount = notifications.filter(
    (notification) => notification.is_read === 0
  ).length;

  // Load notifications
  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getNotifications();

      setNotifications(data);
    } catch (err) {
      console.error("Failed to load notifications:", err);

      setError("Failed to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  // Format notification date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  // Mark one notification as read
  const handleMarkAsRead = async (id: number) => {
    try {
      setError("");
      setMessage("");

      await markAsRead(id);

      setMessage("Notification marked as read.");

      await loadNotifications();
    } catch (err) {
      console.error("Failed to update notification:", err);

      setError("Failed to update notification.");
    }
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      setError("");
      setMessage("");

      await markAllAsRead();

      setMessage("All notifications marked as read.");

      await loadNotifications();
    } catch (err) {
      console.error("Failed to update notifications:", err);

      setError("Failed to update notifications.");
    }
  };

  return (
    <div className="notifications-page">

      {/* Page Header */}
      <div className="notifications-header">
        <div>
          <h1>Notifications</h1>
          <p>Stay updated with your lost and found item claims.</p>
        </div>

        <button
          className="refresh-button"
          onClick={loadNotifications}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* Notification Summary */}
      <div className="notification-summary">

        <div className="notification-card">
          <h3>Total Notifications</h3>
          <h2>{notifications.length}</h2>
        </div>

        <div className="notification-card">
          <h3>Unread Notifications</h3>
          <h2>{unreadCount}</h2>
        </div>

      </div>

      {/* Messages */}
      {message && (
        <p className="notification-success">
          {message}
        </p>
      )}

      {error && (
        <p className="notification-error">
          {error}
        </p>
      )}

      {/* Notification List */}
      <div className="notification-list-container">

        <div className="notification-list-header">
          <h2>My Notifications</h2>

          <button
            className="mark-all-button"
            onClick={handleMarkAllAsRead}
            disabled={loading || unreadCount === 0}
          >
            Mark All as Read
          </button>
        </div>

        {loading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="empty-notifications">
            You don't have any notifications yet.
          </p>
        ) : (

          <div className="notification-list">

            {notifications.map((notification) => (

              <div
                key={notification.notification_id}
                className={`notification-item ${
                  notification.is_read === 0
                    ? "unread"
                    : "read"
                }`}
              >

                <div className="notification-content">

                  <div className="notification-title">
                    <h3>{notification.title}</h3>

                    {notification.is_read === 0 && (
                      <span className="unread-badge">
                        NEW
                      </span>
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <small>
                    {formatDate(notification.created_at)}
                  </small>

                </div>

                {notification.is_read === 0 && (

                  <button
                    className="mark-read-button"
                    onClick={() =>
                      handleMarkAsRead(notification.notification_id)
                    }
                  >
                    Mark as Read
                  </button>

                )}

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  );
}

export default Notifications;