/**
 * Manual Client API Service
 * Handles all API calls for manual CRM-style client management
 * These clients are stored in a separate table (manual_clients)
 * and have no connection to Fittbot app
 */

import axiosInstance from "./axiosInstance";

/**
 * Add a new manual client
 * @param {Object} payload - Client data
 * @param {number} payload.gym_id - Gym ID
 * @param {string} payload.name - Client name (required)
 * @param {string} payload.contact - Contact number (required)
 * @param {string} payload.email - Email (optional)
 * @param {string} payload.gender - Gender (optional)
 * @param {string} payload.date_of_birth - DOB in YYYY-MM-DD format (optional)
 * @param {string} payload.admission_number - Custom admission number (optional)
 * @param {number} payload.plan_id - Plan ID (required)
 * @param {number} payload.batch_id - Batch ID (required)
 * @param {string} payload.joined_at - Join date in YYYY-MM-DD format
 * @param {string} payload.expires_at - Expiry date in YYYY-MM-DD format
 * @param {number} payload.admission_fee - Admission fee
 * @param {number} payload.monthly_fee - Monthly fee
 * @param {number} payload.discount_amount - Discount amount
 * @param {number} payload.total_paid - Amount paid
 * @param {number} payload.balance_due - Balance due
 * @param {string} payload.payment_method - Payment method
 * @param {string} payload.notes - Additional notes (optional)
 * @param {string} payload.entry_type - Always "manual"
 */
export const addManualClientAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/manual/add_client`, payload);
    return res?.data;
  } catch (err) {
    console.error("Error adding manual client:", err);
    return err?.response?.data || { status: 500, detail: "Failed to add client" };
  }
};

/**
 * Update a manual client
 * @param {number} clientId - Manual client ID
 * @param {Object} payload - Updated client data
 */
export const updateManualClientAPI = async (clientId, payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/manual/update_client/${clientId}`, payload);
    return res?.data;
  } catch (err) {
    console.error("Error updating manual client:", err);
    return err?.response?.data || { status: 500, detail: "Failed to update client" };
  }
};

/**
 * Delete a manual client
 * @param {number} clientId - Manual client ID
 * @param {number} gymId - Gym ID
 */
export const deleteManualClientAPI = async (clientId, gymId) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/manual/delete_client/${clientId}?gym_id=${gymId}`);
    return res?.data;
  } catch (err) {
    console.error("Error deleting manual client:", err);
    return err?.response?.data || { status: 500, detail: "Failed to delete client" };
  }
};

/**
 * Get all manual clients for a gym
 * @param {number} gymId - Gym ID
 */
export const getManualClientsAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/manual/clients?gym_id=${gymId}`);
    return res?.data;
  } catch (err) {
    console.error("Error fetching manual clients:", err);
    return err?.response?.data || { status: 500, detail: "Failed to fetch clients" };
  }
};

/**
 * Lookup a client by contact number (to check if already exists)
 * @param {string} contact - Contact number
 * @param {number} gymId - Gym ID
 */
export const lookupManualClientAPI = async (contact, gymId) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/manual/lookup?contact=${contact}&gym_id=${gymId}`);
    return res?.data;
  } catch (err) {
    console.error("Error looking up client:", err);
    return err?.response?.data || { status: 500, detail: "Failed to lookup client" };
  }
};

/**
 * Punch in a manual client (owner does this)
 * @param {number} clientId - Manual client ID
 * @param {number} gymId - Gym ID
 */
export const manualPunchInAPI = async (clientId, gymId) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/manual/punch_in`, {
      client_id: clientId,
      gym_id: gymId,
      punch_type: "in",
    });
    return res?.data;
  } catch (err) {
    console.error("Error punching in:", err);
    return err?.response?.data || { status: 500, detail: "Failed to punch in" };
  }
};

/**
 * Punch out a manual client (owner does this)
 * @param {number} clientId - Manual client ID
 * @param {number} gymId - Gym ID
 */
