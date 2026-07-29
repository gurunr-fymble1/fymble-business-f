import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const STEPS = [
  { id: 1, label: "Terms", icon: "document-text-outline" },
  { id: 2, label: "Selfie", icon: "camera-outline" },
  { id: 3, label: "OTP", icon: "shield-checkmark-outline" },
];

const StepIndicator = ({ currentStep, completedSteps = [] }) => {
  const getStepStatus = (stepId) => {
    if (completedSteps.includes(stepId)) return "completed";
    if (stepId === currentStep) return "active";
    return "pending";
  };

  const getStepColor = (status) => {
    switch (status) {
      case "completed":
        return "#22c55e"; // Green
      case "active":
        return "#0154A0"; // Blue (for border)
      default:
        return "#9ca3af"; // Gray
    }
  };

  const getLineColor = (stepId) => {
    // Line after step should be green if current step is beyond it
    if (completedSteps.includes(stepId)) return "#22c55e";
    return "#e5e7eb";
  };

  const renderCircle = (step, status, stepColor) => {
    // Active step - use gradient
    if (status === "active") {
      return (
        <LinearGradient
          colors={["#030A15", "#0154A0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.circle, styles.gradientCircle]}
        >
          <Ionicons name={step.icon} size={18} color="#fff" />
        </LinearGradient>
      );
    }

    // Completed or pending - use regular View
    return (
      <View
        style={[
          styles.circle,
          {
            backgroundColor: status === "pending" ? "#fff" : stepColor,
            borderColor: stepColor,
          },
        ]}
      >
        {status === "completed" ? (
          <Ionicons name="checkmark" size={18} color="#fff" />
        ) : (
          <Ionicons name={step.icon} size={18} color={stepColor} />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {STEPS.map((step, index) => {
        const status = getStepStatus(step.id);
        const stepColor = getStepColor(status);
        const isLast = index === STEPS.length - 1;

        return (
          <View key={step.id} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              {/* Circle with icon */}
              {renderCircle(step, status, stepColor)}

              {/* Step label */}
              <Text
                style={[
                  styles.label,
                  {
                    color: status === "pending" ? "#9ca3af" : "#1f2937",
                    fontWeight: status === "active" ? "600" : "400",
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>

            {/* Connector line */}
            {!isLast && (
              <View
                style={[
                  styles.connector,
                  { backgroundColor: getLineColor(step.id) },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#fff",
    marginLeft: 50,
  },
  stepWrapper: {
    flexDirection: "row",
    alignItems: "center",

    flex: 1,
  },
  stepItem: {
    alignItems: "center",
    width: 60,
  },
  circle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientCircle: {
    borderWidth: 0,
  },
  label: {
    fontSize: 11,
    marginTop: 6,
    textAlign: "center",
  },
  connector: {
    height: 2,
    flex: 1,
    alignSelf: "center",
    marginHorizontal: -8,
    justifyContent: "center",
    marginBottom: 15,
  },
});

export default StepIndicator;
