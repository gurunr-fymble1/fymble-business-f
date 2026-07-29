import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');
const CENTRAL_SIZE = 60;
const BUTTON_SIZE = 40;
const EXPANDED_RADIUS = 70;

const FluidMorphMenu = ({ menuItems }) => {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  const handlePressCentral = () => {
    const toValue = isExpanded ? 0 : 1;
    Animated.spring(progress, {
      toValue,
      useNativeDriver: true,
      friction: 5,
    }).start();
    Animated.timing(iconRotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsExpanded(!isExpanded);
  };

  const handleButtonPress = (route) => {
    Animated.timing(progress, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setTimeout(() => {
      setIsExpanded(false);
      router.push(route);
    }, 300);
  };

  const centralScale = progress.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [1, 1.1, 1],
  });

  const iconRotate = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const buttonAnimations = menuItems.map((item, index) => {
    const angle = ((2 * Math.PI) / menuItems.length) * index;
    return {
      translateX: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, EXPANDED_RADIUS * Math.cos(angle)],
      }),
      translateY: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, EXPANDED_RADIUS * Math.sin(angle)],
      }),
      scale: progress.interpolate({
        inputRange: [0, 0.7, 1],
        outputRange: [0.5, 1.2, 1],
      }),
    };
  });

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handlePressCentral}>
        <Animated.View
          style={[
            styles.centralButton,
            {
              transform: [{ scale: centralScale }],
            },
          ]}
        >
          <Animated.View style={{ transform: [{ rotate: iconRotate }] }}>
            <Ionicons name="add" size={28} color="#FF5757" />
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>

      {isExpanded &&
        menuItems.map((item, index) => (
          <TouchableWithoutFeedback
            key={item.title}
            onPress={() => handleButtonPress(item.route)}
          >
            <Animated.View
              style={[
                styles.morphButton,
                {
                  opacity: progress,
                  transform: [
                    { translateX: buttonAnimations[index].translateX },
                    { translateY: buttonAnimations[index].translateY },
                    { scale: buttonAnimations[index].scale },
                  ],
                },
              ]}
            >
              <Animated.View style={{ opacity: progress }}>
                <Ionicons name={item.iconName} size={20} color="#FFF" />
              </Animated.View>
            </Animated.View>
          </TouchableWithoutFeedback>
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centralButton: {
    width: CENTRAL_SIZE,
    height: CENTRAL_SIZE,
    borderRadius: CENTRAL_SIZE / 2,
    backgroundColor: '#FFDDDD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morphButton: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#FF5757',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FluidMorphMenu;
