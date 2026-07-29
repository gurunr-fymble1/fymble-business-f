import React, { useEffect, useState } from "react";
import { useRouter, useSegments } from "expo-router";
import { getToken } from "../../utils/auth";
import PrizeSkeleton from "../ui/loaders/prizeSkeleton";

const AuthenticationWrapper = ({ children }) => {
  const router = useRouter();
  const segments = useSegments();
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = checking, true = authenticated, false = not authenticated

  useEffect(() => {
    const checkAuth = async () => {
      const token = await getToken("access_token");
      const inAuthGroup = segments[0] === "owner" || segments[0] === "trainer";

      if (!token && inAuthGroup) {
        setIsAuthenticated(false);
        router.replace("/");
        return;
      }

      if (token && !inAuthGroup && segments[0] !== undefined) {
        setIsAuthenticated(true);
        router.replace("/owner/(tabs)/home");
        return;
      }

      setIsAuthenticated(!!token);
    };

    checkAuth();
  }, [segments]);

  // Show loading while checking authentication
  if (isAuthenticated === null) {
    return <PrizeSkeleton />;
  }

  return children;
};

export default AuthenticationWrapper;
