import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { getToken } from "../../utils/auth";
import TrainerAttendanceCard from "./TrainerAttendanceCard";
import TodaysAttendanceModal from "./TodaysAttendanceModal";
import PunchInOutButtons from "./PunchInOutButtons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AttendanceSystem = () => {
  const [role, setRole] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    const getUserRole = async () => {
      const userRole = await getToken("role");
      setRole(userRole);
    };
    getUserRole();
  }, []);

  const handleViewAllPress = () => {
    setShowAttendanceModal(true);
  };

  const handleCloseModal = () => {
    setShowAttendanceModal(false);
  };

  if (!role) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Show TrainerAttendanceCard only for owners */}
      {role === "owner" && (
        <View style={styles.ownerSection}>
          <TrainerAttendanceCard onViewAllPress={handleViewAllPress} />
          <TodaysAttendanceModal
            visible={showAttendanceModal}
            onClose={handleCloseModal}
            insets={insets}
          />
        </View>
      )}

      {/* Show PunchInOutButtons only for trainers */}
      {role === "trainer" && (
        <View style={styles.trainerSection}>
          <PunchInOutButtons />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  ownerSection: {
    marginBottom: 16,
  },
  trainerSection: {
    // Trainer buttons positioned appropriately
  },
});

export default AttendanceSystem;
