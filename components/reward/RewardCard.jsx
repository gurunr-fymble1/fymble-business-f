import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const DEFAULT_REWARD_IMAGES = {
  'default_rewards': require('../../assets/images/rewards/rewards_img.png'),
  'default_subscription': require('../../assets/images/rewards/subscription.png'),
  'default_bag': require('../../assets/images/rewards/bag.png'),
  'default_bottle': require('../../assets/images/rewards/bottle.png'),
  'default_tshirt': require('../../assets/images/rewards/t-shirt.png'),
};

const RewardCard = ({
  item,
  index,
  onPress,
  onEdit,
  onDelete,
  showDropdown,
  setShowDropdown,
  role,
}) => {
  const dropdownAnim = useRef(new Animated.Value(0)).current;

  const getImageSource = () => {
    if (item.image_url && (item.image_url.startsWith('http') || item.image_url.startsWith('https'))) {
      return { uri: item.image_url };
    }

    if (item.image_url && item.image_url.startsWith('default_') && DEFAULT_REWARD_IMAGES[item.image_url]) {
      return DEFAULT_REWARD_IMAGES[item.image_url];
    }

    return DEFAULT_REWARD_IMAGES['default_rewards'];
  };

  const dropdownStyle = {
    opacity: dropdownAnim,
    transform: [
      {
        translateY: dropdownAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  useEffect(() => {
    if (showDropdown === item?.id) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [showDropdown]);

  const handleCardPress = () => {
    onPress();
    if (showDropdown) {
      setShowDropdown(null);
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handleCardPress}
    >
      <View style={[
        styles.rewardCard,
        showDropdown === item?.id && styles.rewardCardElevated
      ]}>
        <View style={styles.cardContent}>
          <View style={styles.pointsContainer}>
            <Image
              source={getImageSource()}
              style={styles.rewardImage}
            />
            <View style={styles.pointsValueWrapper}>
              <Image
                style={styles.coinIcon}
                source={require('../../assets/images/rewards/coin.png')}
              />
              <Text style={styles.pointsValue}>{item?.xp}</Text>
            </View>
          </View>

          <View style={styles.rewardInfo}>
            <Text style={styles.giftText}>
              {item?.gift?.length > 70 ? `${item.gift.slice(0, 70)}...` : item?.gift}
            </Text>
            {role !== "trainer" &&
              <>
                <TouchableOpacity
                  style={styles.ellipsisButton}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent card press
                    setShowDropdown(showDropdown === item?.id ? null : item?.id);
                  }}
                  activeOpacity={0.6}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name="ellipsis-vertical-outline"
                    size={22}
                    color="#666"
                  />
                </TouchableOpacity>

                {showDropdown === item?.id && (
                  <Animated.View style={[styles.dropdownMenu, dropdownStyle]}>
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={(e) => {
                        e.stopPropagation();
                        onEdit(item, index);
                        setShowDropdown(null);
                      }}
                    >
                      <Ionicons name="create-outline" size={16} color="#333" />
                      <Text style={styles.dropdownItemText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.dropdownItem, styles.deleteItem]}
                      onPress={(e) => {
                        e.stopPropagation();
                        onDelete(item);
                        setShowDropdown(null);
                      }}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                      <Text style={[styles.dropdownItemText, styles.deleteText]}>
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </>
            }
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  rewardCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'visible',
    zIndex: 100,
  },
  rewardCardElevated: {
    elevation: 10,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 999999, 
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  pointsContainer: {
    alignItems: 'center',
    marginRight: 15,
    borderWidth: 2,
    borderRadius: 16,
    borderColor: '#0154A0',
    overflow: "hidden"
  },
  rewardImage: {
    height: 62,
    width: 89,
  },
  pointsValueWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
  },
  coinIcon: {
    height: 10,
    width: 10,
    marginRight: 5,
  },
  pointsValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#030A15',
  },
  rewardInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  giftText: {
    fontSize: 14,
    color: '#030A15',
    flex: 1,
    textAlignVertical: 'center',
    paddingRight: 10,
  },
  // Enhanced ellipsis button with bigger clickable area
  ellipsisButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  // Enhanced dropdown menu with proper z-index
  dropdownMenu: {
    position: 'absolute',
    top: -15,
    right: 30,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 20, // Higher elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    zIndex: 9999999, // Very high z-index
    minWidth: 140,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dropdownItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  deleteItem: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  deleteText: {
    color: '#ff3b30',
  },
});

export default RewardCard;