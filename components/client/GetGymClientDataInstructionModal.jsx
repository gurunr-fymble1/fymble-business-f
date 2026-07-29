import React, { useState } from "react";
import {
  Modal,
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Linking,
} from "react-native";
import { Paths, File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import { showToast } from "../../utils/Toaster";

const sampleData = [
  {
    Name: "John Smith",
    Email: "john@example.com",
    Contact: "9876543210",
    Location: "Chennai",
    Gender: "Male",
    Status: "active",
    AdmissionNumber: "ABC0005",
    ExpiresAt: "2025-12-31",
    JoinedAt: "2024-01-15",
  },
  {
    Name: "Emma Johnson",
    Email: "emma@example.com",
    Contact: "9876543210",
    Location: "Bangalore",
    Gender: "Female",
    Status: "inactive",
    AdmissionNumber: "ABC0006",
    ExpiresAt: "2025-11-30",
    JoinedAt: "2024-02-20",
  },
  {
    Name: "Michael Rodriguez",
    Email: "michael@example.com",
    Contact: "9876543210",
    Location: "Chennai",
    Gender: "Male",
    Status: "inactive",
    AdmissionNumber: "ABC0007",
    ExpiresAt: "2025-10-15",
    JoinedAt: "2024-03-10",
  },
];

const GetGymClientDataInstructionModal = ({
  visible,
  onClose,
  handleImport,
  setIsLoading,
}) => {
  const [activeTab, setActiveTab] = useState("instructions");
  const [isDownloading, setIsDownloading] = useState(false);
  const [showIOSWarning, setShowIOSWarning] = useState(false);

  const generateExcelFile = () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData);

    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    return excelBuffer;
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      if (typeof window !== "undefined" && typeof document !== "undefined") {
        const excelBuffer = generateExcelFile();
        const blob = new Blob([excelBuffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "sample_client_data_format.xlsx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        onClose();
      } else {
        await handleDownloadTemplateMobile();
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to download template. Please try again.",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadTemplateMobile = async () => {
    try {
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Clients");

      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "base64" });

      const fileName = "sample_client_data_format.xlsx";

      if (Platform.OS === "android") {
        // Android: Use Storage Access Framework to save directly
        const permissions =
          await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (!permissions.granted) {
          showToast({
            type: "error",
            title: "Storage permission is required to save the file",
          });
          return;
        }

        // Create file in the selected directory
        const fileUri =
          await FileSystemLegacy.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            fileName,
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          );

        // Write the Excel data to the file
        await FileSystemLegacy.writeAsStringAsync(fileUri, wbout, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        showToast({
          type: "success",
          title: "Template saved successfully",
        });
      } else {
        // iOS: Use expo-sharing
        const file = new File(Paths.cache, fileName);

        // Check if file exists and delete it first to avoid "File already exists" error
        if (file.exists) {
          await file.delete();
        }

        await file.create();
        await file.write(wbout);

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
          showToast({
            type: "error",
            title: "Sharing is not available on this device",
          });
          return;
        }

        await Sharing.shareAsync(file.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: "Save Template",
          UTI: "com.microsoft.excel.xlsx",
        });

        showToast({
          type: "success",
          title: "Template saved successfully",
        });
      }

      // Close modal after successful save
      onClose();
    } catch (error) {
      showToast({
        type: "error",
        title: error.message || "Failed to save template. Please try again.",
      });
    }
  };

  const renderSampleTable = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={true}>
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { width: 120 }]}>Name</Text>
          <Text style={[styles.tableHeaderCell, { width: 150 }]}>Email</Text>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>Contact</Text>
          <Text style={[styles.tableHeaderCell, { width: 100 }]}>Location</Text>
          <Text style={[styles.tableHeaderCell, { width: 80 }]}>Gender</Text>
          <Text style={[styles.tableHeaderCell, { width: 80 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { width: 140 }]}>
            Admission number (optional)
          </Text>
          <Text style={[styles.tableHeaderCell, { width: 140 }]}>
            Expires At (YY-MM-DDDD)(optional)
          </Text>
          <Text style={[styles.tableHeaderCell, { width: 140 }]}>
            Joined At (YY-MM-DDDD)(optional)
          </Text>
        </View>

        {sampleData.map((client, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.tableCell, { width: 120 }]}>
              {client.Name}
            </Text>
            <Text style={[styles.tableCell, { width: 150 }]}>
              {client.Email}
            </Text>
            <Text style={[styles.tableCell, { width: 100 }]}>
              {client.Contact}
            </Text>
            <Text style={[styles.tableCell, { width: 100 }]}>
              {client.Location}
            </Text>
            <Text style={[styles.tableCell, { width: 80 }]}>
              {client.Gender}
            </Text>
            <Text style={[styles.tableCell, { width: 80 }]}>
              {client.Status}
            </Text>
            <Text style={[styles.tableCell, { width: 140 }]}>
              {client.AdmissionNumber}
            </Text>
            <Text style={[styles.tableCell, { width: 140 }]}>
              {client.ExpiresAt}
            </Text>
            <Text style={[styles.tableCell, { width: 140 }]}>
              {client.JoinedAt}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Import Gym Client Data</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "instructions" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("instructions")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "instructions" && styles.activeTabText,
                  ]}
                >
                  Instructions
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "preview" && styles.activeTab,
                ]}
                onPress={() => setActiveTab("preview")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "preview" && styles.activeTabText,
                  ]}
                >
                  Data Preview
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {activeTab === "instructions" ? (
                <View>
                  <Text style={styles.sectionTitle}>
                    How to Import Your Gym Client Data
                  </Text>

                  <View style={styles.instructionStep}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNumber}>1</Text>
                    </View>
                    <Text style={styles.instructionText}>
                      Download our Excel template with the correct format
                    </Text>
                  </View>

                  <View style={styles.instructionStep}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNumber}>2</Text>
                    </View>
                    <Text style={styles.instructionText}>
                      Enter your client information following the format in the
                      template
                    </Text>
                  </View>

                  <View style={styles.instructionStep}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNumber}>3</Text>
                    </View>
                    <Text style={styles.instructionText}>
                      Save your Excel file (.xlsx format)
                    </Text>
                  </View>

                  <View style={styles.instructionStep}>
                    <View style={styles.stepCircle}>
                      <Text style={styles.stepNumber}>4</Text>
                    </View>
                    <Text style={styles.instructionText}>
                      Click "Import" and select your file
                    </Text>
                  </View>

                  <Text style={styles.importantNote}>
                    Note: Your data must match the template format exactly.
                    Required fields include name, email, contact.
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.downloadButton,
                      isDownloading && styles.downloadButtonDisabled,
                    ]}
                    onPress={handleDownloadTemplate}
                    disabled={isDownloading}
                  >
                    <Text style={styles.downloadButtonText}>
                      {isDownloading ? "Saving..." : "Get Excel Template"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <Text style={styles.sectionTitle}>Data Format Preview</Text>
                  <Text style={styles.previewDescription}>
                    Your Excel file should match this exact format. All columns
                    shown below are required.
                  </Text>

                  {renderSampleTable()}

                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>
                      Tips for Successful Import:
                    </Text>
                    <Text style={styles.tipItem}>
                      • Ensure all email addresses are valid
                    </Text>
                    <Text style={styles.tipItem}>
                      • Phone numbers should be proper and in 10 digits
                    </Text>
                    <Text style={styles.tipItem}>
                      • Location can be anything(optional)
                    </Text>
                    <Text style={styles.tipItem}>
                      • Gender must be only "Male" or "Female"
                    </Text>
                    <Text style={styles.tipItem}>
                      • Status must be "active" or "inactive"
                    </Text>
                    <Text style={styles.tipItem}>
                      • Admision Number is (Optional)
                    </Text>
                    <Text style={styles.tipItem}>
                      •Expiry date should be in YYYY-MM-DD format(optional)
                    </Text>
                    <Text style={styles.tipItem}>
                      •Joined date should be in YYYY-MM-DD format(optional)
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.importButton}
                onPress={() => {
                  if (Platform.OS === "ios") {
                    onClose();
                    setTimeout(() => setShowIOSWarning(true), 300);
                  } else {
                    setIsLoading(true);
                    onClose();
                    handleImport();
                  }
                }}
              >
                <Text style={styles.importButtonText}>Start Import</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* iOS Warning Modal */}
      <Modal
        visible={showIOSWarning}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowIOSWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.iosWarningContainer}>
            <View style={styles.warningHeader}>
              <Text style={styles.warningTitle}>
                iOS File Access Restriction
              </Text>
              <TouchableOpacity
                onPress={() => setShowIOSWarning(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.warningContent}>
              <Text style={styles.warningText}>
                Due to iOS restrictions for accessing file storage, we request
                you to import the data from the web app.
              </Text>

              <TouchableOpacity
                style={styles.webAppButton}
                onPress={() => {
                  Linking.openURL("https://business.fittbot.com/");
                  setShowIOSWarning(false);
                }}
              >
                <Text style={styles.webAppButtonText}>Open Web App</Text>
              </TouchableOpacity>

              <Text style={styles.instructionText}>
                Login and visit the Clients Page to import your data.
              </Text>
            </View>

            <View style={styles.warningFooter}>
              <TouchableOpacity
                style={styles.cancelWarningButton}
                onPress={() => setShowIOSWarning(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 600,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#6B7280",
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#22426B",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeTabText: {
    color: "#22426B",
  },
  modalContent: {
    padding: 20,
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 16,
  },
  instructionStep: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#22426B",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumber: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  instructionText: {
    fontSize: 14,
    color: "#1F2937",
    flex: 1,
  },
  importantNote: {
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    marginTop: 8,
    marginBottom: 16,
    fontSize: 13,
    color: "#92400E",
  },
  downloadButton: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  downloadButtonDisabled: {
    backgroundColor: "#9CA3AF",
    opacity: 0.7,
  },
  downloadButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  previewDescription: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 16,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  tableCell: {
    fontSize: 12,
    color: "#6B7280",
  },
  tipsContainer: {
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E40AF",
    marginBottom: 8,
  },
  tipItem: {
    fontSize: 13,
    color: "#3B82F6",
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  cancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginRight: 12,
  },
  cancelButtonText: {
    color: "#6B7280",
    fontWeight: "600",
    fontSize: 14,
  },
  importButton: {
    backgroundColor: "#22426B",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  iosWarningContainer: {
    width: "85%",
    maxWidth: 500,
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  warningHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#FEF3C7",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400E",
    flex: 1,
  },
  warningContent: {
    padding: 20,
  },
  warningText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 20,
    marginBottom: 20,
    textAlign: "center",
  },
  webAppButton: {
    backgroundColor: "#22426B",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 16,
  },
  webAppButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  instructionText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    fontStyle: "italic",
  },
  warningFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
    alignItems: "center",
  },
  cancelWarningButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
});

export default GetGymClientDataInstructionModal;
