import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const OfferFormHeader = ({ onBackPress, title, subtitle }) => {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF5757', '#8C52FF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </View>
          <View style={styles.iconContainer}>
            {/* <Image
              source={require('../../assets/images/offers/gift-icon.png')}
              style={styles.icon}
              resizeMode="contain"
            /> */}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
  },
  gradient: {
    width: '100%',
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 30,
    height: 30,
    tintColor: '#FFF',
  },
});

export default OfferFormHeader;
