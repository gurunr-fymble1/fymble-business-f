import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import ViewShot from 'react-native-view-shot';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const SelfieCapture = ({ onCapture, onRetake, gymCity }) => {
  const insets = useSafeAreaInsets();
  const [capturedImage, setCapturedImage] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [location, setLocation] = useState(gymCity || 'Loading...');
  const [isCapturing, setIsCapturing] = useState(false);
  const [facing, setFacing] = useState('front');
  const [mode, setMode] = useState(null); // null = selection, 'camera' = camera, 'gallery' = gallery
  const [cameraPermission, setCameraPermission] = useState(null); // null = not checked, true = granted, false = denied
  const [isCheckingPermission, setIsCheckingPermission] = useState(false);

  const cameraRef = useRef(null);
  const viewShotRef = useRef(null);

  useEffect(() => {
    const updateTimestamp = () => {
      const now = new Date();
      const day = now.getDate();
      const month = now.toLocaleString('en-US', { month: 'short' });
      const year = now.getFullYear();
      const time = now.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      setTimestamp(`${day} ${month} ${year}, ${time}`);
    };

    updateTimestamp();
    const interval = setInterval(updateTimestamp, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!gymCity) {
      getLocation();
    }
  }, [gymCity]);

  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address?.city) {
          setLocation(address.city);
        } else if (address?.subregion) {
          setLocation(address.subregion);
        } else {
          setLocation('India');
        }
      } else {
        setLocation(gymCity || 'India');
      }
    } catch (error) {
      console.error('Location error:', error);
      setLocation(gymCity || 'India');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      setCapturedImage(photo.uri);
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const captureWithTimestamp = async () => {
    if (!viewShotRef.current) return;

    setIsCapturing(true);
    try {
      const uri = await viewShotRef.current.capture();
      onCapture(uri);
    } catch (error) {
      console.error('ViewShot capture error:', error);
      Alert.alert('Error', 'Failed to save photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMode(null);
    if (onRetake) onRetake();
  };

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant gallery access to upload photos.');
        setMode(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false, // Skip native crop - we show preview in app
        quality: 0.9,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCapturedImage(result.assets[0].uri);
      } else {
        setMode(null);
      }
    } catch (error) {
      console.error('Gallery picker error:', error);
      Alert.alert('Error', 'Failed to pick image from gallery.');
      setMode(null);
    }
  };

  const handleSelectMode = async (selectedMode) => {
    if (selectedMode === 'gallery') {
      setMode(selectedMode);
      pickImageFromGallery();
    } else if (selectedMode === 'camera') {
      // Check camera permission only when camera is selected
      setIsCheckingPermission(true);
      try {
        const { status } = await Camera.requestCameraPermissionsAsync();
        setCameraPermission(status === 'granted');
        setMode(selectedMode);
      } catch (error) {
        console.error('Camera permission error:', error);
        Alert.alert('Error', 'Failed to access camera permissions.');
      } finally {
        setIsCheckingPermission(false);
      }
    }
  };

  const requestCameraPermission = async () => {
    setIsCheckingPermission(true);
    try {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setCameraPermission(status === 'granted');
    } catch (error) {
      console.error('Camera permission error:', error);
    } finally {
      setIsCheckingPermission(false);
    }
  };

  // Mode selection screen
  if (!mode && !capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.modeSelectionContainer}>

          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => handleSelectMode('camera')}
            >
              <View style={styles.modeOptionIcon}>
                <Ionicons name="camera" size={32} color="#0154A0" />
              </View>
              <Text style={styles.modeOptionTitle}>Take Photo</Text>
              <Text style={styles.modeOptionDesc}>Use camera to capture selfie</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => handleSelectMode('gallery')}
            >
              <View style={styles.modeOptionIcon}>
                <Ionicons name="images" size={32} color="#22c55e" />
              </View>
              <Text style={styles.modeOptionTitle}>Upload from Gallery</Text>
              <Text style={styles.modeOptionDesc}>Choose existing photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Loading state while checking camera permission
  if (isCheckingPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0154A0" />
          <Text style={styles.loadingText}>Checking camera access...</Text>
        </View>
      </View>
    );
  }

  // Camera permission denied
  if (mode === 'camera' && cameraPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={64} color="#9ca3af" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to capture your selfie for agreement verification.
          </Text>
          <TouchableOpacity onPress={requestCameraPermission} activeOpacity={0.8}>
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.permissionButton}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backToSelectionButton} onPress={() => setMode(null)}>
            <Text style={styles.backToSelectionText}>Back to Options</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show captured image preview
  if (capturedImage) {
    return (
      <View style={styles.container}>
        {/* Preview Image with Timestamp */}
        <View style={styles.previewArea}>
          <ViewShot ref={viewShotRef} options={{ format: 'jpg', quality: 0.9 }} style={styles.viewShot}>
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            <View style={styles.timestampBadge}>
              <Text style={styles.timestampText}>{timestamp} | {location}</Text>
            </View>
          </ViewShot>
        </View>

        {/* Bottom Buttons */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.usePhotoButton}
            onPress={captureWithTimestamp}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={24} color="#fff" />
                <Text style={styles.buttonText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Gallery mode - show loading while picker is open
  if (mode === 'gallery') {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#0154A0" />
          <Text style={styles.loadingText}>Opening gallery...</Text>
        </View>
      </View>
    );
  }

  // Camera view - ONLY render when mode is 'camera' and permission granted
  if (mode === 'camera' && cameraPermission === true) {
    return (
      <View style={styles.container}>
        {/* Camera */}
        <View style={styles.cameraArea}>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
            mirror={facing === 'front'}
          />
          {/* Timestamp overlay on camera */}
          <View style={styles.timestampBadge}>
            <Text style={styles.timestampText}>{timestamp} | {location}</Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.captureButton}
            onPress={takePicture}
            disabled={isCapturing}
          >
            {isCapturing ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <View style={styles.captureButtonInner} />
            )}
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </View>
    );
  }

  // Default fallback - show mode selection
  return (
    <View style={styles.container}>
      <View style={styles.modeSelectionContainer}>
        <View style={styles.modeOptions}>
          <TouchableOpacity
            style={styles.modeOption}
            onPress={() => handleSelectMode('camera')}
          >
            <View style={styles.modeOptionIcon}>
              <Ionicons name="camera" size={32} color="#0154A0" />
            </View>
            <Text style={styles.modeOptionTitle}>Take Photo</Text>
            <Text style={styles.modeOptionDesc}>Use camera to capture selfie</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeOption}
            onPress={() => handleSelectMode('gallery')}
          >
            <View style={styles.modeOptionIcon}>
              <Ionicons name="images" size={32} color="#22c55e" />
            </View>
            <Text style={styles.modeOptionTitle}>Upload from Gallery</Text>
            <Text style={styles.modeOptionDesc}>Choose existing photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  loadingText: {
    color: '#666',
    marginTop: 16,
    fontSize: 14,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraArea: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  previewArea: {
    flex: 1,
    position: 'relative',
  },
  viewShot: {
    flex: 1,
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  timestampBadge: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  timestampText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: 'hidden',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#1f2937',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  flipButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  placeholderButton: {
    width: 56,
    height: 56,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6b7280',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  usePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Mode Selection Styles
  modeSelectionContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    paddingTop: 40,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },

  modeOptions: {
    width: '100%',
    gap: 16,
  },
  modeOption: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  modeOptionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  modeOptionDesc: {
    fontSize: 13,
    color: '#6b7280',
  },
  backToSelectionButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backToSelectionText: {
    color: '#0154A0',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default SelfieCapture;