export const manualPunchOutAPI = async (clientId, gymId) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/manual/punch_out`, {
      client_id: clientId,
      gym_id: gymId,
      punch_type: "out",
    });
    return res?.data;
  } catch (err) {
    console.error("Error punching out:", err);
    return err?.response?.data || { status: 500, detail: "Failed to punch out" };
  }
};

/**
 * Update fee/payment for a manual client (legacy)
 * @param {Object} payload - Fee update data
 * @param {number} payload.client_id - Manual client ID
 * @param {number} payload.gym_id - Gym ID
 * @param {number} payload.amount - Payment amount
 * @param {string} payload.payment_method - Payment method
 * @param {string} payload.payment_reference - Payment reference (optional)
 * @param {string} payload.new_expiry_date - New expiry date if extending (optional)
 * @param {string} payload.notes - Notes (optional)
 */
export const updateManualClientFeeAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/manual/update_fee`, payload);
    return res?.data;
  } catch (err) {
    console.error("Error updating fee:", err);
    return err?.response?.data || { status: 500, detail: "Failed to update fee" };
  }
};

/**
 * Update fee status for a manual client (full flow with FittbotGymMembership, FeesReceipt)
 * Similar to normal update_fee_status but for manual clients
 * @param {Object} payload - Fee status update data
 * @param {number} payload.manual_client_id - Manual client ID
 * @param {number} payload.gym_id - Gym ID
 * @param {number} payload.plan_id - Plan ID
 * @param {number} payload.batch_id - Batch ID (optional)
 * @param {number} payload.fees - Plan amount
 * @param {number} payload.total_amount - Amount after discount
 * @param {number} payload.discount_amount - Discount amount (optional)
 * @param {string} payload.payment_method - Payment method (optional)
 * @param {string} payload.joined_at - Start date YYYY-MM-DD (optional)
 * @param {string} payload.expires_at - Expiry date YYYY-MM-DD (optional)
 */
export const updateManualClientFeeStatusAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/manual/update_fee_status`, payload);
    return res?.data;
  } catch (err) {
    console.error("Error updating fee status:", err);
    return err?.response?.data || { status: 500, detail: "Failed to update fee status" };
  }
};

/**
 * Get fee history for a manual client
 * @param {number} clientId - Manual client ID
 * @param {number} gymId - Gym ID
 */
export const getManualClientFeeHistoryAPI = async (clientId, gymId) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/manual/fee_history/${clientId}?gym_id=${gymId}`);
    return res?.data;
  } catch (err) {
    console.error("Error fetching fee history:", err);
    return err?.response?.data || { status: 500, detail: "Failed to fetch fee history" };
  }
};

/**
 * Get attendance history for a manual client
 * @param {number} clientId - Manual client ID
 * @param {number} gymId - Gym ID
 * @param {string} startDate - Start date (optional, YYYY-MM-DD)
 * @param {string} endDate - End date (optional, YYYY-MM-DD)
 */
export const getManualClientAttendanceAPI = async (clientId, gymId, startDate = null, endDate = null) => {
  try {
    let url = `/owner/gym/manual/attendance/${clientId}?gym_id=${gymId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    const res = await axiosInstance.get(url);
    return res?.data;
  } catch (err) {
    console.error("Error fetching attendance:", err);
    return err?.response?.data || { status: 500, detail: "Failed to fetch attendance" };
  }
};

/**
 * Get presigned URL for client DP upload
 * @param {number} gymId - Gym ID
 */
export const getClientPhotoUploadUrlAPI = async (gymId) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/manual/dp-upload-url`, {
      gym_id: parseInt(gymId),
    });
    return res?.data;
  } catch (err) {
    console.error("Error getting photo upload URL:", err);
    return err?.response?.data || { status: 500, detail: "Failed to get upload URL" };
  }
};

/**
 * Confirm client photo upload
 * @param {number} photoId - Photo ID from presigned response
 */
export const confirmClientPhotoUploadAPI = async (photoId) => {
  try {
    const res = await axiosInstance.post(`/gym_photos/confirm`, {
      photo_id: photoId,
    });
    return res?.data;
  } catch (err) {
    console.error("Error confirming photo upload:", err);
    return err?.response?.data || { status: 500, detail: "Failed to confirm upload" };
  }
};

export default {
  addManualClientAPI,
  updateManualClientAPI,
  deleteManualClientAPI,
  getManualClientsAPI,
  lookupManualClientAPI,
  manualPunchInAPI,
  manualPunchOutAPI,
  updateManualClientFeeAPI,
  updateManualClientFeeStatusAPI,
  getManualClientFeeHistoryAPI,
  getManualClientAttendanceAPI,
  getClientPhotoUploadUrlAPI,
  confirmClientPhotoUploadAPI,
};
