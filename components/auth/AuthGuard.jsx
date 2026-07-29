import React, { useEffect, useState } from "react";
import { useRouter, useSegments, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { getToken } from "../../utils/auth";

import axios from "axios";
import apiConfig from "../../services/apiConfig";
import { saveToken, deleteToken } from "../../utils/auth";
import PrizeSkeleton from "../ui/loaders/prizeSkeleton";

const AuthGuard = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const baseURL = apiConfig.API_URL;

  const checkAuthentication = async () => {
    try {
      const accessToken = await getToken("access_token");
      const ownerId = await getToken("owner_id");
      const trainerId = await getToken("trainer_id");
      const userRole = await getToken("role");

      // If no access token, user is not authenticated
      if (!accessToken) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Verify token with backend
      try {
        const response = await axios.get(`${baseURL}/auth/verify`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (response.status === 200) {
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } catch (error) {
        // Token verification failed, try to refresh
        const userId = userRole === "trainer" ? trainerId : ownerId;
        if (userId) {
          try {
            const refreshResponse = await axios.post(
              `${baseURL}/auth/refresh`,
              {
                id: userId,
                role: userRole,
              },
            );

            if (refreshResponse?.status === 200) {
              await saveToken(
                "access_token",
                refreshResponse.data.access_token,
              );
              setIsAuthenticated(true);
              setIsLoading(false);
              return;
            } else {
              await clearTokens();
            }
          } catch (refreshError) {
            await clearTokens();
          }
        } else {
          await clearTokens();
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      await clearTokens();
    }
  };

  const clearTokens = async () => {
    try {
      await deleteToken("access_token");
      await deleteToken("refresh_token");
      await deleteToken("owner_id");
      await deleteToken("trainer_id");
      await deleteToken("role");
      await deleteToken("gym_id");
      await deleteToken("gym_name");
      await deleteToken("name");
    } catch (error) {
      console.error("Error clearing tokens:", error);
    }
    setIsAuthenticated(false);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuthentication();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const inAuthGroup = segments[0] === "owner" || segments[0] === "trainer";
      const inAuthScreens =
        segments[0] === "register" ||
        segments[0] === "forgotpassword" ||
        segments[0] === "verificationowner" ||
        segments[0] === "changepassword" ||
        segments.includes("OtpVerification");

      // Add timeout to prevent immediate navigation issues
      setTimeout(() => {
        if (!isAuthenticated && inAuthGroup) {
          // User is not authenticated but trying to access protected routes
          router.replace("/");
        } else if (
          isAuthenticated &&
          !inAuthGroup &&
          !inAuthScreens &&
          segments[0] !== "index"
        ) {
          // User is authenticated but on login screen, redirect to home
          router.replace("/owner/(tabs)/home");
        }
      }, 100);
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return <PrizeSkeleton />;
  }

  return children;
};

export default AuthGuard;
