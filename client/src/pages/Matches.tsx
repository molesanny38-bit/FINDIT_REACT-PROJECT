import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  Package,
  MapPin,
  Calendar,
  Percent,
  ArrowRight,
} from "lucide-react";

import {
  getMatches,
  updateMatchStatus,
  type Match,
} from "../services/matchService";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getImageUrl = (imagePath: string | null | undefined) => {
  if (!imagePath) return null;

  const serverUrl = API_URL.replace(/\/api\/?$/, "");

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  // Remove leading slashes
  const cleanPath = imagePath.replace(/^\/+/, "");

  // Avoid adding uploads twice
  const imageFile = cleanPath.replace(/^uploads\//, "");

  return `${serverUrl}/uploads/${imageFile}`;
};

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadMatches = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getMatches();
      setMatches(data);
    } catch (err) {
      console.error("Error loading matches:", err);
      setError("Unable to load possible matches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleUpdateStatus = async (
    matchId: number,
    status: "confirmed" | "dismissed"
  ) => {
    const action = status === "confirmed" ? "confirm" : "dismiss";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this match?`
    );

    if (!confirmed) return;

    try {
      setUpdatingId(matchId);
      setError("");
      setSuccess("");

      await updateMatchStatus(matchId, status);

      setMatches((previousMatches) =>
        previousMatches.map((match) =>
          match.match_id === matchId
            ? { ...match, match_status: status }
            : match
        )
      );

      setSuccess(`Match successfully ${status}.`);
    } catch (err) {
      console.error("Error updating match:", err);
      setError("Unable to update match status. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredMatches = matches.filter((match) => {
    const search = searchTerm.toLowerCase();

    const matchesSearch =
      match.lost_item_name?.toLowerCase().includes(search) ||
      match.found_item_name?.toLowerCase().includes(search) ||
      match.lost_location?.toLowerCase().includes(search) ||
      match.found_location?.toLowerCase().includes(search);

    const matchesFilter =
      activeFilter === "all" || match.match_status === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const suggestedCount = matches.filter(
    (match) => match.match_status === "suggested"
  ).length;

  const confirmedCount = matches.filter(
    (match) => match.match_status === "confirmed"
  ).length;

  const dismissedCount = matches.filter(
    (match) => match.match_status === "dismissed"
  ).length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          background: "#dcfce7",
          color: "#166534",
        };
      case "dismissed":
        return {
          background: "#fee2e2",
          color: "#991b1b",
        };
      default:
        return {
          background: "#fef3c7",
          color: "#92400e",
        };
    }
  };

  const renderItemImage = (
    imagePath: string | null | undefined,
    itemName: string
  ) => {
    const imageUrl = getImageUrl(imagePath);

    return imageUrl ? (
      <img
        src={imageUrl}
        alt={itemName}
        className="match-item-image"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
      />
    ) : (
      <div className="match-image-placeholder">
        <Package size={35} />
        <span>No image available</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="matches-page">
        <div className="matches-loading">
          <RefreshCw className="loading-icon" size={30} />
          <p>Loading possible matches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="matches-page">
      <div className="matches-header">
        <div>
          <h1>Possible Matches</h1>
          <p>
            Review lost and found items that may belong together.
          </p>
        </div>

        <button className="matches-refresh-btn" onClick={loadMatches}>
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="matches-stats">
        <div className="match-stat-card">
          <span>Total Matches</span>
          <h2>{matches.length}</h2>
        </div>

        <div className="match-stat-card">
          <span>Suggested</span>
          <h2>{suggestedCount}</h2>
        </div>

        <div className="match-stat-card">
          <span>Confirmed</span>
          <h2>{confirmedCount}</h2>
        </div>

        <div className="match-stat-card">
          <span>Dismissed</span>
          <h2>{dismissedCount}</h2>
        </div>
      </div>

      {/* Search and filters */}
      <div className="matches-toolbar">
        <div className="matches-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="Search item name or location..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <select
          value={activeFilter}
          onChange={(event) => setActiveFilter(event.target.value)}
        >
          <option value="all">All Matches</option>
          <option value="suggested">Suggested</option>
          <option value="confirmed">Confirmed</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </div>

      {error && <div className="matches-alert error">{error}</div>}
      {success && <div className="matches-alert success">{success}</div>}

      {/* Match cards */}
      {filteredMatches.length === 0 ? (
        <div className="matches-empty">
          <Package size={45} />
          <h3>No matches found</h3>
          <p>
            There are no matching items to display based on your search
            or selected filter.
          </p>
        </div>
      ) : (
        <div className="matches-list">
          {filteredMatches.map((match) => (
            <div className="match-card" key={match.match_id}>
              <div className="match-card-header">
                <div>
                  <span className="match-id">
                    Match #{match.match_id}
                  </span>
                  <span
                    className="match-status"
                    style={getStatusStyle(match.match_status)}
                  >
                    {match.match_status}
                  </span>
                </div>

                <div className="match-percentage">
                  <Percent size={17} />
                  {Number(match.matching_percentage).toFixed(2)}% Match
                </div>
              </div>

              <div className="match-items-container">
                {/* Lost item */}
                <div className="match-item">
                  <span className="match-item-label lost-label">
                    LOST ITEM
                  </span>

                  {renderItemImage(
                    match.lost_image_path,
                    match.lost_item_name
                  )}

                  <h3>{match.lost_item_name}</h3>

                  <p>{match.lost_description}</p>

                  <div className="match-item-details">
                    {match.lost_category && (
                      <span>
                        <Package size={15} />
                        {match.lost_category}
                      </span>
                    )}

                    {match.lost_location && (
                      <span>
                        <MapPin size={15} />
                        {match.lost_location}
                      </span>
                    )}

                    {match.lost_color && (
                      <span>Color: {match.lost_color}</span>
                    )}

                    {match.lost_brand && (
                      <span>Brand: {match.lost_brand}</span>
                    )}

                    {match.lost_owner && (
                      <span>Reported by: {match.lost_owner}</span>
                    )}
                  </div>
                </div>

                {/* Match indicator */}
                <div className="match-arrow">
                  <ArrowRight size={30} />
                </div>

                {/* Found item */}
                <div className="match-item">
                  <span className="match-item-label found-label">
                    FOUND ITEM
                  </span>

                  {renderItemImage(
                    match.found_image_path,
                    match.found_item_name
                  )}

                  <h3>{match.found_item_name}</h3>

                  <p>{match.found_description}</p>

                  <div className="match-item-details">
                    {match.found_category && (
                      <span>
                        <Package size={15} />
                        {match.found_category}
                      </span>
                    )}

                    {match.found_location && (
                      <span>
                        <MapPin size={15} />
                        {match.found_location}
                      </span>
                    )}

                    {match.found_color && (
                      <span>Color: {match.found_color}</span>
                    )}

                    {match.found_brand && (
                      <span>Brand: {match.found_brand}</span>
                    )}

                    {match.found_owner && (
                      <span>Reported by: {match.found_owner}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="match-card-footer">
                <div className="match-date">
                  <Calendar size={15} />
                  {new Date(match.created_at).toLocaleDateString()}
                </div>

                {match.match_status === "suggested" && (
                  <div className="match-actions">
                    <button
                      className="match-confirm-btn"
                      disabled={updatingId === match.match_id}
                      onClick={() =>
                        handleUpdateStatus(match.match_id, "confirmed")
                      }
                    >
                      <CheckCircle size={16} />
                      Confirm
                    </button>

                    <button
                      className="match-dismiss-btn"
                      disabled={updatingId === match.match_id}
                      onClick={() =>
                        handleUpdateStatus(match.match_id, "dismissed")
                      }
                    >
                      <XCircle size={16} />
                      Dismiss
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Matches;