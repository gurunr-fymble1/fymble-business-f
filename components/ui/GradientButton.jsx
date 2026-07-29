import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

const GradientButton = ({
  title = 'Full Report View',
  fromColor = '#28A745',
  toColor = '#007BFF',
  mainContainerStyle = {},
  containerStyle = {},
  textStyle = {},
  belowButtonText,
  disable,
  onPress1 = {},
  onPress2 = {},
}) => {
  const router = useRouter();

  return (
    <View
      style={[
        {
          display: 'flex',
          alignItems: 'center',
        },
        mainContainerStyle,
      ]}
    >
      <TouchableOpacity onPress={onPress1} activeOpacity={0.8}>
        <View>
          <LinearGradient
            colors={[fromColor, toColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, containerStyle]}
          >
            <Text style={[styles.text, textStyle]}>{title}</Text>
          </LinearGradient>
        </View>
      </TouchableOpacity>

      {belowButtonText && (
        <TouchableOpacity onPress={onPress2} activeOpacity={0.8}>
          <Text style={[styles.link]}>{belowButtonText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default GradientButton;

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: '#28A745',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    width: '100%',
  },
  text: {
    color: '#FFF',
    fontFamily: 'Roboto',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '400',
    // lineHeight: 9.68,
    flexDirection: 'row',
  },
  link: {
    color: '#007BFF',
    fontFamily: 'Roboto',
    fontSize: 10,
    fontStyle: 'normal',
    fontWeight: '400',
    // lineHeight: 9.68,
    flexDirection: 'row',
    marginTop: 10,
    textAlign: 'center',
  },
});
