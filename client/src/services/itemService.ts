import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export interface Item {
  item_id: number;
  item_name: string;
  description: string | null;
  identifying_details?: string | null;
  color: string | null;
  brand: string | null;
  item_type: "lost" | "found";
  date_lost_found: string;
  status: string;
  category_name: string | null;
  location_name: string | null;
  first_name: string | null;
  last_name: string | null;
  category_id: number;
  location_id: number;
  image_path?: string | null;
}

export interface AddItemData {
  category_id: number;
  location_id: number;
  item_name: string;
  description: string;
  identifying_details: string;
  color: string;
  brand: string;
  item_type: "lost" | "found";
  date_lost_found: string;
  image?: File | null;
}

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Location {
  location_id: number;
  location_name: string;
}

// Convert item data into FormData
const createItemFormData = (itemData: AddItemData) => {
  const formData = new FormData();

  formData.append("category_id", String(itemData.category_id));
  formData.append("location_id", String(itemData.location_id));
  formData.append("item_name", itemData.item_name);
  formData.append("description", itemData.description);
  formData.append("identifying_details", itemData.identifying_details);
  formData.append("color", itemData.color);
  formData.append("brand", itemData.brand);
  formData.append("item_type", itemData.item_type);
  formData.append("date_lost_found", itemData.date_lost_found);

  if (itemData.image) {
    formData.append("image", itemData.image);
  }

  return formData;
};

// GET ITEMS
export const getItems = async (): Promise<Item[]> => {
  const response = await axios.get(
    `${API_URL}/items`,
    getAuthConfig()
  );

  return response.data;
};

// ADD ITEM
export const addItem = async (itemData: AddItemData) => {
  const response = await axios.post(
    `${API_URL}/items`,
    createItemFormData(itemData),
    getAuthConfig()
  );

  return response.data;
};

// GET CATEGORIES
export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(
    `${API_URL}/items/categories`,
    getAuthConfig()
  );

  return response.data;
};

// GET LOCATIONS
export const getLocations = async (): Promise<Location[]> => {
  const response = await axios.get(
    `${API_URL}/items/locations`,
    getAuthConfig()
  );

  return response.data;
};

// UPDATE ITEM
export const updateItem = async (
  id: number,
  itemData: AddItemData
) => {
  const response = await axios.put(
    `${API_URL}/items/${id}`,
    createItemFormData(itemData),
    getAuthConfig()
  );

  return response.data;
};

// DELETE ITEM
export const deleteItem = async (id: number) => {
  const response = await axios.delete(
    `${API_URL}/items/${id}`,
    getAuthConfig()
  );

  return response.data;
};