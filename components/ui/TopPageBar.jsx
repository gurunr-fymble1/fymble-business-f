// components/TopPageBar.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaskedText } from './MaskedText';
import { LinearGradient } from 'expo-linear-gradient';

const TopPageBar = ({
  title = "Today's Food Log",
  addText = '',
  addColorLeft = '#e0ffe7b1',
  addColorRight = '#c9e3ffaf',
  textStyle = {},
  containerStyle = {},
  navigateTo, // optional
  onAddPress,
  rightSideComponent,
  handlePress,
}) => {
  const router = useRouter();

  return (
    <LinearGradient
      style={[styles.container]}
      colors={[addColorLeft, addColorRight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
    >
      <View style={[styles.container2]}>
        {title && <Text style={[styles.title, textStyle]}>{title}</Text>}

        <TouchableOpacity onPress={handlePress}>
          {addText && (
            <MaskedText bg1={'#28A745'} bg2={'#007BFF'} text={'+Add Food'} />
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handlePress}>
          {rightSideComponent && rightSideComponent}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default TopPageBar;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    // paddingVertical: 12,
    // paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',

    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,

    // Android bottom shadow
    elevation: 6,
    marginBottom: 10,
  },
  container2: {
    // backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  addText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
