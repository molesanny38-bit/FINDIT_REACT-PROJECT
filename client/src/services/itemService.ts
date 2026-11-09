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
}

export const getItems = async (): Promise<Item[]> => {
  const response = await axios.get(
    `${API_URL}/items`,
    getAuthConfig()
  );

  return response.data;
};

export const addItem = async (itemData: AddItemData) => {
  const response = await axios.post(
    `${API_URL}/items`,
    itemData,
    getAuthConfig()
  );

  return response.data;
};

export interface Category {
  category_id: number;
  category_name: string;
}

export interface Location {
  location_id: number;
  location_name: string;
}

export const getCategories = async (): Promise<Category[]> => {
  const response = await axios.get(
    `${API_URL}/items/categories`,
    getAuthConfig()
  );

  return response.data;
};

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
    itemData,
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