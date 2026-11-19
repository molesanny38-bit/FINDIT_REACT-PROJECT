import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  Calendar,
  User,
  Package,
  Eye,
} from "lucide-react";

import { getItems } from "../services/itemService";
import type { Item } from "../services/itemService";    
import "./BrowseItems.css";
interface BrowseItemsProps {
  itemType: "lost" | "found";
}

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const serverUrl = API_URL.replace(/\/api\/?$/, "");

const BrowseItems = ({ itemType }: BrowseItemsProps) => {
  const navigate = useNavigate();

  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Get the logged-in user
  const currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  // Fetch reports from the backend
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getItems();

        // Show all reports matching the selected type.
        // Pending reports are included.
        const filtered = data.filter(
          (item) => item.item_type === itemType
        );

        setItems(filtered);
        setFilteredItems(filtered);
      } catch (err) {
        console.error("Error fetching items:", err);
        setError("Unable to load reports. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [itemType]);

  // Get image URL
  const getImageUrl = (imagePath?: string | null) => {
    if (!imagePath) {
      return null;
    }

    if (/^https?:\/\//i.test(imagePath)) {
      return imagePath;
    }

    const normalizedPath = imagePath
      .replace(/\\/g, "/")
      .replace(/^\/+/, "");

    const filename = normalizedPath.startsWith("uploads/")
      ? normalizedPath
      : `uploads/${normalizedPath}`;

    return `${serverUrl}/${filename}`;
  };

  // Get unique categories
  const categories = Array.from(
    new Set(
      items
        .map((item) => item.category_name)
        .filter((category): category is string => Boolean(category))
    )
  );

  // Search and category filtering
  useEffect(() => {
    let result = [...items];

    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();

      result = result.filter(
        (item) =>
          item.item_name.toLowerCase().includes(search) ||
          (item.description || "").toLowerCase().includes(search) ||
          (item.location_name || "").toLowerCase().includes(search) ||
          (item.category_name || "").toLowerCase().includes(search)
      );
    }

    if (selectedCategory !== "all") {
      result = result.filter(
        (item) => item.category_name === selectedCategory
      );
    }

    setFilteredItems(result);
  }, [searchTerm, selectedCategory, items]);

  // Navigate to item details
  const handleViewDetails = (item: Item) => {
    navigate("/item-details", {
      state: { item },
    });
  };

  // Format date
  const formatDate = (date: string) => {
    if (!date) return "Date not available";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="browse-items-page">
      <div className="browse-items-header">
        <div>
          <h1>
            {itemType === "lost"
              ? "Browse Lost Items"
              : "Browse Found Items"}
          </h1>

          <p>
            {itemType === "lost"
              ? "View items reported lost by students."
              : "View items reported found by students."}
          </p>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="browse-items-filters" role="search" aria-label="Filter items">
        <div className="search-box">
          <Search size={20} aria-hidden="true" />

          <input
            type="text"
            placeholder="Search items by name, category, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search items by name, category, or location"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          aria-label="Filter items by category"
        >
          <option value="all">All Categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      {/* Report Count */}
      <div className="browse-items-count" role="status" aria-live="polite">
        <Package size={18} aria-hidden="true" />
        <span>
          {filteredItems.length}{" "}
          {filteredItems.length === 1 ? "report" : "reports"} found
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="browse-items-message">
          <p>Loading reports...</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="browse-items-message error">
          <p>{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredItems.length === 0 && (
        <div className="browse-items-empty">
          <Package size={48} />

          <h3>No reports found</h3>

          <p>
            {searchTerm || selectedCategory !== "all"
              ? "Try changing your search or category filter."
              : "There are currently no reports in this section."}
          </p>
        </div>
      )}

      {/* Item Cards */}
      {!loading && !error && filteredItems.length > 0 && (
        <div className="browse-items-grid">
          {filteredItems.map((item) => {
            const imageUrl = getImageUrl(item.image_path);

            return (
              <div className="browse-item-card" key={item.item_id}>
                {/* Item Image */}
                <div className="browse-item-image">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={item.item_name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="browse-item-no-image">
                      <Package size={45} />
                      <span>No Image Available</span>
                    </div>
                  )}

                  <span
                    className={`item-type-badge ${item.item_type}`}
                  >
                    {item.item_type === "lost" ? "Lost Item" : "Found Item"}
                  </span>
                </div>

                {/* Item Information */}
                <div className="browse-item-content">
                  <div className="browse-item-title">
                    <h3>{item.item_name}</h3>

                    <span
                      className={`item-status-badge ${item.status}`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="browse-item-description">
                    {item.description || "No description provided."}
                  </p>

                  <div className="browse-item-details">
                    <div>
                      <Package size={16} />
                      <span>
                        {item.category_name || "Uncategorized"}
                      </span>
                    </div>

                    <div>
                      <MapPin size={16} />
                      <span>
                        {item.location_name || "Location not specified"}
                      </span>
                    </div>

                    <div>
                      <Calendar size={16} />
                      <span>
                        {formatDate(item.date_lost_found)}
                      </span>
                    </div>

                    <div>
                      <User size={16} />
                      <span>
                        {item.first_name || "Unknown"}{" "}
                        {item.last_name || ""}
                      </span>
                    </div>
                  </div>

                  {/* Own Report Indicator */}
                  {currentUser &&
                    Number(currentUser.user_id) === Number(item.user_id) && (
                      <span className="own-report-label">
                        Your Report
                      </span>
                    )}

                  {/* View Details Button */}
                  <button
                    type="button"
                    className="view-item-button"
                    onClick={() => handleViewDetails(item)}
                  >
                    <Eye size={17} />
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseItems;