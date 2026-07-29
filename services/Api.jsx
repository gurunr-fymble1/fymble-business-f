import axios from "axios";
import axiosInstance from "./axiosInstance";
import apiConfig from "./apiConfig";
import { showToast } from "../utils/Toaster";
const baseURL = apiConfig.API_URL;

export const loginAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/owner/new_registration/login`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const registerAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/auth/new_gym_owner_registration`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const registerDigitalAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/owner/new_registration/register`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const changePasswordAPI = async (payload) => {
  try {
    const res = await axios.post(`${baseURL}/auth/change-password`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const forgotpasswordAPI = async (data, type) => {
  try {
    const res = await axios.post(`${baseURL}/auth/send-otp`, { data, type });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const VerifyOTPAPI = async (data, otp) => {
  try {
    const res = await axios.post(`${baseURL}/auth/verify-otp`, { data, otp });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const checkTrainerAPI = async (contact) => {
  try {
    const res = await axios.post(`${baseURL}/auth/check-trainer`, {
      contact: contact,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const setTrainerPasswordAPI = async (contact, password) => {
  try {
    const res = await axios.post(`${baseURL}/auth/set-trainer-password`, {
      contact: contact,
      password: password,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const addWorkoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_workout_template/addworkouttemplate`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getWorkoutTemplateAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/gym_workout_template/addworkouttemplate`,
      {
        params: {
          gym_id: gym_id,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFittbotWorkoutAPI = async () => {
  try {
    const res = await axiosInstance.get(
      `/gym_workout_template/get_fittbot_workout`,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editWorkoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/gym/addworkouttemplate`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteWorkoutTemplateAPI = async (id, gym_id) => {
  try {
    const res = await axiosInstance.delete(
      `/gym_workout_template/addworkouttemplate`,
      {
        params: {
          id: id,
          gym_id,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editAllWorkoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/gym_workout_template/editworkouttemplate`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFeedPostAPI = async (
  gym_id,
  client_id,
  role,
  page = 1,
  limit = 20,
) => {
  try {
    const res = await axiosInstance.get(`/owner/get_post`, {
      params: {
        gym_id: gym_id,
        client_id: client_id,
        role: role,
        page: page,
        limit: limit,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createFeedPostAPI = async (payload) => {
  try {
    const response = await axiosInstance.post(`/owner/create_post`, payload, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 30000,
    });

    if (!response) {
      throw new Error("No response received from server");
    }

    return {
      status: response.status || 500,
      data: response.data || null,
      message: response.data?.message || "Post created successfully",
    };
  } catch (error) {
    showToast({
      type: "error",
      title: "API Error",
      desc: error.message,
    });
  }
};

export const likeFeedPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/post_likes`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createCommentPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/create_comment`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getCommentPostAPI = async (gym_id, post_id, client_id, role) => {
  try {
    const res = await axiosInstance.get(`/owner/fetch_comment`, {
      params: {
        gym_id,
        post_id,
        client_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getProfileDataAPI = async (
  gym_id,
  owner_id,
  client_id,
  trainer_id,
  role,
) => {
  try {
    const res = await axiosInstance.get(`/owner/profile_data`, {
      params: {
        gym_id,
        client_id,
        owner_id,
        trainer_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getOwnerGymBasicDetailsAPI = async (gym_id, owner_id) => {
  try {
    const res = await axiosInstance.get(`/owner/profile/gym_basic_details`, {
      params: {
        gym_id,
        owner_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getOwnerPersonalDetailsAPI = async (owner_id) => {
  try {
    const res = await axiosInstance.get(
      `/owner/profile/owner_personal_details`,
      {
        params: {
          owner_id,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateOwnerPersonalDetailsAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/profile/owner_personal_details`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateGymBasicDetailsAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/profile/gym_basic_details`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const checkMobileExistsAPI = async (mobile, owner_id) => {
  try {
    const res = await axiosInstance.post(`/owner/profile/check_mobile_exists`, {
      mobile,
      owner_id,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const sendMobileChangeOtpAPI = async (owner_id, mobile, step) => {
  try {
    const res = await axiosInstance.post(
      `/owner/profile/send_mobile_change_otp`,
      {
        owner_id,
        mobile,
        step,
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const verifyMobileChangeOtpAPI = async (owner_id, mobile, otp, step) => {
  try {
    const res = await axiosInstance.post(
      `/owner/profile/verify_mobile_change_otp`,
      {
        owner_id,
        mobile,
        otp,
        step,
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateMobileNumberAPI = async (owner_id, new_mobile) => {
  try {
    const res = await axiosInstance.post(
      `/owner/profile/update_mobile_number`,
      {
        owner_id,
        new_mobile,
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// Payment Details APIs
export const getPaymentDetailsAPI = async (owner_id, gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/profile/payment_details`, {
      params: { owner_id, gym_id },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const submitPaymentDetailsEditRequestAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner/profile/payment_details_edit_request`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getPaymentDetailsEditRequestStatusAPI = async (
  owner_id,
  gym_id,
) => {
  try {
    const res = await axiosInstance.get(
      `/owner/profile/payment_details_edit_request_status`,
      {
        params: { owner_id, gym_id },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateUpiGstDetailsAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/profile/payment_details_upi_gst`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const editPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/edit_post`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deletePostAPI = async (gym_id, post_id, role) => {
  try {
    const res = await axiosInstance.delete(`/owner/delete_post`, {
      params: {
        gym_id,
        post_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteCommentAPI = async (comment_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/delete_comment`, {
      params: {
        comment_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getLikesDataAPI = async (gym_id, post_id) => {
  try {
    const res = await axiosInstance.get(`/owner/liked_by_names`, {
      params: {
        gym_id,
        post_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientDataAPI = async (gym_id, client_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/client_data`, {
      params: {
        gym_id,
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymHomeDataAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/home/all`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getmembersDataAPI = async (gym_id, month = null, year = null) => {
  try {
    const params = { gym_id };
    if (month) {
      params.month = month;
    }

    if (year) {
      params.year = year;
    }

    const res = await axiosInstance.get(`/owner/members/all`, {
      params,
    });

    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getCollectionSummaryAPI = async (
  gym_id,
  scope,
  start_date = null,
  end_date = null,
  month = null,
  year = null,
) => {
  try {
    const params = {
      gym_id,
      scope,
    };

    if (scope === "custom_interval" && start_date && end_date) {
      params.start_date = start_date;
      params.end_date = end_date;
    } else if (scope === "specific_month_year" && month && year) {
      params.month = month;
      params.year = year;
    }

    const res = await axiosInstance.get(`/ledger/collection_summary`, {
      params,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getExpenditureListAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/ledger/view_expenditure`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addExpendituresAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/ledger/add_expenditure`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// export const getClientsAPI = async (gym_id) => {
//   try {
//     const res = await axiosInstance.get(`/owner/gym/client`, {
//       params: {
//         gym_id,
//       },
//     });
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

export const getClientsAPI = async (gym_id, role = null, trainer_id = null) => {
  try {
    const params = { gym_id };

    if (role) {
      params.role = role;
    }
    if (trainer_id) {
      params.trainer_id = trainer_id;
    }

    const res = await axiosInstance.get(`/owner/gym/client`, {
      params,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getTrainerAssignedClientsAPI = async (gym_id, trainer_id) => {
  try {
    const res = await axiosInstance.get(`/owner/trainer/assigned_clients`, {
      params: {
        gym_id,
        trainer_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymPlanAPI = async (plan_id, payload) => {
  try {
    const res = await axiosInstance.put(
      `/api/v2/business/gym_plan/${plan_id}`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getDailypassPreviewAPI = async (monthly_price, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/dailypass_preview`, {
      params: { monthly_price },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const getPtPacksPreviewAPI = async (monthly_price, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/pt_preview`, {
      params: { monthly_price },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const getGymPlansAPI = async (gym_id, category, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/gym_plans`, {
      params: { gym_id, ...(category ? { category } : {}) },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const setupGymPlansAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/api/v2/business/gym_plans/setup`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const bulkUpdateGymPlansAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/api/v2/business/gym_plans/bulk_update`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ─── Sessions (Fitness Class) APIs ───────────────────────────────────────────

export const getSessionsCatalogAPI = async (gym_id, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/sessions/catalog`, {
      params: { gym_id },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const getSessionsPreviewAPI = async (monthly_price, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/sessions/preview`, {
      params: { monthly_price },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const setupSessionAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/api/v2/business/sessions/setup`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getSessionDetailAPI = async (gym_id, session_id, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/sessions/detail`, {
      params: { gym_id, session_id },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const updateSessionAPI = async (session_id, payload) => {
  try {
    const res = await axiosInstance.put(`/api/v2/business/sessions/${session_id}`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ─── Personal Training (PT) APIs ────────────────────────────────────────────

export const getPtOverviewAPI = async (gym_id, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/pt`, {
      params: { gym_id },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const getPtPreviewAPI = async (monthly_price, { signal } = {}) => {
  try {
    const res = await axiosInstance.get(`/api/v2/business/pt/preview`, {
      params: { monthly_price },
      signal,
    });
    return res?.data;
  } catch (err) {
    if (err?.code === "ERR_CANCELED") throw err;
    return err?.response?.data;
  }
};

export const setupPtAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/api/v2/business/pt/setup`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const setPtTrainerSlotsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/api/v2/business/pt/trainer-slots`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getPlansandBatchesAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/pnb/gym/plans_and_batches`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFeeDetailsAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_fee_details`, {
      params: {
        training_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateFeeStatusAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner/gym/update_fee_status`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteFeeStatusAPI = async (id, gymId) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_fee_status`, {
      params: {
        client_id: id,
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getAnalysisAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/hourly_agg`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_client_data`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addTrainerAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/trainers/gym/add_trainer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getTrainersAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/trainers/gym/get_trainers`, {
      params: {
        gym_id: gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateTrainerAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/trainers/gym/edit_trainer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteTrainerAPI = async (id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/trainers/gym/delete_trainer`, {
      params: {
        trainer_id: id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// New API function to get trainer permissions for a specific gym
export const getTrainerPermissionsAPI = async (trainer_id, gym_id) => {
  try {
    const res = await axiosInstance.get(`/trainers/gym/trainer_permissions`, {
      params: {
        trainer_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPlanAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/pnb/gym/add_plan`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
export const addPlanBulkAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/pnb/gym/add_quick_plan`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editPlanAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/pnb/gym/edit_plan`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deletePlanAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/pnb/gym/delete_plan`, {
      params: {
        id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addBatchAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/pnb/gym/add_batch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editBatchAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/pnb/gym/edit_batch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteBatchAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/pnb/gym/delete_batch`, {
      params: {
        batch_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/adddiettemplate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDietTemplateAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/gym_diet_template/get_diet_template`,
      {
        params: {
          gym_id: gym_id,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteDietTemplateAPI = async (id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/deletediettemplate`, {
      params: {
        id: id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editAllDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/editdiettemplate`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getImportableTemplatesAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(
      `/gym_diet_template/get_importable_templates`,
      {
        params: { gym_id: gymId },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const importTemplatesAPI = async (templateIds, targetGymId) => {
  try {
    const res = await axiosInstance.post(
      `/gym_diet_template/import_templates`,
      {
        template_ids: templateIds,
        target_gym_id: targetGymId,
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getAsssignmentsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym_assigned_data`, {
      params: {
        gym_id: gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateProfileAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update_profile`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const assignTrainerAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/assign_trainer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFeedbacksAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/feedback`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getConversationsAPI = async (gym_id, user_id) => {
  try {
    const res = await axiosInstance.get(`/owner/conversations`, {
      params: {
        gym_id,
        user_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getMessagesAPI = async (gym_id, user_id, owner_id) => {
  try {
    const res = await axiosInstance.get(`/owner/owner_messages`, {
      params: {
        gym_id,
        user_id,
        owner_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send_message_owners`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getUnverifiedClientsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/pending_clients`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateUnverifiedClientsAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/gym/edit_pending_clients`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteUnverifiedClientsAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/delete_pending_client`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateVerificationStatusAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/auth/update_verification_status`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendEmailVerificationOTPAPI = async (payload) => {
  try {
    const res = await axios.post(
      `${baseURL}/auth/send_verification_otp`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const resendOTPAPI = async (data, type, role, id) => {
  try {
    const res = await axios.post(`${baseURL}/auth/resend-otp`, {
      data,
      type,
      role,
      id,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getRewardsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/rewards_section/get_rewards`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createRewardAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/rewards_section/create_rewards`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateRewardAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/rewards_section/update_rewards`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteRewardAPI = async (reward_id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/rewards_section/delete_rewards`, {
      params: {
        reward_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const confirmRewardImageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/rewards_section/confirm_reward_image`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPrizeListAPI = async (gym_id, status) => {
  try {
    const res = await axiosInstance.get(`/gym_prizes/get_prizes`, {
      params: {
        gym_id,
        status,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymLocationAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/get_location`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymLocationAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym/add_location`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const changeGymLocationAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/edit_location`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// Get presigned URL for gym location image upload
export const getGymLocationPresignedAPI = async (gym_id, extension) => {
  try {
    const res = await axiosInstance.get(
      `/owner_registration/upload_current_pic`,
      {
        params: {
          gym_id,
          extension,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// Save gym location with image
export const saveGymLocationWithImageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner_registration/upload_current_pic_confirm`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const reportPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/report_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const blockPostAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/block_user`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const FetchBlockedUsersAPI = async (client_id, role) => {
  try {
    const res = await axiosInstance.get(`/owner/get_blocked_users`, {
      params: {
        client_id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const UnblockUserAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/unblock_users`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const checkPlanAssignmentsAPI = async (planId) => {
  try {
    const res = await axiosInstance.get(`/owner/check-plan-assignments`, {
      params: {
        plan_id: planId,
      },
    });
    return res?.data;
  } catch (error) {
    return error?.response.data;
  }
};

export const checkBatchAssignmentsAPI = async (batchId) => {
  try {
    const res = await axiosInstance.get(`/owner/check-batch-assignments`, {
      params: {
        batch_id: batchId,
      },
    });
    return res?.data;
  } catch (error) {
    return error?.response.data;
  }
};

export const getUsersWithPlansAndBatchesAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/clients-with-plans`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateUserPlanAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-client-plan`, payload);
    return res?.data;
  } catch (err) {
    return err.response?.data;
  }
};

export const updateUserBatchAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-client-batch`, payload);
    return res?.data;
  } catch (err) {
    return err.response?.data;
  }
};

export const updateGivenPrizeAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/gym_prizes/give_prize`, payload);
    return res?.data;
  } catch (err) {
    return err.response?.data;
  }
};

export const AddExpenditureAPI = async (payload) => {
  try {
    // const res = await axiosInstance.post(`/owner/add-expenditure`, payload);
    const res = await axiosInstance.post(`/ledger/add_expenditure`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const UpdateExpenditureAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/ledger/update_expenditure`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const DeleteExpenditureAPI = async (gym_id, expense_id) => {
  try {
    const res = await axiosInstance.delete(`/ledger/delete_expenditure`, {
      params: {
        gym_id,
        expense_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const UpdateInvoiceDiscount = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/update-invoice`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// ----------------- handle to client enquiries -----------------

export const AddClientEnquiry = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/gym-enquiries`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientEnquiry = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym-enquiries`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateClientEnquiryStatus = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/owner/update-enquiry-status`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ----------------- Gym Plans or Brochure -----------------

export const PostGymPlansImages = async (formData) => {
  try {
    const res = await axiosInstance.post(
      `/gym_brochures/update-gym-brochures`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: "Something went wrong. Please try again.",
    };
  }
};

export const getGymPlansImages = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_brochures/get-gym-brochures`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// ----------------- Estimate and receipts -----------------

export const SendEstimatesToExpireMembers = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send-estimates`, payload);
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: "Something went wrong. Please try again.",
    };
  }
};

export const SendReceiptsToPaidMembers = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send-receipts`, payload);
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: "Something went wrong. Please try again.",
    };
  }
};

export const GetReceiptForPaidMembers = async (
  gym_id,
  month = null,
  year = null,
  page = 1,
  limit = 25,
) => {
  try {
    const params = { gym_id };

    if (month) {
      params.month = month;
    }

    if (year) {
      params.year = year;
    }

    if (!month || !year) {
      params.page = page;
      params.limit = limit;
    }

    const res = await axiosInstance.get(`/owner/fees-receipts`, {
      params,
    });

    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const fetchImportDataAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/get-export-data`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const ImportDataAPI = async (formData) => {
  try {
    const res = await axiosInstance.post(`/owner/import_gym_data`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res?.data;
  } catch (err) {
    if (err.response && err.response.data) {
      return err.response.data;
    }
    return {
      status: 500,
      message: "Something went wrong. Please try again.",
    };
  }
};

export const sendIntimationsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/send-intimations`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientFromQRAPI = async (qrData, gymId) => {
  try {
    const res = await axiosInstance.get(`/client_data_qr/get`, {
      params: {
        id: qrData.id,
        plan_type: qrData.type,
        gym_id: gymId,
        client_id: qrData.client_id ? qrData.client_id : null,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getSingleDietTemplate = async (gym_id, template_id) => {
  try {
    const res = await axiosInstance.get(
      `/gym_diet_template/get_single_diettemplate`,
      {
        params: {
          gym_id,
          template_id,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/gym_diet_template/update_diet_template`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getNewbiesListAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/newbies`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const supportAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/support_token_owner/generate`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getGymAnnouncementsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_announcements/announcements`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteAnnouncementAPI = async (announcement_id) => {
  try {
    const res = await axiosInstance.delete(`/gym_announcements/announcements`, {
      params: {
        announcement_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addAnnouncementAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_announcements/announcements`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateAnnouncementAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/gym_announcements/announcements`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymOffersAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_announcements/offers`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const OTPVerificationAPI = async (data, otp, role) => {
  try {
    const res = await axios.post(
      `${baseURL}/owner/new_registration/otp_verification`,
      {
        data,
        otp,
        role,
        device: "mobile",
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymRewardsQuestAPI = async () => {
  try {
    const res = await axiosInstance.get(`/owner/rewards/quest`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymAnnouncementsAPI2 = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_feed/get_announcements`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const postGymAnnouncementsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_feed/add_announcement`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymAnnouncementsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_feed/update_announcement`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteGymAnnouncementsAPI = async (payload) => {
  try {
    const { gym_id, announcement_id } = payload;
    const res = await axiosInstance.delete(`/gym_feed/delete_announcement`, {
      params: {
        gym_id,
        announcement_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymOffersAPI2 = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_offers/get_offer`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const postGymOffersAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_feed/add_offer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateGymOffersAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_offers/update_offer`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteGymOffersAPI = async (payload) => {
  try {
    const { gym_id, offer_id } = payload;
    const res = await axiosInstance.delete(`/gym_offers/delete_offer`, {
      params: {
        gym_id,
        offer_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const createOfferWithImage = async (offerData) => {
  try {
    const response = await axiosInstance.post(
      "/gym_offers/add_offer",
      offerData,
    );
    return response.data;
  } catch (error) {
    console.error("Create offer error:", error);
    throw error;
  }
};

export const confirmOfferImage = async (offerId, cdnUrl) => {
  try {
    const response = await axiosInstance.post(
      "/gym_offers/confirm_offer_image",
      {
        offer_id: offerId,
        cdn_url: cdnUrl,
      },
    );
    return response.data;
  } catch (error) {
    console.error("Confirm image error:", error);
    throw error;
  }
};

export const updateOfferWithImage = async (offerData) => {
  try {
    const response = await axiosInstance.post(
      "/gym_offers/update_offer",
      offerData,
    );
    return response.data;
  } catch (error) {
    console.error("Create offer error:", error);
    throw error;
  }
};

//--------------------- Expo token api ---------------------

export const updateExpoTokenAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner_expo/update_expo_token`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getBrochurePresignedUrls = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/gym_brochures/presigned-urls`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000,
      },
    );

    if (!response) {
      throw new Error("No response received from server");
    }

    return response.data;
  } catch (error) {
    showToast({
      type: "error",
      title: "API Error",
      desc: error.message,
    });
  }
};

export const confirmBrochureUpload = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_brochures/confirm`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteBrochure = async (brochure_id) => {
  try {
    const res = await axiosInstance.delete(`/gym_brochures/delete_brochure`, {
      params: {
        brochure_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addNewGymsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/new_gyms/add_gyms`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addNewGymToOwnerAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner_registration/add_new_gym`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getOwnerGymsAPI = async (owner_id) => {
  try {
    const res = await axiosInstance.get(`/owner_registration/get_owner_gyms`, {
      params: { owner_id },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const GetEnquiryEstimatesAPI = async (
  gym_id,
  month = null,
  year = null,
  search = null,
  page = 1,
  limit = 25,
) => {
  try {
    const params = { gym_id };

    if (month) {
      params.month = month;
    }

    if (year) {
      params.year = year;
    }

    if (search) {
      params.search = search;
    }

    if (!month || !year) {
      params.page = page;
      params.limit = limit;
    }

    const res = await axiosInstance.get(`/owner/enquiry-estimates`, {
      params,
    });

    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const SendEstimatesToClients = async (estimateIds) => {
  try {
    const res = await axiosInstance.post(
      `/owner/send-enquiry-estimates`,
      estimateIds,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ----------------- Trainer Attendance APIs -----------------

export const checkTrainerAttendanceStatus = async (trainerId, gymId) => {
  try {
    const res = await axiosInstance.get(`/trainer-attendance/check-status`, {
      params: {
        trainer_id: trainerId,
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const trainerPunchInAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/trainer-attendance/punch-in`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const trainerPunchOutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/trainer-attendance/punch-out`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getTodaysTrainerAttendanceAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/trainer-attendance/today/${gymId}`);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getMonthlyTrainerAttendanceAPI = async (
  trainerId,
  gymId,
  month,
  year,
) => {
  try {
    const res = await axiosInstance.get(
      `/trainer-attendance/monthly/${trainerId}`,
      {
        params: {
          gym_id: gymId,
          month,
          year,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ===== GYM PHOTOS APIs =====
// You'll need to implement these endpoints in your Python backend:

export const getGymPhotos = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/gym_photos/get-gym-photos`, {
      params: {
        gym_id: gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getGymPhotosPresignedUrls = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/gym_photos/presigned-urls`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const confirmGymPhotoUpload = async (payload) => {
  try {
    const res = await axiosInstance.post(`/gym_photos/confirm`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const deleteGymPhoto = async (photo_id) => {
  try {
    const res = await axiosInstance.delete(`/gym_photos/delete_photo`, {
      params: {
        photo_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateGymPhoto = async (payload) => {
  try {
    const res = await axiosInstance.put(`/gym_photos/update_photo`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getRegistrationPhotosPresignedUrls = async (payload) => {
  try {
    const response = await axiosInstance.post(
      `/gym_photos/registration-presigned-urls`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    return response?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const confirmRegistrationPhotoUpload = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/gym_photos/registration-confirm`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getRegistrationPhotos = async (ownerContact) => {
  try {
    const res = await axiosInstance.get(
      `/gym_photos/registration-photos/${ownerContact}`,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const cleanupRegistrationPhoto = async (
  ownerContact,
  photoId,
  gymIndex,
) => {
  try {
    const res = await axiosInstance.delete(`/gym_photos/registration-cleanup`, {
      params: {
        owner_contact: ownerContact,
        photo_id: photoId,
        gym_index: gymIndex,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// Mobile availability check API
export const checkMobileAvailability = async (mobile) => {
  try {
    const res = await axios.post(`${baseURL}/auth/check-mobile-availability`, {
      contact: mobile,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// Bank details from IFSC code API (using Razorpay or external service)
export const getBankDetailsFromIFSC = async (ifscCode) => {
  try {
    const res = await axios.get(`https://ifsc.razorpay.com/${ifscCode}`);
    return {
      status: 200,
      data: res?.data,
    };
  } catch (err) {
    return {
      status: err?.response?.status || 500,
      data: null,
      message: "Invalid IFSC code or service unavailable",
    };
  }
};

// QR code scanning daily pass
export const scanVerifyDailyPassAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/dailypass_qr/scan/verify`, payload);
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ----------------- Gym Revenue APIs (Membership, PT, Daily Pass) -----------------

export const getGymRevenueAPI = async (
  gym_id,
  mode,
  month = null,
  year = null,
  session_id = null,
) => {
  try {
    const params = { gym_id, mode };

    if (month) {
      params.month = month;
    }
    if (year) {
      params.year = year;
    }
    if (session_id) {
      params.session_id = session_id;
    }

    const res = await axiosInstance.get(`/fittbot_gym/api/gym-revenue`, {
      params,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ----------------- Daily Pass Schedule API -----------------

export const getDailyPassScheduleAPI = async (gym_id, days = 60) => {
  try {
    const params = { gym_id, days };

    const res = await axiosInstance.get(
      `/fittbot_gym_schedule/api/daily-pass-schedule`,
      {
        params,
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// ----------------- Daily Pass Pricing APIs -----------------

export const getDailyPassPriceAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/fittbot_gym_price/api/daily-pass-price`,
      {
        params: { gym_id },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateDailyPassPriceAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/fittbot_gym_price/api/daily-pass-price`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const activateNewOfferAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/offerprice/api/activate-offer`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getIntroOffersStatusAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/offerprice/api/offers-status`, {
      params: { gym_id },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getClientDietAPI = async (
  id,
  date,
  startDate = null,
  endDate = null,
  mealTypes = null,
) => {
  try {
    const params = {
      client_id: id,
    };

    // If startDate and endDate are provided, use date range query
    if (startDate && endDate) {
      params.start_date = startDate;
      params.end_date = endDate;
    } else if (date) {
      // Otherwise, use single date query
      params.date = date;
    }

    // Add meal types filter if provided
    if (mealTypes && mealTypes.length > 0) {
      params.meal_types = mealTypes.join(",");
    }

    const res = await axiosInstance.get(`/actual_diet/get`, {
      params,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

//royalty

export const getRoyaltyClientsAPI = async (
  gym_id,
  month = null,
  year = null,
) => {
  try {
    const params = { gym_id };

    if (month) {
      params.month = month;
    }
    if (year) {
      params.year = year;
    }

    const res = await axiosInstance.get(`/royalty/summary`, {
      params,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getFeeHistoryAPI = async (client_id, gym_id) => {
  try {
    const res = await axiosInstance.get(`/owner/gym/fee_history`, {
      params: {
        client_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateFeeEntryAPI = async (
  membership_id,
  gym_id,
  amount,
  joined_at,
  expires_at,
) => {
  try {
    const res = await axiosInstance.put(`/owner/gym/fee_history/update`, {
      membership_id,
      gym_id,
      amount,
      joined_at,
      expires_at,
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const deleteFeeEntryAPI = async (membership_id, gym_id) => {
  try {
    const res = await axiosInstance.delete(`/owner/gym/fee_history/delete`, {
      params: {
        membership_id,
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const checkReferralAPI = async (code) => {
  try {
    const res = await axios.get(`${baseURL}/auth/validate-gym-referral-code`, {
      params: {
        code,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymReferralsAPI = async (owner_id) => {
  try {
    const res = await axiosInstance.get(`/gym_referral/get`, {
      params: {
        owner_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// ----------------- Client Attendance/Punch In APIs -----------------

export const addPunchInAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/attendance/in_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getInStatusAPI = async (
  id,
  gym_id,
  manual_client_id = null,
  import_client_id = null,
) => {
  try {
    const res = await axiosInstance.get(`/attendance/check`, {
      params: {
        client_id: id,
        ...(manual_client_id ? { manual_client_id } : {}),
        ...(import_client_id ? { import_client_id } : {}),
        gym_id: gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getVersionAPI = async (version) => {
  try {
    const res = await axiosInstance.get(`/app/version`, {
      params: {
        current_version: version,
        app: "business",
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymImportDataAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/client_data_qr/form`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addImportDetailsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client_data_qr/add_form`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addManualImportsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client_data_qr/add_client`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDatesAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/owner/edit_expiry`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymJoinRequestsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/view_join_requests/get`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const rejectRequestAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/view_join_requests/reject`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addOfflineClientAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/offline_users/add`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymPicsAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/gym_onboarding_pics/get`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getAvailableSessionsAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/owner/home/sessions`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addSessionsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/home/add_session`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addIndividualSessionsAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/home/set_session`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getOneSessionsAPI = async (gymId, session_id, trainer_id) => {
  try {
    const res = await axiosInstance.get(`/owner/home/get_sessions`, {
      params: {
        gym_id: gymId,
        session_id,
        trainer_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const scanSessionsQR = async (payload) => {
  try {
    const res = await axiosInstance.post(`/owner/scan_session/verify`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const noCostBNPLSetAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/no_cost_emi/set`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getNoCostBNPLSetAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/no_cost_emi/get`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getSessionsBookings = async (gymId, booking_date) => {
  try {
    const res = await axiosInstance.get(`/owner/home/view_bookings`, {
      params: {
        gym_id: gymId,
        booking_date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const postRewardFeed = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner/home/fittbot_announcement`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const modalAllPagesAPI = async (gymId, page) => {
  try {
    const res = await axiosInstance.get(`/owner_general_modal/check`, {
      params: {
        gym_id: gymId,
        page,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getBiometricInterest = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/biometric_interest/get`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getBiometricInterestPicsAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/biometric_interest/get_pics`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateServicesAndHours = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner_registration/update-gym-data`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const updateAccount = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner_registration/account-details`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDocumentPicsAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/owner_registration/get-documents`, {
      params: {
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPrefilledAgreementAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(
      `/owner_registration/get-prefilled-agreement`,
      {
        params: {
          gym_id: gymId,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const markAgreementClickedAPI = async (gymId) => {
  try {
    const res = await axiosInstance.post(
      `/owner/home/mark-agreement-clicked`,
      null,
      {
        params: {
          gym_id: gymId,
        },
      },
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// Get old data APIs for copying from oldest gym
export const checkMultipleGymsAPI = async (ownerId, currentGymId) => {
  try {
    const res = await axiosInstance.get(`/get_old_data/check_multiple_gyms`, {
      params: {
        owner_id: ownerId,
        current_gym_id: currentGymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getOldServicesDataAPI = async (ownerId, currentGymId) => {
  try {
    const res = await axiosInstance.get(`/get_old_data/services`, {
      params: {
        owner_id: ownerId,
        current_gym_id: currentGymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getOldOperatingHoursAPI = async (ownerId, currentGymId) => {
  try {
    const res = await axiosInstance.get(`/get_old_data/operating_hours`, {
      params: {
        owner_id: ownerId,
        current_gym_id: currentGymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getOldAccountDetailsAPI = async (ownerId, currentGymId) => {
  try {
    const res = await axiosInstance.get(`/get_old_data/account_details`, {
      params: {
        owner_id: ownerId,
        current_gym_id: currentGymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getMaintenenceAPI = async () => {
  try {
    const res = await axios.get(`${baseURL}/redirect/check`, {
      params: {
        app: "business",
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

// Delete Account APIs
export const deleteAccountAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner/delete_account/create`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getDelete = async (owner_id) => {
  try {
    const res = await axiosInstance.get(`/owner/delete_account/get`, {
      params: {
        owner_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const updateFeeStatusImportAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/owner/gym/import/update_fee_status`,
      payload,
    );
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getAgreementDetailsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/agreement_acceptance/gym-details`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getUpcomingBookingsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/pnb/gym/upcoming_plans`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};
