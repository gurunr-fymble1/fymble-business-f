import axios from "axios";
import apiConfig from "./apiConfig";
const API_URL = apiConfig.API_URL;

import axiosInstance from "./axiosInstance";
import { showToast } from "../utils/Toaster";

export const clientHomeAPI = async (payload) => {
  try {
    const res = await axiosInstance.get(`/client/home`, {
      params: {
        gym_id: payload.gym_id,
        client_id: payload.client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const refreshtokenAPI = async (id, role) => {
  try {
    const res = await axios.get(`${API_URL}/auth/refresh`, {
      params: {
        id,
        role,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientGeneralAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/client_general_analysis`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientDietAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/diet_analysis`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientWorkoutAnalysisAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/workout_insights`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// export const clientReportAPI = async (id, date) => {
//   try {
//     const res = await axiosInstance.get(`/client/get_client_report`, {
//       params: {
//         client_id: id,
//         date,
//       },
//     });
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

export const clientReportAPI = async (
  id,
  date,
  startDate = null,
  endDate = null
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

    const res = await axiosInstance.get(`/client_report/get`, {
      params,
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};
export const getClientWorkoutAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/actual_workout/get`, {
      params: {
        client_id: id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getWorkoutTemplateClientAPI = async (id) => {
  try {
    const res = await axiosInstance.get(
      `/client/manual_client_workout_template`,
      {
        params: {
          client_id: id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientWrokoutTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/manual/add_workout_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutTemplateNameAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/manual/edit_workout_template_name`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientWorkoutTemplateAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(
      `/client/manual/delete_workout_template`,
      {
        params: {
          id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutTemplateExerciseAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/manual/update_workout_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFittbotWorkoutAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/get_fittbot_workout`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getInStatusAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/attendance_status`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getDietTemplateClientAPI = async (id) => {
  try {
    const res = await axiosInstance.get(`/client/get_diet_template`, {
      params: {
        client_id: id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientDietTemplateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/add_diet_template`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietTemplateNameAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/edit_diet_template_name`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientDietTemplateAPI = async (id) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_diet_template`, {
      params: {
        id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietTemplateDishesAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(
      `/client/update_diet_template`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientWorkoutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/create_actual_workout`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientWorkoutAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_actual_workout`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

// export const getClientWorkoutAPI = async (id, date) => {
//   try {
//     const res = await axiosInstance.get(`/client/get_actual_workout`, {
//       params: {
//         client_id: id,
//         date,
//       },
//     });
//     return res?.data;
//   } catch (err) {
//     return err?.response.data;
//   }
// };

export const deleteClientWorkoutAPI = async (id, client_id) => {
  try {
    const res = await axiosInstance.delete(
      `/client/delete_all_actual_workout`,
      {
        params: {
          record_id: id,
          client_id: client_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addClientDietAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/create_actual_diet`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientDietAPI = async (id, date) => {
  try {
    const res = await axiosInstance.get(`/client/get_actual_diet`, {
      params: {
        client_id: id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientDietAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_actual_diet`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteClientDietAPI = async (id, client_id, gym_id, date) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_actual_diet`, {
      params: {
        record_id: id,
        client_id,
        gym_id,
        date,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getPunchedInDetailsAPI = async (client_id, gym_id) => {
  try {
    const res = await axiosInstance.get(
      `/client/attendance_status_with_location`,
      {
        params: {
          client_id,
          gym_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPunchInAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/in_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addPunchOutAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/attendance/out_punch`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const QRAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/scan_qr`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/send_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getMessagesAPI = async (gym_id, loggedInUserId) => {
  try {
    const res = await axiosInstance.get(`/client/messages`, {
      params: {
        gym_id,
        user_id: loggedInUserId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const editMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteMessagesAPI = async (message_ids) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_messages`, {
      data: { message_ids },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const sendFeedbackAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/feedback`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientProfileDetailsAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client/profile_data`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editClientProfileAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/update_profile`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const ClientWeightUpdateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/add_inputs`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyCreateSessionAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/gym_buddy/create_session`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getGymBuddySessionsAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/client/gym_buddy/get_sessions`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyJoinProposalAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/gym_buddy/join_proposal`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyAcceptProposalAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(
      `/client/gym_buddy/accept_proposal`,
      payload
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyDeclineProposalAPI = async (
  session_id,
  proposal_id,
  proposer_id
) => {
  try {
    const res = await axiosInstance.delete(
      `/client/gym_buddy/delete_proposal`,
      {
        params: {
          session_id,
          proposal_id,
          proposer_id,
        },
      }
    );
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const gymBuddyDeleteSessionAPI = async (session_id) => {
  try {
    const res = await axiosInstance.delete(`/client/gym_buddy/delete_session`, {
      params: {
        session_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getAllFoodsAPI = async (pageNum, ITEMS_PER_PAGE) => {
  try {
    const res = await axiosInstance.get(`/client/foods`, {
      params: {
        page: pageNum,
        limit: ITEMS_PER_PAGE,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const searchAllFoodsAPI = async (char, page, limit) => {
  try {
    const res = await axiosInstance.get(`/client/search`, {
      params: {
        query: char,
        page,
        limit,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const caloriesCalculateAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/calculate-calories`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const clientWaterTrackerAPI = async (payload) => {
  try {
    const res = await axiosInstance.get(`/client/watertracker`, {
      params: {
        gym_id: payload.gym_id,
        client_id: payload.client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFoodCategoriesAPI = async () => {
  try {
    const res = await axiosInstance.get(`/client/food_categories`);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getFoodsByCategoryAPI = async (categories, page, limit) => {
  try {
    const categoriesString = Array.isArray(categories)
      ? categories.join(",")
      : categories;

    const res = await axiosInstance.get(`/client/foods/categories`, {
      params: {
        categories: categoriesString,
        page,
        limit,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientRewardsAPI = async (client_id, gym_id) => {
  try {
    const res = await axiosInstance.get(`/client/show_rewards_page`, {
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

export const getClientLeaderboardAPI = async (gym_id) => {
  try {
    const res = await axiosInstance.get(`/leaderboard/get`, {
      params: {
        gym_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getClientXpAPI = async (client_id) => {
  try {
    const res = await axiosInstance.get(`/client/get_xp`, {
      params: {
        client_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const getSessionMessagesAPI = async (session_id) => {
  try {
    const res = await axiosInstance.get(`/client/get_gb_messages`, {
      params: {
        session_id,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const sendSessionMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.post(`/client/send_gb_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const editSessionMessageAPI = async (payload) => {
  try {
    const res = await axiosInstance.put(`/client/edit_gb_message`, payload);
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const deleteSessionMessagesAPI = async (message_ids) => {
  try {
    const res = await axiosInstance.delete(`/client/delete_gb_messages`, {
      data: { message_ids },
    });
    return res?.data;
  } catch (err) {
    return err?.response?.data;
  }
};

export const getCommonFooodAPI = async (gymId) => {
  try {
    const res = await axiosInstance.get(`/client/consumed_foods`, {
      params: { gym_id: gymId },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const searchClientFoodAPI = async (query, gymId) => {
  try {
    const res = await axiosInstance.get(`/client/search_consumed_food`, {
      params: {
        query,
        gym_id: gymId,
      },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const addCustomFoodAPI = async (foodData, gymId) => {
  try {
    const res = await axiosInstance.post(`/client/add_custom_food`, foodData, {
      params: { gym_id: gymId },
    });
    return res?.data;
  } catch (err) {
    return err?.response.data;
  }
};

export const hasMediainPostAPI = async (payload) => {
  try {
    const response = await axios.post(
      `${API_URL}/feed/create_presigned_url`,
      payload,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 30000,
      }
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
