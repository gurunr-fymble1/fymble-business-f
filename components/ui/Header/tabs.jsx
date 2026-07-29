import React, { useState, useEffect } from "react";
import { router } from "expo-router";
import { logout, deleteToken, getToken } from "../../../utils/auth";
import { showToast } from "../../../utils/Toaster";
import { getOwnerGymsAPI } from "../../../services/Api";

const MenuItems = ({ setIsMenuVisible = {} }) => {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchRole = async () => {
      const role = await getToken("role");
      setUserRole(role);
    };
    fetchRole();
  }, []);

  const menuItems = [
    {
      id: "profile",
      icon: "person-outline",
      text: "My Profile",
      onPress: () => {
        router.push("/owner/ownerprofile");
        setIsMenuVisible(false);
      },
    },
    {
      id: "gympics",
      icon: "images-outline",
      text: "Add Gym Photos",
      onPress: () => {
        router.push("/owner/gympics");
        setIsMenuVisible(false);
      },
    },

    {
      id: "add_gym",
      icon: "add-circle-outline",
      text: "Add New Gym",
      onPress: () => {
        router.push("/owner/addnewgym");
        setIsMenuVisible(false);
      },
    },
    {
      id: "switch_gym",
      icon: "swap-horizontal-outline",
      text: "Switch Gym",
      onPress: async () => {
        try {
          const ownerId = await getToken("owner_id");
          const accessToken = await getToken("access_token");
          const refreshToken = await getToken("refresh_token");
          const ownerName = await getToken("name");

          if (!ownerId) {
            showToast({
              type: "error",
              title: "Owner information not found. Please login again.",
            });
            setIsMenuVisible(false);
            return;
          }

          const response = await getOwnerGymsAPI(parseInt(ownerId));

          if (response?.status === 200) {
            const gymsData = response.data?.gyms || [];
            router.push({
              pathname: "/owner/selectgym",
              params: {
                gyms: JSON.stringify(gymsData),
                user_id: ownerId,
                access_token: accessToken,
                refresh_token: refreshToken,
                name: ownerName || response.data?.owner_name,
                role: "owner",
              },
            });
          } else {
            showToast({
              type: "error",
              title: response?.detail || "Failed to fetch gyms",
            });
          }
        } catch (error) {
          showToast({
            type: "error",
            title: "Error fetching gyms. Please try again.",
          });
        }
        setIsMenuVisible(false);
      },
    },

    {
      id: "support",
      icon: "help-circle-outline",
      text: "Help & Support",
      onPress: () => {
        router.push("/owner/Help");
        setIsMenuVisible(false);
      },
    },
    {
      id: "rate_us",
      icon: "star",
      text: "Rate Us",
      onPress: () => {
        router.push("/owner/rateus");
        setIsMenuVisible(false);
      },
    },
    {
      id: "settings",
      icon: "settings-outline",
      text: "Settings",
      onPress: () => {
        router.push("/owner/settings");
        setIsMenuVisible(false);
      },
    },
  ];

  // Filter menu items: only show "Add New Gym" and "Switch Gym" if role is "owner"
  const filteredMenuItems = menuItems.filter((item) => {
    if (item.id === "add_gym" || item.id === "switch_gym") {
      return userRole === "owner";
    }
    return true;
  });

  return { menuItems: filteredMenuItems };
};

export default MenuItems;
