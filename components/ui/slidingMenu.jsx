import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MenuButton from './MenuButton';

const { width, height } = Dimensions.get('window');
const MENU_HEIGHT = height * 0.7;

const SlidingMenu = ({ isVisible, onClose, role }) => {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(MENU_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnimations = useRef([]);

  const menuItems =
    role === 'owner'
      ? [
          {
            title: 'Client Management',
            iconName: 'people',
            route: '/owner/clientform',
          },
          {
            title: 'Trainer Setup',
            iconName: 'person',
            route: '/owner/trainerform',
          },
          {
            title: 'Workout Plans',
            iconName: 'barbell-outline',
            route: '/owner/workout_schedule',
          },
          {
            title: 'Nutrition Plans',
            iconName: 'restaurant-outline',
            route: '/owner/diet',
          },
          {
            title: 'Assignments',
            iconName: 'swap-horizontal-outline',
            route: '/owner/assigntrainer',
          },
          {
            title: 'Membership Plans',
            iconName: 'pricetag-outline',
            route: '/owner/manageplans',
          },
          {
            title: 'Rewards Program',
            iconName: 'star-outline',
            route: '/owner/rewards',
          },
          {
            title: 'Achievement Prizes',
            iconName: 'medal-outline',
            route: '/owner/gymdata',
          },
          {
            title: 'Add Enquires',
            iconName: 'person-add-outline',
            route: '/owner/addEnquiry',
          },
        ]
      : [];

  // Initialize button animations
  useEffect(() => {
    // Ensure we have animations for all menu items
    if (buttonAnimations.current.length !== menuItems.length) {
      buttonAnimations.current = menuItems.map(() => new Animated.Value(0));
    }
  }, [menuItems.length]);

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        if (isVisible) {
          onClose();
          return true;
        }
        return false;
      }
    );

    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // Control animations based on isVisible prop
  useEffect(() => {
    if (isVisible) {
      // Reset animations to initial state
      slideAnim.setValue(MENU_HEIGHT);
      fadeAnim.setValue(0);
      buttonAnimations.current.forEach((anim) => anim.setValue(0));

      // Start entry animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Stagger button animations
      Animated.stagger(
        50,
        buttonAnimations.current.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            tension: 100,
            friction: 7,
            useNativeDriver: true,
          })
        )
      ).start();
    } else {
      // Exit animations
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: MENU_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isVisible]);

  // Don't render anything if not visible and animation is complete
  if (!isVisible && slideAnim._value === MENU_HEIGHT && fadeAnim._value === 0) {
    return null;
  }

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={isVisible ? 'auto' : 'none'}
    >
      {/* Overlay background */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.overlay, { opacity: fadeAnim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Menu container */}
      <Animated.View
        style={[
          styles.menuContainer,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Menu header */}
        <View style={styles.header}>
          <View style={styles.handleBar} />
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#333" />
          </Pressable>
        </View>

        {/* Scrollable menu content */}
        <SafeAreaView style={styles.scrollContainer}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.menuGrid}>
              {menuItems.map((item, index) => (
                <MenuButton
                  key={`menu-item-${index}`}
                  title={item.title}
                  iconName={item.iconName}
                  route={item.route}
                  onClose={onClose}
                  animation={buttonAnimations.current[index] || fadeAnim}
                  color={getColorForIndex(index)}
                />
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
};

const getColorForIndex = (index) => {
  const colors = [
    '#FF5757', 
    '#FF7A57', 
    '#FF9E57', 
    '#FFB657', 
    '#F28B82', 
    '#EA80FC', 
    '#7C4DFF', 
    '#3F51B5', 
    '#4DB6AC',
  ];
  return colors[index % colors.length];
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 99,
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: MENU_HEIGHT,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    zIndex: 100,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#FFDDDD',
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#DDD',
    marginTop: 10,
  },
  closeButton: {
    position: 'absolute',
    top: 18,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
});

export default SlidingMenu;
