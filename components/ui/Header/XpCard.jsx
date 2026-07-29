import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';

const XpCard = ({
  userName = 'Vijay',
  profileImage,
  xp = 2560,
  progress = 0.75,
  quote = "You're one step away from greatness — don’t skip today!",
  badgeImage,
  color1 = '#7b2cbf',
  color2 = '#e5383b',
  onProfilePress,
  onBadgePress,
}) => {

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.profileButtonInitial}
          onPress={onProfilePress}
        >
          <Image
            // source={require('../../../assets/images/header/user_pic.png')}
            style={styles.avatar}
            //   contentFit="contain"
          />
        </TouchableOpacity>

        <View style={styles.middleSection}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Text style={styles.greeting}>Hi, {userName}</Text>
            <Text style={styles.xp}>{xp} XP</Text>
          </View>

          <View style={styles.progressBackground}>
            <LinearGradient
              colors={[color1, color2]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${progress * 100}%` }]}
            />
          </View>

          {/* <Text style={styles.quote}>{quote}</Text> */}
        </View>

        <View style={styles.rightSection}>
          <TouchableOpacity
            style={styles.profileButtonInitial}
            onPress={() => onBadgePress()}
          >
            <Image
              // source={require('../../../assets/images/header/xp_badge.png')}
              style={styles.badge}
              contentFit="contain"
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.quote}>{quote}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    // width: 351,
    flex: 1,
    maxWidth: 351,
    // height: 74,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    padding: 10,
    // justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    // elevation: 2,
    paddingTop: 15,
    marginBottom: 15,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    flexShrink: 0,
    aspectRatio: 1 / 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleSection: {
    flex: 1,
    marginHorizontal: 8,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    color: '#C2185B',
  },
  progressBackground: {
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  rightSection: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  xp: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#C2185B',
  },
  badge: {
    width: 45,
    height: 45,
    marginTop: 2,
    flexShrink: 0,
    aspectRatio: 1 / 1,
  },
  quote: {
    marginTop: 0,
    fontSize: 10,
    textAlign: 'center',
    color: '#6A1B9A',
    whiteSpace: 'nowrap',
    // fontStyle: 'italic',
  },
});

export default XpCard;
