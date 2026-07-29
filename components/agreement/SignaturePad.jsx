import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  Alert,
} from "react-native";
import SignatureScreen from "react-native-signature-canvas";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const SignaturePad = ({ onSave, onClear }) => {
  const signatureRef = useRef(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState(null); // null = selection, 'draw' = signature pad, 'gallery' = upload
  const [galleryImage, setGalleryImage] = useState(null);

  const handleSignature = (signature) => {
    // signature is base64 PNG with data:image/png;base64, prefix
    setIsSaving(true);
    try {
      onSave(signature);
    } catch (error) {
      console.error("Signature save error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmpty = () => {
    setIsEmpty(true);
  };

  const handleBegin = () => {
    setIsEmpty(false);
  };

  const handleClear = () => {
    signatureRef.current?.clearSignature();
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const handleConfirm = () => {
    if (isEmpty) {
      return;
    }
    signatureRef.current?.readSignature();
  };

  const pickImageFromGallery = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please grant gallery access to upload signature."
        );
        setMode(null);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false, // Skip native crop - we show preview in app
        quality: 0.9,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setGalleryImage(result.assets[0].uri);
      } else {
        setMode(null);
      }
    } catch (error) {
      console.error("Gallery picker error:", error);
      Alert.alert("Error", "Failed to pick image from gallery.");
      setMode(null);
    }
  };

  const handleSelectMode = (selectedMode) => {
    setMode(selectedMode);
    if (selectedMode === "gallery") {
      pickImageFromGallery();
    }
  };

  const handleBackToSelection = () => {
    setMode(null);
    setGalleryImage(null);
    setIsEmpty(true);
    if (onClear) onClear();
  };

  const handleGalleryImageConfirm = async () => {
    if (!galleryImage) return;

    setIsSaving(true);
    try {
      // Read the image file and convert to base64
      const base64 = await FileSystem.readAsStringAsync(galleryImage, {
        encoding: "base64",
      });
      const dataUrl = `data:image/png;base64,${base64}`;
      onSave(dataUrl);
    } catch (error) {
      console.error("Gallery image save error:", error);
      Alert.alert("Error", "Failed to process the image.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetakeGallery = () => {
    setGalleryImage(null);
    pickImageFromGallery();
  };

  // Web style for the signature canvas
  const webStyle = `
    .m-signature-pad {
      box-shadow: none;
      border: none;
      margin: 0;
      width: 100%;
      height: 100%;
    }
    .m-signature-pad--body {
      border: none;
    }
    .m-signature-pad--footer {
      display: none;
    }
    body, html {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: transparent;
    }
    canvas {
      width: 100% !important;
      height: 100% !important;
    }
  `;

  // Mode selection screen
  if (!mode) {
    return (
      <View style={styles.container}>
        <View style={styles.modeSelectionContainer}>
          <View style={styles.modeOptions}>
            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => handleSelectMode("draw")}
            >
              <View style={styles.modeOptionIcon}>
                <Ionicons name="create" size={28} color="#0154A0" />
              </View>
              <Text style={styles.modeOptionTitle}>Draw Signature</Text>
              <Text style={styles.modeOptionDesc}>Sign using your finger</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => handleSelectMode("gallery")}
            >
              <View style={styles.modeOptionIcon}>
                <Ionicons name="images" size={28} color="#22c55e" />
              </View>
              <Text style={styles.modeOptionTitle}>Upload Signature</Text>
              <Text style={styles.modeOptionDesc}>Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Gallery image preview
  if (mode === "gallery" && galleryImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackToSelection}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1f2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Uploaded Signature</Text>
        </View>

        <Text style={styles.instructions}>Review your signature image</Text>

        <View style={styles.galleryPreviewContainer}>
          <View style={styles.galleryImageBox}>
            <Image
              source={{ uri: galleryImage }}
              style={styles.galleryImage}
              resizeMode="contain"
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={handleRetakeGallery}
          >
            <Ionicons name="refresh-outline" size={20} color="#6b7280" />
            <Text style={styles.clearButtonText}>Change</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleGalleryImageConfirm}
            disabled={isSaving}
            activeOpacity={0.8}
            style={{ flex: 2 }}
          >
            <LinearGradient
              colors={
                isSaving ? ["#4A90C2", "#4A90C2"] : ["#030A15", "#0154A0"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmButton}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>
                    Confirm Signature
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Gallery mode but no image yet (picker was canceled)
  if (mode === "gallery" && !galleryImage) {
    return (
      <View style={styles.container}>
        <View style={styles.modeSelectionContainer}>
          <Ionicons name="image-outline" size={60} color="#9ca3af" />
          <Text style={styles.modeTitle}>No Image Selected</Text>
          <Text style={styles.modeDescription}>
            Please select a signature image from your gallery
          </Text>
          <View style={styles.noImageActions}>
            <TouchableOpacity
              onPress={pickImageFromGallery}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#030A15", "#0154A0"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Select Image</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backToOptionsButton}
              onPress={handleBackToSelection}
            >
              <Text style={styles.backToOptionsText}>Back to Options</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Draw signature mode
  return (
    <View style={styles.container}>
      <View style={styles.signatureBox}>
        <SignatureScreen
          ref={signatureRef}
          onOK={handleSignature}
          onEmpty={handleEmpty}
          onBegin={handleBegin}
          webStyle={webStyle}
          backgroundColor="rgba(255, 255, 255, 0)"
          penColor="black"
          minWidth={2}
          maxWidth={4}
          dotSize={4}
          trimWhitespace={true}
          imageType="image/png"
          dataURL={true}
        />
        {/* Sign here line inside box */}
        <View style={styles.signatureLine}>
          <Text style={styles.signatureLineText}>Sign here</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
          <Ionicons name="trash-outline" size={20} color="#6b7280" />
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={isEmpty || isSaving}
          activeOpacity={0.8}
          style={{ flex: 2 }}
        >
          <LinearGradient
            colors={
              isEmpty || isSaving
                ? ["#4A90C2", "#4A90C2"]
                : ["#030A15", "#0154A0"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.confirmButton}
          >
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.confirmButtonText}>Confirm Signature</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {isEmpty && (
        <Text style={styles.emptyHint}>
          Please draw your signature above to continue
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  instructions: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
  },
  signatureBox: {
    height: 280,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    borderStyle: "dashed",
    overflow: "hidden",
    marginBottom: 20,
  },
  signatureLine: {
    position: "absolute",
    bottom: 40,
    left: 30,
    right: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
  },
  signatureLineText: {
    color: "#9ca3af",
    fontSize: 12,
    position: "absolute",
    bottom: 6,
    left: 0,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
    flex: 1,
  },
  clearButtonText: {
    color: "#6b7280",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 6,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyHint: {
    color: "#f59e0b",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },
  // Mode Selection Styles
  modeSelectionContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: 20,
    paddingHorizontal: 24,
  },
  modeIcon: {
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 8,
    textAlign: "center",
  },
  modeDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  modeOptions: {
    width: "100%",
    gap: 16,
  },
  modeOption: {
    backgroundColor: "#f9fafb",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  modeOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modeOptionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modeOptionDesc: {
    fontSize: 13,
    color: "#6b7280",
  },
  backButton: {
    marginRight: 8,
    padding: 4,
  },
  // Gallery Preview Styles
  galleryPreviewContainer: {
    flex: 1,
    marginBottom: 20,
  },
  galleryImageBox: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    minHeight: 200,
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  noImageActions: {
    gap: 12,
    width: "100%",
    marginTop: 24,
  },
  retryButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  backToOptionsButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  backToOptionsText: {
    color: "#6b7280",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default SignaturePad;
