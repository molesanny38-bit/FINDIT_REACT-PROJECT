import { useEffect, useState } from "react";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  RefreshCw,
  Inbox,
  Clock,
} from "lucide-react";

import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  type Notification,
} from "../services/notificationService";

import "./Notifications.css";

function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
    const unreadCount = notifications.filter(
    (notification) => notification.is_read === 0
  ).length;

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
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
};
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

      {/* PAGE HEADER */}
      <div className="notifications-header">
        <div className="notifications-heading">
          <div className="notifications-heading-icon">
            <Bell size={25} />
          </div>

          <div>
            <h1>Notifications</h1>
            <p>Stay updated with your lost and found item claims.</p>
          </div>
        </div>

        <button
          className="refresh-button"
          onClick={loadNotifications}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "refresh-spinning" : ""} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="notification-summary">

        <div className="notification-card total-card">
          <div className="notification-card-icon">
            <Bell size={21} />
          </div>

          <div>
            <p>Total Notifications</p>
            <h2>{notifications.length}</h2>
          </div>
        </div>

        <div className="notification-card unread-card">
          <div className="notification-card-icon">
            <BellRing size={21} />
          </div>

          <div>
            <p>Unread Notifications</p>
            <h2>{unreadCount}</h2>
          </div>
        </div>

      </div>

      {/* SUCCESS AND ERROR MESSAGES */}
      {message && (
        <div className="notification-alert success-alert">
          <CheckCircleIcon />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="notification-alert error-alert">
          <span>{error}</span>
        </div>
      )}

      {/* NOTIFICATION LIST */}
      <div className="notification-list-container">

        <div className="notification-list-header">
          <div>
            <h2>My Notifications</h2>
            <p>You have {unreadCount} unread notifications.</p>
          </div>

          <button
            className="mark-all-button"
            onClick={handleMarkAllAsRead}
            disabled={loading || unreadCount === 0}
          >
            <CheckCheck size={17} />
            Mark All as Read
          </button>
        </div>

        {loading ? (
          <div className="notification-state">
            <RefreshCw size={28} className="refresh-spinning" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="notification-state empty-notifications">
            <div className="empty-notification-icon">
              <Inbox size={38} />
            </div>

            <h3>No Notifications Yet</h3>
            <p>
              You're all caught up! New updates about your items and claims
              will appear here.
            </p>
          </div>
        ) : (
          <div className="notification-list">

          {notifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`notification-item ${
                  notification.is_read === 0 ? "unread" : "read"
                }`}
              >
                <div className="notification-icon">
                  {notification.is_read === 0 ? (
                    <BellRing size={20} />
                  ) : (
                    <Check size={20} />
                  )}
                </div>

                <div className="notification-content">

                  <div className="notification-title">
                    <h3>{notification.title}</h3>

                    {notification.is_read === 0 && (
                      <span className="unread-badge">NEW</span>
                    )}
                  </div>

                  <p>{notification.message}</p>

                  <small>
                    <Clock size={13} />
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
                    <Check size={15} />
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

function CheckCircleIcon() {
  return <Check size={18} />;
}

export default Notifications;