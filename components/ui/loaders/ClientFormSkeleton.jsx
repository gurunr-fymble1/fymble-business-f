import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Animatable from 'react-native-animatable';

const { width, height } = Dimensions.get('window');

const SkeletonBox = ({ style }) => {
  return (
    <Animatable.View
      animation={{
        0: { opacity: 0.3 },
        0.5: { opacity: 1 },
        1: { opacity: 0.3 }
      }}
      iterationCount="infinite"
      duration={1600}
      style={[styles.skeletonBox, style]}
    >
      <LinearGradient
        colors={['#E1E9EE', '#F2F8FC', '#E1E9EE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </Animatable.View>
  );
};

export const ClientFormSkeleton = () => {
  return (
    <View style={styles.container}>
      {/* Title Skeleton */}
      <View style={styles.titleContainer}>
        <SkeletonBox style={styles.titleSkeleton} />
      </View>

      {/* Form Section 1 */}
      <View style={styles.formSection}>
        <SkeletonBox style={styles.sectionTitleSkeleton} />

        {/* Input Fields */}
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.inputGroup}>
            <SkeletonBox style={styles.labelSkeleton} />
            <SkeletonBox style={styles.inputSkeleton} />
          </View>
        ))}
      </View>

      {/* Form Section 2 */}
      <View style={styles.formSection}>
        <SkeletonBox style={styles.sectionTitleSkeleton} />

        {/* Double Input Row */}
        <View style={styles.doubleInputRow}>
          <View style={styles.halfInputGroup}>
            <SkeletonBox style={styles.labelSkeleton} />
            <SkeletonBox style={styles.inputSkeleton} />
          </View>
          <View style={styles.halfInputGroup}>
            <SkeletonBox style={styles.labelSkeleton} />
            <SkeletonBox style={styles.inputSkeleton} />
          </View>
        </View>

        {/* Single Input */}
        <View style={styles.inputGroup}>
          <SkeletonBox style={styles.labelSkeleton} />
          <SkeletonBox style={styles.inputSkeleton} />
        </View>
      </View>

      {/* Form Section 3 */}
      <View style={styles.formSection}>
        <SkeletonBox style={styles.sectionTitleSkeleton} />

        {[1, 2].map((item) => (
          <View key={item} style={styles.inputGroup}>
            <SkeletonBox style={styles.labelSkeleton} />
            <SkeletonBox style={styles.inputSkeleton} />
          </View>
        ))}
      </View>

      {/* Submit Button Skeleton */}
      <SkeletonBox style={styles.submitButtonSkeleton} />
    </View>
  );
};

export const ClientFormSelectionSkeleton = () => {
  return (
    <View style={styles.selectionContainer}>
      {/* Card 1 */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardContent}>
          <View style={styles.cardTextSection}>
            <SkeletonBox style={styles.cardTitleSkeleton} />
            <SkeletonBox style={styles.cardSubtitleSkeleton} />
          </View>
          <SkeletonBox style={styles.cardImageSkeleton} />
        </View>
        <SkeletonBox style={styles.cardButtonSkeleton} />
      </View>

      {/* Card 2 */}
      <View style={styles.cardSkeleton}>
        <View style={styles.cardContent}>
          <View style={styles.cardTextSection}>
            <SkeletonBox style={styles.cardTitleSkeleton} />
            <SkeletonBox style={styles.cardSubtitleSkeleton} />
          </View>
          <SkeletonBox style={styles.cardImageSkeleton} />
        </View>
        <SkeletonBox style={styles.cardButtonSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.02,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  titleSkeleton: {
    width: width * 0.5,
    height: 20,
    borderRadius: 4,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
  },
  sectionTitleSkeleton: {
    width: width * 0.35,
    height: 16,
    borderRadius: 4,
    marginBottom: height * 0.02,
  },
  inputGroup: {
    marginBottom: height * 0.02,
  },
  labelSkeleton: {
    width: width * 0.25,
    height: 12,
    borderRadius: 3,
    marginBottom: height * 0.01,
  },
  inputSkeleton: {
    width: '100%',
    height: 45,
    borderRadius: 8,
  },
  doubleInputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.02,
  },
  halfInputGroup: {
    width: '48%',
  },
  submitButtonSkeleton: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    marginTop: height * 0.02,
    marginBottom: height * 0.03,
  },
  skeletonBox: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  selectionContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  cardSkeleton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTextSection: {
    flex: 1,
    marginRight: 16,
  },
  cardTitleSkeleton: {
    width: '70%',
    height: 20,
    borderRadius: 4,
    marginBottom: 10,
  },
  cardSubtitleSkeleton: {
    width: '90%',
    height: 14,
    borderRadius: 3,
  },
  cardImageSkeleton: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  cardButtonSkeleton: {
    width: '100%',
    height: 45,
    borderRadius: 8,
  },
});

export default ClientFormSkeleton;
