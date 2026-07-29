import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    Dimensions,
    Text,
    PanResponder
} from 'react-native';

const { width } = Dimensions.get('window');

export const FullImageModal = ({ 
  isVisible, 
  imageSource, 
  onClose, 
  images = [], 
  currentIndex = 0, 
  onSwipeLeft, 
  onSwipeRight 
}) => {
  const hasMultipleImages = images.length > 1;
  const canSwipeLeft = hasMultipleImages && currentIndex > 0;
  const canSwipeRight = hasMultipleImages && currentIndex < images.length - 1;

  const panResponder = React.useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => hasMultipleImages,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to horizontal swipes
        return hasMultipleImages && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeThreshold = width * 0.25; // 25% of screen width
        const { dx } = gestureState;
        
        if (dx > swipeThreshold && canSwipeLeft && onSwipeLeft) {
          onSwipeLeft();
        } else if (dx < -swipeThreshold && canSwipeRight && onSwipeRight) {
          onSwipeRight();
        }
      }
    }), [hasMultipleImages, canSwipeLeft, canSwipeRight, onSwipeLeft, onSwipeRight]
  );

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.fullImageModalOverlay}>
        <View 
          style={styles.fullImageModalContent}
          {...panResponder.panHandlers}
        >
            <TouchableOpacity
              style={styles.fullImageCloseButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {/* Image counter */}
            {hasMultipleImages && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {currentIndex + 1} of {images.length}
                </Text>
              </View>
            )}
            
            <Image
              source={imageSource}
              style={styles.fullImage}
              contentFit="contain"
            />
            
            {/* Navigation arrows */}
            {hasMultipleImages && (
              <>
                {canSwipeLeft && (
                  <TouchableOpacity
                    style={[styles.navArrow, styles.leftNavArrow]}
                    onPress={onSwipeLeft}
                  >
                    <Ionicons name="chevron-back" size={30} color="#fff" />
                  </TouchableOpacity>
                )}
                
                {canSwipeRight && (
                  <TouchableOpacity
                    style={[styles.navArrow, styles.rightNavArrow]}
                    onPress={onSwipeRight}
                  >
                    <Ionicons name="chevron-forward" size={30} color="#fff" />
                  </TouchableOpacity>
                )}
              </>
            )}
            
            {/* Swipe hint */}
            {hasMultipleImages && (
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>Swipe left or right to navigate</Text>
              </View>
            )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullImageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullImageModalContent: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  fullImage: {
    width: "100%",
    height: "80%",
  },
  fullImageCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageCounter: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  imageCounterText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  navArrow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -25 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  leftNavArrow: {
    left: 20,
  },
  rightNavArrow: {
    right: 20,
  },
  swipeHint: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  swipeHintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontStyle: "italic",
  },
});