import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Package,
    MapPin,
    Calendar,
    Eye,
    AlertCircle,
    Plus,
    X,
    Upload,
    Send,
} from "lucide-react";

import {
    getItems,
    addItem,
    getCategories,
    getLocations,
    type Item,
    type Category,
    type Location,
    type AddItemData,
} from "../services/itemService";

import "./MyReport.css";

const MyReports = () => {
    const navigate = useNavigate();

    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedType, setSelectedType] = useState("all");

    const [showReportForm, setShowReportForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState<AddItemData>({
        category_id: 0,
        location_id: 0,
        item_name: "",
        description: "",
        identifying_details: "",
        color: "",
        brand: "",
        item_type: "lost",
        date_lost_found: "",
        image: null,
    });

    const currentUser = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem("user") || "null");
        } catch {
            return null;
        }
    }, []);

    // Load the student's reports
    const fetchMyReports = async () => {
        try {
            setLoading(true);
            setError("");

            const allItems = await getItems();

            const myItems = allItems.filter(
                (item) =>
                    Number(item.user_id) === Number(currentUser?.user_id)
            );

            setItems(myItems);
        } catch {
            setError("Unable to load your reports. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Load categories and locations for the reporting form
    const loadFormOptions = async () => {
        try {
            const [categoryData, locationData] = await Promise.all([
                getCategories(),
                getLocations(),
            ]);

            setCategories(categoryData);
            setLocations(locationData);
        } catch {
            setFormError("Unable to load categories and locations.");
        }
    };

    useEffect(() => {
        if (currentUser?.user_id) {
            fetchMyReports();
        } else {
            setError("User information not found. Please log in again.");
            setLoading(false);
        }
    }, [currentUser]);

    const openReportForm = async () => {
        setShowReportForm(true);
        setFormError("");
        setSuccessMessage("");
        await loadFormOptions();
    };

    const handleFormChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]:
                name === "category_id" || name === "location_id"
                    ? Number(value)
                    : value,
        }));
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file && !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setFormError("Please upload a JPG, PNG, or WEBP image.");
            return;
        }

        if (file && file.size > 5 * 1024 * 1024) {
            setFormError("Image size must not exceed 5MB.");
            return;
        }

        setFormError("");

        setFormData((prev) => ({
            ...prev,
            image: file,
        }));
    };

    const handleSubmitReport = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        setFormError("");
        setSuccessMessage("");

        if (!formData.category_id || !formData.location_id) {
            setFormError("Please select a category and location.");
            return;
        }

        if (!formData.date_lost_found) {
            setFormError("Please select the date lost or found.");
            return;
        }

        try {
            setSubmitting(true);

            await addItem(formData);

            setSuccessMessage("Your report was submitted successfully!");

            setFormData({
                category_id: 0,
                location_id: 0,
                item_name: "",
                description: "",
                identifying_details: "",
                color: "",
                brand: "",
                item_type: "lost",
                date_lost_found: "",
                image: null,
            });

            await fetchMyReports();

            setTimeout(() => {
                setShowReportForm(false);
                setSuccessMessage("");
            }, 1200);
        } catch (err) {
            const message = (
                err as { response?: { data?: { message?: string } } }
            ).response?.data?.message;

            setFormError(message || "Failed to submit your report.");
        } finally {
            setSubmitting(false);
        }
    };

    const filteredItems = items.filter((item) => {
        const matchesType =
            selectedType === "all" || item.item_type === selectedType;

        const searchText = search.toLowerCase();

        const matchesSearch =
            item.item_name.toLowerCase().includes(searchText) ||
            (item.description || "").toLowerCase().includes(searchText) ||
            (item.location_name || "").toLowerCase().includes(searchText);

        return matchesType && matchesSearch;
    });

    const getStatusClass = (status: string) =>
        `status-badge status-${status.toLowerCase()}`;

    const getImageUrl = (imagePath?: string | null) => {
  if (!imagePath) return null;

  const serverUrl = (
    import.meta.env.VITE_API_URL || "http://localhost:5000/api"
  ).replace(/\/api\/?$/, "");

  if (imagePath.startsWith("http")) {
    return imagePath;
  }

  const filename = imagePath
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "");

  return `${serverUrl}/uploads/${filename}`;
};
    const handleViewDetails = (item: Item) => {
        navigate("/item-details", {
            state: {
                selectedItem: item,
                source: "my-reports",
            },
        });
    };

    return (
        <div className="my-reports-page">
            <div className="my-reports-header">
                <div>
                    <h1>My Reports</h1>
                    <p>View and track the lost and found items you reported.</p>
                </div>

                <button
                    className="create-report-btn"
                    onClick={openReportForm}
                >
                    <Plus size={18} />
                    Report an Item
                </button>
            </div>

            {successMessage && (
                <div className="report-success-message">
                    {successMessage}
                </div>
            )}

            {/* Report Form */}
            {showReportForm && (
                <div
                    className="report-form-overlay"
                    onClick={() => setShowReportForm(false)}
                >
                    <div
                        className="report-form-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="report-modal-heading"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="report-modal-header">
                            <div>
                                <h2 id="report-modal-heading">Report an Item</h2>
                                <p>Provide the details of the lost or found item.</p>
                            </div>

                            <button
                                type="button"
                                className="close-report-btn"
                                onClick={() => setShowReportForm(false)}
                                aria-label="Close report modal"
                            >
                                <X size={22} aria-hidden="true" />
                            </button>
                        </div>

                        {formError && (
                            <div className="report-form-error">
                                <AlertCircle size={18} />
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmitReport}>
                            <label>Report Type *</label>

                            <div className="report-type-options">
                                <button
                                    type="button"
                                    className={formData.item_type === "lost" ? "selected" : ""}
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            item_type: "lost",
                                        }))
                                    }
                                >
                                    Lost Item
                                </button>

                                <button
                                    type="button"
                                    className={formData.item_type === "found" ? "selected" : ""}
                                    onClick={() =>
                                        setFormData((prev) => ({
                                            ...prev,
                                            item_type: "found",
                                        }))
                                    }
                                >
                                    Found Item
                                </button>
                            </div>

                            <label htmlFor="item_name">Item Name *</label>
                            <input
                                id="item_name"
                                name="item_name"
                                value={formData.item_name}
                                onChange={handleFormChange}
                                placeholder="Example: Black Wallet"
                                required
                            />

                            <label htmlFor="category_id">Category *</label>
                            <select
                                id="category_id"
                                name="category_id"
                                value={formData.category_id}
                                onChange={handleFormChange}
                                required
                            >
                                <option value={0}>Select Category</option>
                                {categories.map((category: Category) => (
                                    <option
                                        key={category.category_id}
                                        value={category.category_id}
                                    >
                                        {category.category_name}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="description">Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                placeholder="Describe the item..."
                                rows={3}
                                required
                            />

                            <label htmlFor="identifying_details">
                                Identifying Details
                            </label>
                            <textarea
                                id="identifying_details"
                                name="identifying_details"
                                value={formData.identifying_details}
                                onChange={handleFormChange}
                                placeholder="Unique marks, stickers, or other details..."
                                rows={2}
                            />

                            <div className="report-form-row">
                                <div>
                                    <label htmlFor="color">Color</label>
                                    <input
                                        id="color"
                                        name="color"
                                        value={formData.color}
                                        onChange={handleFormChange}
                                        placeholder="Example: Black"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="brand">Brand</label>
                                    <input
                                        id="brand"
                                        name="brand"
                                        value={formData.brand}
                                        onChange={handleFormChange}
                                        placeholder="Example: Samsung"
                                    />
                                </div>
                            </div>

                            <label htmlFor="location_id">Location *</label>
                            <select
                                id="location_id"
                                name="location_id"
                                value={formData.location_id}
                                onChange={handleFormChange}
                                required
                            >
                                <option value={0}>Select Location</option>
                                {locations.map((location: Location) => (
                                    <option
                                        key={location.location_id}
                                        value={location.location_id}
                                    >
                                        {location.location_name}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="date_lost_found">
                                Date Lost or Found *
                            </label>
                            <input
                                id="date_lost_found"
                                name="date_lost_found"
                                type="date"
                                value={formData.date_lost_found}
                                onChange={handleFormChange}
                                required
                            />

                            <label htmlFor="image">Upload Item Photo</label>
                            <div className="report-image-input">
                                <Upload size={20} />
                                <input
                                    id="image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageChange}
                                />
                                <small>JPG, PNG, or WEBP. Maximum 5MB.</small>
                            </div>

                            {formData.image && (
                                <p className="selected-image-name">
                                    {formData.image.name}
                                </p>
                            )}

                            <div className="report-modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowReportForm(false)}
                                    className="cancel-report-btn"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="submit-report-btn"
                                    disabled={submitting}
                                >
                                    <Send size={17} />
                                    {submitting ? "Submitting..." : "Submit Report"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Summary */}
            <div className="my-reports-summary">
                <div className="summary-card">
                    <Package size={25} />
                    <div>
                        <h3>{items.length}</h3>
                        <p>Total Reports</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div>
                        <h3>
                            {items.filter((item) => item.item_type === "lost").length}
                        </h3>
                        <p>Lost Items</p>
                    </div>
                </div>

                <div className="summary-card">
                    <div>
                        <h3>
                            {items.filter((item) => item.item_type === "found").length}
                        </h3>
                        <p>Found Items</p>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="my-reports-controls">
                <div className="my-reports-search">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Search your reports..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                >
                    <option value="all">All Reports</option>
                    <option value="lost">Lost Items</option>
                    <option value="found">Found Items</option>
                </select>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="my-reports-message">Loading your reports...</div>
            ) : error ? (
                <div className="my-reports-message error-message">
                    <AlertCircle size={20} />
                    {error}
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="my-reports-empty">
                    <Package size={45} />
                    <h3>No Reports Found</h3>
                    <p>
                        {items.length === 0
                            ? "You haven't submitted any lost or found item reports yet."
                            : "No reports match your search or selected filter."}
                    </p>
                </div>
            ) : (
                <div className="my-reports-grid">
                    {filteredItems.map((item) => {
                        const imageUrl = getImageUrl(item.image_path);

                        return (
                            <div className="my-report-card" key={item.item_id}>
                                <div className="my-report-image">
                                    {imageUrl ? (
                                        <img src={imageUrl} alt={item.item_name} />
                                    ) : (
                                        <div className="no-report-image">
                                            <Package size={40} />
                                            <span>No Image</span>
                                        </div>
                                    )}

                                    <span className={`item-type-badge ${item.item_type}`}>
                                        {item.item_type.toUpperCase()}
                                    </span>
                                </div>

                                <div className="my-report-content">
                                    <div className="my-report-title">
                                        <h3>{item.item_name}</h3>
                                        <span className={getStatusClass(item.status)}>
                                            {item.status}
                                        </span>
                                    </div>

                                    <p className="my-report-description">
                                        {item.description || "No description provided."}
                                    </p>

                                    <div className="my-report-information">
                                        <span>
                                            <MapPin size={16} />
                                            {item.location_name || "Location not specified"}
                                        </span>

                                        <span>
                                            <Calendar size={16} />
                                            {new Date(item.date_lost_found).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <button
                                        className="view-report-btn"
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

export default MyReports;