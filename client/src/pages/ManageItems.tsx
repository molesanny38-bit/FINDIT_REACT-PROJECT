import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Package,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    Eye,
    Trash2,
    X,
    MapPin,
    Calendar,
    User,
    Tag
} from "lucide-react";

import {
    getItems,
    deleteItem,
    updateItemStatus,
    type Item
} from "../services/itemService";
import axios from "axios";

import "./ManagesItems.css";

const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

function ManageItems() {
    const [items, setItems] = useState<Item[]>([]);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");

    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getItems();
            setItems(data);
        } catch (err) {
            console.error(err);
            setError("Failed to load reported items.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();
    }, []);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const searchText = search.toLowerCase();

            const reporter =
                `${item.first_name || ""} ${item.last_name || ""}`.toLowerCase();

            const matchesSearch =
                item.item_name.toLowerCase().includes(searchText) ||
                reporter.includes(searchText) ||
                (item.category_name || "").toLowerCase().includes(searchText) ||
                (item.location_name || "").toLowerCase().includes(searchText);

            const matchesType =
                typeFilter === "all" || item.item_type === typeFilter;

            const matchesStatus =
                statusFilter === "all" || item.status === statusFilter;

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [items, search, typeFilter, statusFilter]);

    const totalItems = items.length;
    const lostItems = items.filter(item => item.item_type === "lost").length;
    const foundItems = items.filter(item => item.item_type === "found").length;
    const pendingItems = items.filter(item => item.status === "pending").length;

    const handleStatusChange = async (
        id: number,
        status: string
    ) => {
        try {
            setUpdatingId(id);

            await updateItemStatus(id, status);

            setItems(previous =>
                previous.map(item =>
                    item.item_id === id
                        ? { ...item, status }
                        : item
                )
            );

            if (selectedItem?.item_id === id) {
                setSelectedItem(previous =>
                    previous ? { ...previous, status } : null
                );
            }
        } catch (err) {
            console.error(err);
            alert("Failed to update item status.");
            await fetchItems();
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (item: Item) => {
    const confirmed = window.confirm(
        `Are you sure you want to delete "${item.item_name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
        await deleteItem(item.item_id);

        setItems(previous =>
            previous.filter(
                current => current.item_id !== item.item_id
            )
        );

        if (selectedItem?.item_id === item.item_id) {
            setSelectedItem(null);
        }

        alert("Item deleted successfully.");

    } catch (err: unknown) {
        console.error(err);

        if (axios.isAxiosError(err)) {
            alert(
                err.response?.data?.message ||
                "Failed to delete item."
            );
        } else {
            alert("An unexpected error occurred.");
        }
    }
};

    const getImageUrl = (imagePath?: string | null) => {
        if (!imagePath) return "";

        if (imagePath.startsWith("http")) {
            return imagePath;
        }

        return `${SERVER_URL}/uploads/${imagePath}`;
    };

    const formatDate = (date: string) => {
        if (!date) return "N/A";

        const dateOnly = String(date).slice(0, 10);
        const parsedDate = new Date(`${dateOnly}T00:00:00`);

        if (Number.isNaN(parsedDate.getTime())) return "N/A";

        return parsedDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    };

    return (
        <div className="manage-items-page">

            {/* HEADER */}

            <div className="manage-items-header">
                <div>
                    <h1>Manage Items</h1>
                    <p>
                        View, monitor, and manage reported lost and found items.
                    </p>
                </div>

                <button
                    className="refresh-button"
                    onClick={fetchItems}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            {/* SUMMARY CARDS */}

            <div className="item-summary-grid">

                <div className="item-summary-card">
                    <div className="summary-icon">
                        <Package />
                    </div>
                    <div>
                        <p>Total Items</p>
                        <h2>{totalItems}</h2>
                    </div>
                </div>

                <div className="item-summary-card">
                    <div className="summary-icon lost-icon">
                        <AlertCircle />
                    </div>
                    <div>
                        <p>Lost Items</p>
                        <h2>{lostItems}</h2>
                    </div>
                </div>

                <div className="item-summary-card">
                    <div className="summary-icon found-icon">
                        <CheckCircle />
                    </div>
                    <div>
                        <p>Found Items</p>
                        <h2>{foundItems}</h2>
                    </div>
                </div>

                <div className="item-summary-card">
                    <div className="summary-icon pending-icon">
                        <RefreshCw />
                    </div>
                    <div>
                        <p>Pending Items</p>
                        <h2>{pendingItems}</h2>
                    </div>
                </div>

            </div>

            {/* SEARCH AND FILTER */}

            <div className="items-filter-container">

                <div className="items-search">
                    <Search size={19} />

                    <input
                        type="text"
                        placeholder="Search item, category, location, or reporter..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="all">All Types</option>
                    <option value="lost">Lost Items</option>
                    <option value="found">Found Items</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="matched">Matched</option>
                    <option value="claimed">Claimed</option>
                    <option value="returned">Returned</option>
                    <option value="rejected">Rejected</option>
                    <option value="archived">Archived</option>
                </select>

            </div>

            {/* ITEMS TABLE */}

            <div className="items-table-container">

                <div className="items-table-header">
                    <h2>Reported Items</h2>
                    <span>{filteredItems.length} items found</span>
                </div>

                {loading ? (
                    <div className="items-message">
                        Loading reported items...
                    </div>
                ) : error ? (
                    <div className="items-message error-message">
                        {error}
                        <button onClick={fetchItems}>Retry</button>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="items-message">
                        No reported items found.
                    </div>
                ) : (
                    <div className="items-table-scroll">
                        <table className="manage-items-table">

                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Type</th>
                                    <th>Category</th>
                                    <th>Location</th>
                                    <th>Reporter</th>
                                    <th>Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredItems.map(item => (
                                    <tr key={item.item_id}>

                                        <td>
                                            <div className="managed-item-info">
                                                {item.image_path ? (
                                                    <img
                                                        src={getImageUrl(item.image_path)}
                                                        alt={item.item_name}
                                                    />
                                                ) : (
                                                    <div className="no-item-image">
                                                        <Package size={22} />
                                                    </div>
                                                )}

                                                <div>
                                                    <strong>{item.item_name}</strong>
                                                    <small>
                                                        ID: #{item.item_id}
                                                    </small>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className={`item-type-badge ${item.item_type}`}>
                                                {item.item_type}
                                            </span>
                                        </td>

                                        <td>{item.category_name || "N/A"}</td>
                                        <td>{item.location_name || "N/A"}</td>

                                        <td>
                                            {item.first_name || ""}{" "}
                                            {item.last_name || ""}
                                        </td>

                                        <td>{formatDate(item.date_lost_found)}</td>

                                        <td>
                                            <select
                                                className={`item-status-select ${item.status}`}
                                                value={item.status}
                                                disabled={updatingId === item.item_id}
                                                onChange={e =>
                                                    handleStatusChange(
                                                        item.item_id,
                                                        e.target.value
                                                    )
                                                }
                                            >
                                                <option value="pending">Pending</option>
                                                <option value="active">Active</option>
                                                <option value="matched">Matched</option>
                                                <option value="claimed">Claimed</option>
                                                <option value="returned">Returned</option>
                                                <option value="rejected">Rejected</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </td>

                                        <td>
                                            <div className="item-action-buttons">

                                                <button
                                                    title="View Item"
                                                    className="view-action"
                                                    onClick={() => setSelectedItem(item)}
                                                >
                                                    <Eye size={17} />
                                                </button>

                                                <button
                                                    title="Delete Item"
                                                    className="delete-action"
                                                    onClick={() => handleDelete(item)}
                                                >
                                                    <Trash2 size={17} />
                                                </button>

                                            </div>
                                        </td>

                                    </tr>
                                ))}
                            </tbody>

                        </table>
                    </div>
                )}
            </div>

            {/* ITEM DETAILS MODAL */}

            {selectedItem && (
                <div
                    className="item-modal-overlay"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="item-details-modal"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="item-modal-header">
                            <div>
                                <h2>Item Details</h2>
                                <p>Reported Item #{selectedItem.item_id}</p>
                            </div>

                            <button
                                className="modal-close-button"
                                onClick={() => setSelectedItem(null)}
                            >
                                <X size={22} />
                            </button>
                        </div>

                        <div className="item-modal-body">

                            {selectedItem.image_path ? (
                                <img
                                    className="item-detail-image"
                                    src={getImageUrl(selectedItem.image_path)}
                                    alt={selectedItem.item_name}
                                />
                            ) : (
                                <div className="item-detail-no-image">
                                    <Package size={45} />
                                    <span>No image uploaded</span>
                                </div>
                            )}

                            <h3>{selectedItem.item_name}</h3>

                            <span className={`item-type-badge ${selectedItem.item_type}`}>
                                {selectedItem.item_type} item
                            </span>

                            <div className="item-detail-information">

                                <div>
                                    <Tag size={17} />
                                    <span>
                                        <strong>Category</strong>
                                        {selectedItem.category_name || "N/A"}
                                    </span>
                                </div>

                                <div>
                                    <MapPin size={17} />
                                    <span>
                                        <strong>Location</strong>
                                        {selectedItem.location_name || "N/A"}
                                    </span>
                                </div>

                                <div>
                                    <User size={17} />
                                    <span>
                                        <strong>Reported By</strong>
                                        {selectedItem.first_name || ""}{" "}
                                        {selectedItem.last_name || ""}
                                    </span>
                                </div>

                                <div>
                                    <Calendar size={17} />
                                    <span>
                                        <strong>Date Lost/Found</strong>
                                        {formatDate(selectedItem.date_lost_found)}
                                    </span>
                                </div>

                            </div>

                            <div className="item-detail-section">
                                <strong>Description</strong>
                                <p>
                                    {selectedItem.description || "No description provided."}
                                </p>
                            </div>

                            <div className="item-detail-section">
                                <strong>Identifying Details</strong>
                                <p>
                                    {selectedItem.identifying_details || "No identifying details provided."}
                                </p>
                            </div>

                            <div className="item-detail-extra">
                                <div>
                                    <strong>Color</strong>
                                    <span>{selectedItem.color || "N/A"}</span>
                                </div>

                                <div>
                                    <strong>Brand</strong>
                                    <span>{selectedItem.brand || "N/A"}</span>
                                </div>

                                <div>
                                    <strong>Current Status</strong>
                                    <span className={`item-status-label ${selectedItem.status}`}>
                                        {selectedItem.status}
                                    </span>
                                </div>
                            </div>

                            <div className="item-modal-footer">
                                <button
                                    className="modal-done-button"
                                    onClick={() => setSelectedItem(null)}
                                >
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ManageItems;