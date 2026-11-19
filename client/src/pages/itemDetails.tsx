import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  MapPin,
  Calendar,
  User,
  Package,
} from "lucide-react";

import { submitClaim } from "../services/claimeService";
import type { Item } from "../services/itemService";

import "./ItemDetails.css";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

function ItemDetails() {
  const location = useLocation();
  const navigate = useNavigate();

  // Accept either navigation property to avoid missing item errors
  const item = (
    location.state?.item || location.state?.selectedItem
  ) as Item | undefined;

  // Claim form states
  const [claimDescription, setClaimDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  // Get logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // Check whether the logged-in student owns this report
  const isOwnItem =
    item && currentUser
      ? Number(item.user_id) === Number(currentUser.user_id)
      : false;

  // Handle claim submission
  const handleSubmitClaim = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!claimDescription.trim()) {
      setError("Please explain why this item belongs to you.");
      return;
    }

    if (claimDescription.trim().length < 10) {
      setError("Please provide at least 10 characters of explanation.");
      return;
    }

    if (!item) {
      setError("Item information is missing.");
      return;
    }

    try {
      setLoading(true);

      await submitClaim(
        item.item_id,
        claimDescription.trim()
      );

      setMessage(
        "Your claim has been submitted successfully! Please wait for staff to review it."
      );

      setClaimSubmitted(true);
      setClaimDescription("");
    } catch (err: unknown) {
      const claimError = err as {
        response?: {
          data?: {
            message?: string;
          };
        };
      };

      setError(
        claimError.response?.data?.message ||
          "Unable to submit your claim. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle missing item
  if (!item) {
    return (
      <div className="item-details-container">
        <h2>Item not found</h2>

        <p>
          Please return to the Browse Items page and select an item.
        </p>

        <button
          className="back-button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Go Back
        </button>
      </div>
    );
  }

  // Get item image URL
  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) return null;

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const normalizedPath = imagePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const filename = normalizedPath.startsWith("uploads/")
      ? normalizedPath
      : `uploads/${normalizedPath}`;

    return `${SERVER_URL}/${filename}`;
  };

  const imageUrl = getImageUrl(item.image_path);

  return (
    <div className="item-details-container">
      {/* Back Button */}
      <button
        className="back-button"
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={18} />
        Back to Browse
      </button>

      <div className="item-details-card">
        {/* Item Image */}
        <div className="item-details-image">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={item.item_name}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Package size={80} />
          )}
        </div>

        {/* Item Information */}
        <div className="item-details-content">
          {/* Item Type */}
          <span className={`details-badge ${item.item_type}`}>
            {item.item_type === "lost"
              ? "Lost Item"
              : "Found Item"}
          </span>

          <h1>{item.item_name}</h1>

          <p className="details-description">
            {item.description || "No description provided."}
          </p>

          {/* Basic Information */}
          <div className="details-information">
            <p>
              <MapPin size={18} />
              {item.location_name || "Location not specified"}
            </p>

            <p>
              <Calendar size={18} />
              {new Date(item.date_lost_found).toLocaleDateString()}
            </p>

            <p>
              <User size={18} />
              Reported by: {item.first_name} {item.last_name}
            </p>

            <p>
              <Package size={18} />
              Category: {item.category_name || "Uncategorized"}
            </p>
          </div>

          <hr />

          {/* Additional Information */}
          <h3>Additional Information</h3>

          <p>
            <strong>Color:</strong>{" "}
            {item.color || "Not specified"}
          </p>

          <p>
            <strong>Brand:</strong>{" "}
            {item.brand || "Not specified"}
          </p>

          <p>
            <strong>Identifying Details:</strong>{" "}
            {item.identifying_details || "Not specified"}
          </p>

          <p>
            <strong>Status:</strong>{" "}
            <span className={`item-status-badge ${item.status}`}>
              {item.status}
            </span>
          </p>

          {/* Claim Submission Section */}
          {item.item_type === "found" && (
            <div className="claim-form-container">
              <hr />

              <h2>Claim This Item</h2>

              {isOwnItem ? (
                <p className="claim-info">
                  You cannot submit a claim for your own found item.
                </p>
              ) : claimSubmitted ? (
                <div className="claim-success">
                  <p>{message}</p>
                  <p>
                    You can check the progress of your claim in the
                    My Claims section.
                  </p>
                </div>
              ) : (
                <>
                  <p>
                    If this item belongs to you, explain how you can
                    identify or prove ownership of it.
                  </p>

                  <form onSubmit={handleSubmitClaim}>
                    <label htmlFor="claimDescription">
                      Explanation and Proof of Ownership
                    </label>

                    <textarea
                      id="claimDescription"
                      value={claimDescription}
                      onChange={(e) =>
                        setClaimDescription(e.target.value)
                      }
                      placeholder="Describe identifying details or proof of ownership..."
                      rows={5}
                      required
                      minLength={10}
                      maxLength={2000}
                      disabled={loading}
                    />

                    <small>
                      Provide details that only the real owner would know.
                    </small>

                    {error && (
                      <p className="claim-error">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit Claim"}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {item.item_type === "lost" && (
            <p className="claim-info">
              This is a lost item report. To claim an item, browse
              Found Items and select the item you believe belongs to you.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemDetails;