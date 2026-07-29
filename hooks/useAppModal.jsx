import { useState, useEffect } from "react";
import { Platform } from "react-native";
import { getMaintenenceAPI } from "../services/Api";

export const useAppModal = () => {
  const [modalData, setModalData] = useState({
    showModal: false,
    type: null, // 'maintenance' or 'redirect'
    message: "",
    redirectUrl: "",
  });

  useEffect(() => {
    // Check app modal status only once on app launch
    const checkModalStatus = async () => {
      try {
        const response = await getMaintenenceAPI();

        if (response?.status === 200) {
          if (response?.show_modal === true) {
            const type = response?.type; // 'maintenance' or 'redirect'

            if (type === "maintenance") {
              setModalData({
                showModal: true,
                type: "maintenance",
                message: response?.message || "",
                redirectUrl: "",
              });
            } else if (type === "redirect") {
              const redirectUrl =
                Platform.OS === "ios"
                  ? response?.app_store_url
                  : response?.play_store_url;

              setModalData({
                showModal: true,
                type: "redirect",
                message: response?.message || "",
                redirectUrl: redirectUrl || "",
              });
            }
          } else {
            // show_modal is false, don't show anything
            setModalData({
              showModal: false,
              type: null,
              message: "",
              redirectUrl: "",
            });
          }
        } else {
          // API call didn't return 200, don't show modal
          setModalData({
            showModal: false,
            type: null,
            message: "",
            redirectUrl: "",
          });
        }
      } catch (error) {
        console.error("Error checking modal status:", error);
        // On error, don't show modal to allow app usage
        setModalData({
          showModal: false,
          type: null,
          message: "",
          redirectUrl: "",
        });
      }
    };

    checkModalStatus();
  }, []);

  return {
    showModal: modalData.showModal,
    modalType: modalData.type,
    message: modalData.message,
    redirectUrl: modalData.redirectUrl,
  };
};
