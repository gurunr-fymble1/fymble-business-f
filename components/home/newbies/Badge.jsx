import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Badge = ({ type }) => {
  // Define badge styles based on type
  const getBadgeStyle = () => {
    switch (type.toLowerCase()) {
      case 'personal':
        return {
          container: [styles.badge, styles.personalBadge],
          text: styles.badgeText,
        };
      case 'business':
        return {
          container: [styles.badge, styles.businessBadge],
          text: styles.badgeText,
        };
      default:
        return {
          container: [styles.badge, styles.defaultBadge],
          text: styles.badgeText,
        };
    }
  };

  const badgeStyle = getBadgeStyle();

  return (
    <View style={badgeStyle.container}>
      <Ionicons
        style={styles.availabilityIcon}
        name="barbell-outline"
        color={'#fff'}
      />
      <Text style={badgeStyle.text}>{type}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  personalBadge: {
    backgroundColor: '#512B81',
  },
  businessBadge: {
    backgroundColor: '#3498db',
  },
  defaultBadge: {
    backgroundColor: '#95a5a6',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
  },
  availabilityIcon: {
    // width: 16,
    // height: 16,
    marginRight: 5,
    tintColor: '#666',
  },
});

export default Badge;
