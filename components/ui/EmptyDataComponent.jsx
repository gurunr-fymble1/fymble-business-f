import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

const EmptyStateCard = ({
  imageSource,
  title = '',
  message = '',
  buttonText = '',
  onButtonPress,
  belowButtonText,
  onButtonPress2,
}) => {
  return (
    <View style={styles.container}>
      <Ionicons name="file-tray" size={70} color="black" />

      {title && <Text style={styles.title}>{title}</Text>}

      {/* <Image source={imageSource} style={styles.image} resizeMode="contain" /> */}

      <Text style={styles.message}>{message}</Text>

      {buttonText && (
        <TouchableOpacity style={styles.button} onPress={onButtonPress}>
          <Text style={styles.buttonText}>{buttonText}</Text>
        </TouchableOpacity>
      )}

      {belowButtonText && (
        <TouchableOpacity style={styles.link} onPress={onButtonPress2}>
          <Text style={styles.buttonText2}>{belowButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default EmptyStateCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 70,
    alignItems: 'center',
    paddingHorizontal: 10,
    // backgroundColor: 'white',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    color: '#000',
  },
  image: {
    width: 290,
    height: 270,
  },
  message: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    marginTop: 20,
    // lineHeight: 30,
    paddingHorizontal: 30,
  },
  button: {
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  link: {
    // borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },

  buttonText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  buttonText2: {
    color: '#007AFF',
    fontWeight: '500',
    fontSize: 10,
  },
});
