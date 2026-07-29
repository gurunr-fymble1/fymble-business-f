import React, { useState } from 'react';
import { Image, StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ImageWithFallback = ({
  source,
  style,
  resizeMode = 'contain',
  fallbackIcon = 'image-outline',
  fallbackIconSize = 40,
  fallbackIconColor = '#999',
  fallbackText = 'Image could not be loaded',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        <Ionicons name={fallbackIcon} size={fallbackIconSize} color={fallbackIconColor} />
        <Text style={styles.fallbackText}>{fallbackText}</Text>
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      onError={() => setHasError(true)}
    />
  );
};

const styles = StyleSheet.create({
  fallbackContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  fallbackText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});

export default ImageWithFallback;