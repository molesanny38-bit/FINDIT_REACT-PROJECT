import { useEffect, useState } from "react";

import {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  getCategories,
  getLocations,
  type Item,
  type AddItemData,
  type Category,
  type Location,
} from "../services/itemService";

import { submitClaim } from "../services/claimeService";

const API_URL = import.meta.env.VITE_API_URL;

const getImageUrl = (imagePath: string) => {
  const serverUrl = API_URL.replace(/\/api\/?$/, "");
  return `${serverUrl}/uploads/${encodeURIComponent(imagePath)}`;
};

function Items() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  const [editingId, setEditingId] = useState<number | null>(null);

  // Image states
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Claim states
  const [claimingItemId, setClaimingItemId] = useState<number | null>(null);
  const [claimDescription, setClaimDescription] = useState("");
  const [claimMessage, setClaimMessage] = useState("");

  // Get logged-in user
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const isStudent = currentUser.role === "student";

  // Item form data
  const [formData, setFormData] = useState<AddItemData>({
    category_id: 1,
    location_id: 1,
    item_name: "",
    description: "",
    identifying_details: "",
    color: "",
    brand: "",
    item_type: "lost",
    date_lost_found: "",
    image: null,
  });

  // Load items
  const loadItems = async () => {
    try {
      setLoading(true);

      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load items:", error);

      setMessage(
        "Unable to load items. Please log in again if your session expired."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load categories and locations
  useEffect(() => {
    const loadFormOptions = async () => {
      try {
        const [categoryData, locationData] = await Promise.all([
          getCategories(),
          getLocations(),
        ]);

        setCategories(categoryData);
        setLocations(locationData);
      } catch (error) {
        console.error("Failed to load categories and locations:", error);
        setMessage("Failed to load categories or locations.");
      }
    };

    loadItems();
    loadFormOptions();
  }, []);

  // Handle form changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "category_id" || name === "location_id"
          ? Number(value)
          : value,
    }));
  };

  // Handle image selection
  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Only JPG, PNG, and WEBP images are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must not exceed 5 MB.");
      e.target.value = "";
      return;
    }

    setFormData((previous) => ({
      ...previous,
      image: file,
    }));

    setImagePreview(URL.createObjectURL(file));
    setMessage("");
  };

  // Remove selected image
  const handleRemoveImage = () => {
    setFormData((previous) => ({
      ...previous,
      image: null,
    }));

    setImagePreview(null);
  };

  // Edit item
  const handleEdit = (item: Item) => {
    setEditingId(item.item_id);

    setFormData({
      category_id: item.category_id,
      location_id: item.location_id,
      item_name: item.item_name,
      description: item.description || "",
      identifying_details: item.identifying_details || "",
      color: item.color || "",
      brand: item.brand || "",
      item_type: item.item_type,
      date_lost_found: String(item.date_lost_found).slice(0, 10),
      image: null,
    });

    setImagePreview(
      item.image_path ? getImageUrl(item.image_path) : null
    );

    setShowForm(true);
    setMessage("");
  };

  // Reset form
  const resetForm = () => {
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

    setImagePreview(null);
    setEditingId(null);
    setShowForm(false);
  };

  // Add or update item
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setMessage("");

    try {
      if (editingId !== null) {
        await updateItem(editingId, formData);
        setMessage("Item updated successfully!");
      } else {
        await addItem(formData);
        setMessage("Item reported successfully!");
      }

      resetForm();

      await loadItems();
    } catch (error) {
      console.error("Failed to save item:", error);
      setMessage("Failed to save item. Please check your information.");
    }
  };

  // Delete item
  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this item?"
    );

    if (!confirmDelete) return;

    try {
      await deleteItem(id);

      setMessage("Item deleted successfully!");
      await loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
      setMessage("Failed to delete item.");
    }
  };

  // Open claim form
  const handleOpenClaim = (itemId: number) => {
    setClaimingItemId(itemId);
    setClaimDescription("");
    setClaimMessage("");
  };

  // Submit claim
  const handleSubmitClaim = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (claimingItemId === null) return;

    try {
      setClaimMessage("");

      await submitClaim(claimingItemId, claimDescription);

      setClaimMessage("Your claim has been submitted successfully!");

      setClaimingItemId(null);
      setClaimDescription("");
    } catch (error) {
      console.error("Failed to submit claim:", error);

      setClaimMessage(
        "Failed to submit claim. You may have already submitted a pending claim for this item."
      );
    }
  };

  // Filter items
  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="items-page">

      {/* Header */}
      <div className="items-header">
        <div>
          <h1>Items Management</h1>
          <p>Manage lost and found item reports.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
              setMessage("");
            }
          }}
        >
          {showForm ? "Close Form" : "+ Report Item"}
        </button>
      </div>

      {message && (
        <p className="items-message">{message}</p>
      )}

      {claimMessage && (
        <p className="items-message">{claimMessage}</p>
      )}

      {/* Add/Edit Item Form */}
      {showForm && (
        <form className="item-form" onSubmit={handleSubmit}>
          <h2>
            {editingId !== null
              ? "Edit Item"
              : "Report a Lost or Found Item"}
          </h2>

          <label>Item Name</label>
          <input
            name="item_name"
            value={formData.item_name}
            onChange={handleChange}
            required
          />

          <label>Item Type</label>
          <select
            name="item_type"
            value={formData.item_type}
            onChange={handleChange}
          >
            <option value="lost">Lost Item</option>
            <option value="found">Found Item</option>
          </select>

          <label>Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Category</option>

            {categories.map((category) => (
              <option
                key={category.category_id}
                value={category.category_id}
              >
                {category.category_name}
              </option>
            ))}
          </select>

          <label>Location</label>
          <select
            name="location_id"
            value={formData.location_id}
            onChange={handleChange}
            required
          >
            <option value="">Select Location</option>

            {locations.map((location) => (
              <option
                key={location.location_id}
                value={location.location_id}
              >
                {location.location_name}
              </option>
            ))}
          </select>

          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
          />

          <label>Identifying Details</label>
          <textarea
            name="identifying_details"
            value={formData.identifying_details}
            onChange={handleChange}
          />

          <label>Color</label>
          <input
            name="color"
            value={formData.color}
            onChange={handleChange}
          />

          <label>Brand</label>
          <input
            name="brand"
            value={formData.brand}
            onChange={handleChange}
          />

          <label>Date Lost or Found</label>
          <input
            type="date"
            name="date_lost_found"
            value={formData.date_lost_found}
            onChange={handleChange}
            required
          />

          {/* Image Upload */}
          <label>Item Image</label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />

          {/* Image Preview */}
          {imagePreview && (
            <div className="image-preview">
              <p>
                {formData.image
                  ? "Selected Image:"
                  : "Current Item Image:"}
              </p>

              <img
                src={imagePreview}
                alt="Item preview"
                style={{
                  width: "180px",
                  height: "180px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />

              <button
                type="button"
                onClick={handleRemoveImage}
              >
                Remove Selected Image
              </button>
            </div>
          )}

          <button type="submit">
            {editingId !== null
              ? "Update Item"
              : "Submit Report"}
          </button>

          <button
            type="button"
            onClick={resetForm}
          >
            Cancel
          </button>
        </form>
      )}

      {/* Claim Form */}
      {claimingItemId !== null && (
        <div className="claim-form-container">
          <form
            className="claim-form"
            onSubmit={handleSubmitClaim}
          >
            <h2>Claim Found Item</h2>

            <p>
              Explain why this item belongs to you. Include details
              that can help staff verify your ownership.
            </p>

            <label>Claim Description</label>

            <textarea
              value={claimDescription}
              onChange={(e) =>
                setClaimDescription(e.target.value)
              }
              placeholder="Describe the item and provide proof of ownership..."
              rows={5}
              required
            />

            <button type="submit">
              Submit Claim
            </button>

            <button
              type="button"
              onClick={() => {
                setClaimingItemId(null);
                setClaimDescription("");
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Items Table */}
      <div className="items-table-container">
        <div className="items-table-header">
          <h2>Reported Items</h2>

          <input
            type="text"
            placeholder="Search item name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p>Loading items...</p>
        ) : (
          <table className="items-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Item Name</th>
                <th>Type</th>
                <th>Category</th>
                <th>Location</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <tr key={item.item_id}>
                    <td>
                      {item.image_path ? (
                        <img
                          src={getImageUrl(item.image_path)}
                          alt={item.item_name}
                          style={{
                            width: "70px",
                            height: "70px",
                            objectFit: "cover",
                            borderRadius: "6px",
                          }}
                        />
                      ) : (
                        "No image"
                      )}
                    </td>

                    <td>{item.item_name}</td>

                    <td>{item.item_type}</td>

                    <td>{item.category_name || "N/A"}</td>

                    <td>{item.location_name || "N/A"}</td>

                    <td>
                      {String(item.date_lost_found).slice(0, 10)}
                    </td>

                    <td>{item.status}</td>

                    <td>
                      {/* Student can claim found items */}
                      {isStudent &&
                        item.item_type === "found" &&
                        item.status !== "claimed" &&
                        item.status !== "returned" && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenClaim(item.item_id)
                            }
                          >
                            Claim Item
                          </button>
                        )}

                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(item.item_id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8}>No items found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Items;