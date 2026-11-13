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

// ==========================================
// CLAIM INTERFACE
// ==========================================
export interface Claim {
  claim_id: number;
  item_id: number;
  claimant_id: number;
  claim_description: string;
  claim_status: "pending" | "approved" | "rejected" | "cancelled";
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  item_name: string;
  item_type: "lost" | "found";
  first_name: string;
  last_name: string;
}

// ==========================================
// RETURN INTERFACE
// ==========================================
export interface ItemReturn {
  return_id: number;
  claim_id: number;
  item_id: number;
  claimant_id: number;
  returned_by: number;
  receiver_name: string;
  return_notes: string | null;
  returned_at: string;
  item_name: string;
  item_type: "lost" | "found";
  claimant_first_name: string;
  claimant_last_name: string;
  staff_first_name: string;
  staff_last_name: string;
}

// ==========================================
// GET CLAIMS
// ==========================================
export const getClaims = async (): Promise<Claim[]> => {
  const response = await axios.get(
    `${API_URL}/claims`,
    getAuthConfig()
  );

  return response.data;
};

// ==========================================
// SUBMIT A CLAIM
// ==========================================
export const submitClaim = async (
  item_id: number,
  claim_description: string
) => {
  const response = await axios.post(
    `${API_URL}/claims`,
    {
      item_id,
      claim_description,
    },
    getAuthConfig()
  );

  return response.data;
};

// ==========================================
// APPROVE OR REJECT A CLAIM
// ==========================================
export const reviewClaim = async (
  id: number,
  claim_status: "approved" | "rejected"
) => {
  const response = await axios.patch(
    `${API_URL}/claims/${id}/review`,
    { claim_status },
    getAuthConfig()
  );

  return response.data;
};

// ==========================================
// MARK CLAIM AS RETURNED
// ==========================================
export const markClaimAsReturned = async (
  id: number,
  receiver_name: string,
  return_notes: string
) => {
  const response = await axios.patch(
    `${API_URL}/claims/${id}/return`,
    {
      receiver_name,
      return_notes,
    },
    getAuthConfig()
  );

  return response.data;
};

// ==========================================
// GET RETURN HISTORY
// ==========================================
export const getReturnHistory = async (): Promise<ItemReturn[]> => {
  const response = await axios.get(
    `${API_URL}/claims/returns`,
    getAuthConfig()
  );

  return response.data;
};