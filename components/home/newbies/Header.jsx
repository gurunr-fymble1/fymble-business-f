import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const Header = ({ count, title, word1, word2 }) => {
  return (
    <LinearGradient
      colors={['#20062D', '#693882']}
      style={styles.headerContainer}
    >
      <View style={styles.iconContainer}>
        <Image
          source={require('../../../assets/images/newbies/icon_1.png')}
          style={styles.icon}
          contentFit="contain"
        />
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.count}>{String(count).padStart(2, '0')}</Text>
        <View>
          <Text style={styles.title}>{word1}</Text>
          <Text style={styles.title}>{word2}</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // backgroundColor: '#512B81',
    borderRadius: 12,
    justifyContent: 'space-between',
    paddingVertical: 16,
    // margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 25,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 55,
    height: 55,
    tintColor: 'white',
  },
  titleContainer: {
    flexDirection: 'row',
    marginLeft: 16,
    alignItems: 'center',
    borderBottomColor: 'white',
    borderBottomWidth: 1,
  },
  count: {
    fontSize: 44,
    fontWeight: '500',
    color: 'white',
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    color: 'white',
    opacity: 0.9,
  },
});

export default Header;
