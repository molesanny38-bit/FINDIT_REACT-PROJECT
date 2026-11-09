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

function Items() 
{
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

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

  });

  const handleEdit = (item: Item) => {
  setEditingId(item.item_id);

  setFormData({
    category_id: item.category_id,
    location_id: item.location_id,
    item_name: item.item_name,
    description: item.description || "",
    identifying_details: "",
    color: item.color || "",
    brand: item.brand || "",
    item_type: item.item_type,
    date_lost_found: String(item.date_lost_found).slice(0, 10),
  });

  
  setShowForm(true);
  setMessage("");
};
  const loadItems = async () => {
    try {
      setLoading(true);
      const data = await getItems();
      setItems(data);
    } catch (error) {
      console.error("Failed to load items:", error);
      setMessage("Unable to load items. Please log in again if your session expired.");
    } finally {
      setLoading(false);
    }
  };

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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
    });

    setEditingId(null);
    setShowForm(false);

    await loadItems();
  } catch (error) {
    console.error("Failed to save item:", error);
    setMessage("Failed to save item. Please check your information.");
  }
};

const handleDelete = async (id: number) => {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this item?"
  );

  if (!confirmDelete) return;

  try {
    await deleteItem(id);

    setMessage("Item deleted successfully!");
    loadItems();
  } catch (error) {
    console.error("Error deleting item:", error);
    setMessage("Failed to delete item.");
  }
};

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="items-page">
      <div className="items-header">
        <div>
          <h1>Items Management</h1>
          <p>Manage lost and found item reports.</p>
        </div>

        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Close Form" : "+ Report Item"}
        </button>
      </div>

      {message && <p className="items-message">{message}</p>}

      {showForm && (
        <form className="item-form" onSubmit={handleSubmit}>
          <h2>{editingId !== null ? "Edit Item": "Report a Lost or Found Item"}</h2>
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

          <button type="submit">
  {editingId !== null ? "Update Item" : "Submit Report"}
</button>

<button
  type="button"
  onClick={() => {
    setShowForm(false);
    setEditingId(null);

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
    });
  }}
>
  Cancel
</button>
        </form>
      )}

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
                filteredItems.map((item) => 
               (
                  <tr key={item.item_id}>
                    <td>{item.item_name}</td>
                    <td>{item.item_type}</td>
                    <td>{item.category_name || "N/A"}</td>
                    <td>{item.location_name || "N/A"}</td>
                    <td>
                    <button onClick={() => handleEdit(item)}>
                    Edit
                   </button>
                    <button onClick={() => handleDelete(item.item_id)}>
                        Delete
                   </button>
                    </td>
                    <td>
                      {String(item.date_lost_found).slice(0, 10)}
                    </td>
                    <td>{item.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7}>No items found.</td>
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