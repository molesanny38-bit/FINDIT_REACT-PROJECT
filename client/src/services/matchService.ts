import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export interface Match {
  match_id: number;
  lost_item_id: number;
  found_item_id: number;
  matching_percentage: number;
  match_status: "suggested" | "confirmed" | "dismissed";
  created_at: string;

  // Lost item information
  lost_item_name: string;
  lost_description: string;
  lost_color: string | null;
  lost_brand: string | null;
  lost_category: string;
  lost_location: string;
  lost_owner: string;
  lost_image_path: string | null;

  // Found item information
  found_item_name: string;
  found_description: string;
  found_color: string | null;
  found_brand: string | null;
  found_category: string;
  found_location: string;
  found_owner: string;
  found_image_path: string | null;
}

export const getMatches = async (): Promise<Match[]> => {
  const token = localStorage.getItem("token");

  const response = await axios.get(`${API_URL}/matches`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateMatchStatus = async (
  matchId: number,
  match_status: "confirmed" | "dismissed"
) => {
  const token = localStorage.getItem("token");

  const response = await axios.patch(
    `${API_URL}/matches/${matchId}/status`,
    { match_status },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};