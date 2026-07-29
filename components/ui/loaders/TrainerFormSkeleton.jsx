import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Dimensions, ScrollView } from "react-native";

const { width, height } = Dimensions.get("window");

const TrainerFormSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.7],
  });

  const SkeletonBox = ({ style }) => (
    <View style={[styles.skeletonBase, style]}>
      <Animated.View style={[styles.skeletonContent, { opacity }]} />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.formContent}>
        {/* Profile Image Section */}
        <View style={styles.profileSection}>
          <SkeletonBox style={styles.profileImage} />
          <SkeletonBox style={styles.changeButton} />
        </View>

        {/* Full Name Input */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.label} />
          <SkeletonBox style={styles.input} />
        </View>

        {/* Gender Radio Buttons */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.label} />
          <View style={styles.radioGroup}>
            <SkeletonBox style={styles.radioButton} />
            <SkeletonBox style={styles.radioButton} />
            <SkeletonBox style={styles.radioButton} />
          </View>
        </View>

        {/* Contact Number Input */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.label} />
          <SkeletonBox style={styles.input} />
        </View>

        {/* Email Input */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.label} />
          <SkeletonBox style={styles.input} />
        </View>

        {/* Experience Input */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.label} />
          <SkeletonBox style={styles.input} />
        </View>

        {/* Specializations Section */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.label} />
          <SkeletonBox style={styles.input} />
          <View style={styles.chipsContainer}>
            <SkeletonBox style={styles.chip} />
            <SkeletonBox style={styles.chip} />
            <SkeletonBox style={styles.chipSmall} />
          </View>
        </View>

        {/* Availability Timings Section */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.sectionTitle} />

          {/* Time Picker Row */}
          <View style={styles.timePickerRow}>
            <View style={styles.timePickerGroup}>
              <SkeletonBox style={styles.timeLabel} />
              <SkeletonBox style={styles.timeButton} />
            </View>
            <View style={styles.timePickerGroup}>
              <SkeletonBox style={styles.timeLabel} />
              <SkeletonBox style={styles.timeButton} />
            </View>
          </View>

          <SkeletonBox style={styles.addButton} />

          {/* Timing Cards */}
          <View style={styles.timingCard}>
            <SkeletonBox style={styles.timingChip} />
            <SkeletonBox style={styles.deleteButton} />
          </View>
          <View style={styles.timingCard}>
            <SkeletonBox style={styles.timingChip} />
            <SkeletonBox style={styles.deleteButton} />
          </View>
        </View>

        {/* App Access Toggle */}
        <View style={styles.toggleSection}>
          <View style={styles.toggleRow}>
            <SkeletonBox style={styles.toggleLabel} />
            <SkeletonBox style={styles.toggle} />
          </View>
        </View>

        {/* Submit Buttons */}
        <View style={styles.buttonGroup}>
          <SkeletonBox style={styles.submitButton} />
          <SkeletonBox style={styles.cancelButton} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  formContent: {
    padding: width * 0.05,
    paddingBottom: 40,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
    paddingVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 12,
  },
  changeButton: {
    width: 120,
    height: 32,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    width: 80,
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 48,
    borderRadius: 8,
  },
  radioGroup: {
    flexDirection: "row",
    gap: 12,
  },
  radioButton: {
    flex: 1,
    height: 42,
    borderRadius: 8,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  chip: {
    width: 100,
    height: 32,
    borderRadius: 16,
  },
  chipSmall: {
    width: 80,
    height: 32,
    borderRadius: 16,
  },
  sectionTitle: {
    width: 150,
    height: 16,
    borderRadius: 4,
    marginBottom: 16,
  },
  timePickerRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  timePickerGroup: {
    flex: 1,
  },
  timeLabel: {
    width: 70,
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
  },
  timeButton: {
    width: "100%",
    height: 44,
    borderRadius: 8,
  },
  addButton: {
    width: 120,
    height: 36,
    borderRadius: 8,
    marginBottom: 16,
  },
  timingCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  timingChip: {
    width: 150,
    height: 28,
    borderRadius: 12,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  toggleSection: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleLabel: {
    width: 140,
    height: 16,
    borderRadius: 4,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
  },
  buttonGroup: {
    gap: 12,
  },
  submitButton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
  },
  cancelButton: {
    width: "100%",
    height: 50,
    borderRadius: 8,
  },
  skeletonBase: {
    overflow: "hidden",
    backgroundColor: "#E1E9EE",
  },
  skeletonContent: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F4F8",
  },
});

export default TrainerFormSkeleton;
