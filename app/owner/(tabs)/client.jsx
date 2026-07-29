import React, { useEffect } from "react";
import { BackHandler } from "react-native";
import { useRouter } from "expo-router";
import AllClientsPage from "../allClientsPage";

const ClientListPage = () => {
  const router = useRouter();

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        router.push("/owner/home");
        return true;
      }
    );

    return () => backHandler.remove();
  }, [router]);

  return <AllClientsPage hideBackButton={true} />;
};

export default ClientListPage;
