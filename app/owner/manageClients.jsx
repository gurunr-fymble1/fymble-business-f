import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
} from "react-native";
import * as Animatable from "react-native-animatable";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import * as XLSX from "xlsx";
import * as FileSystem from "expo-file-system";

import OwnerHeader from "../../components/ui/OwnerHeader";
import { useRouter } from "expo-router";
import { ImportDataAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import ImportResultModal from "../../components/client/ImportResultModal";
import GetGymClientDataInstructionModal from "../../components/client/GetGymClientDataInstructionModal";
import { showToast } from "../../utils/Toaster";
import AllClientsSkeleton from "../../components/ui/loaders/allClientsSkeleton";

const ManageClients = () => {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [instructionModalVisible, setInstructionModalVisible] = useState(false);

  const handleNavigation = (route) => {
    router.push(route);
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.ms-excel",
          "text/csv",
        ],
        copyToCacheDirectory: true,
      });

      if (result) {
        setIsLoading(true);
        const formData = new FormData();
        const gymId = await getToken("gym_id");
        formData.append("gym_id", gymId);

        const fileUri = result.assets[0].uri;
        const fileType = result.assets[0].mimeType;
        const fileName = result.assets[0].name;

        const fileBlob = {
          uri: fileUri,
          type: fileType || "application/octet-stream",
          name: fileName,
        };

        formData.append("file", fileBlob);

        const response = await ImportDataAPI(formData);

        if (response?.status == 200) {
          setImportResult(response);
          setImportModalVisible(true);
          // fetchClients();
        } else {
          showToast({
            type: "error",
            title: response?.detail || "Unable to import clients",
          });
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Failed to import file",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCorruptedData = async () => {
    try {
      if (
        !importResult ||
        !importResult.corrupted_rows ||
        importResult.corrupted_rows.length === 0
      ) {
        return;
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        showToast({
          type: "error",
          title: "Sharing is not available on this device",
        });
        return;
      }

      const corruptedData = importResult.corrupted_rows.map((item) => ({
        Row: item.row,
        Name: item.data.Name || "",
        Contact: item.data.Contact || "",
        Email: item.data.Email || "",
        Location: item.data.Location || "",
        Gender: item.data.Gender || "",
        Status: item.data.Status || "",
        Errors: item.errors.join(", "),
      }));

      const worksheet = XLSX.utils.json_to_sheet(corruptedData);

      const widths = [
        { wch: 5 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 40 },
      ];

      worksheet["!cols"] = widths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Corrupted Data");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      const fileName = `corrupted_data_${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      const filePath = `${FileSystem.cacheDirectory}${fileName}`;

      // Write the Excel data using SDK 54 File API
      const file = new FileSystem.File(filePath);
      await file.write(excelBuffer, {
        encoding: FileSystem.EncodingType.Base64,
      });

      await Sharing.shareAsync(filePath, {
        mimeType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        dialogTitle: "Import Errors Report",
        UTI: "com.microsoft.excel.xlsx",
      });
    } catch (error) {
      showToast({
        type: "error",
        title: error.message || "Failed to export error report",
      });
    }
  };

  const ClientCard = ({
    title,
    description,
    icon,
    iconFamily,
    color,
    route,
  }) => {
    const IconComponent = iconFamily;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: color }]}
        onPress={() => handleNavigation(route)}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <View style={styles.iconContainer}>
            <IconComponent name={icon} size={40} color="#FFF" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardDescription}>{description}</Text>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.viewText}>View</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </View>
      </TouchableOpacity>
    );
  };
  if (isLoading) {
    return <AllClientsSkeleton />;
  }

  return (
    <View style={styles.container}>
      <OwnerHeader />
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.pageTitle}>Client Management</Text>
          <Text style={styles.pageSubtitle}>
            Select an option to manage your fitness clients
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <ClientCard
            title="Payment Management"
            description="Assign workouts and track client progress"
            icon="dumbbell"
            iconFamily={MaterialCommunityIcons}
            color="#12B886"
            route="/owner/client"
          />

          <ClientCard
            title="Client Directory"
            description="View, search and manage all your registered clients"
            icon="people"
            iconFamily={Ionicons}
            color="#4C6EF5"
            route="/owner/clientsManagement"
          />
        </View>
      </View>
      <ImportResultModal
        visible={importModalVisible}
        onDismiss={() => setImportModalVisible(false)}
        importResult={importResult}
        onDownloadCorrupted={handleExportCorruptedData}
      />

      <GetGymClientDataInstructionModal
        handleImport={handleImport}
        setIsLoading={setIsLoading}
        visible={instructionModalVisible}
        onClose={() => setInstructionModalVisible(false)}
      />

      <View style={styles.floatingActionContainer}>
        <TouchableOpacity
          style={styles.floatingActionButton}
          // onPress={handleImport}
          onPress={() => {
            setInstructionModalVisible(true);
          }}
        >
          <Ionicons
            name="cloud-download-outline"
            color="#fff"
            size={20}
          ></Ionicons>
          {/* <Text style={styles.actionButtonText}>Import</Text> */}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ManageClients;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F7",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
  },
  headerContainer: {
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: "#4C6EF5",
    paddingLeft: 16,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#2C3E50",
    marginBottom: 10,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#7F8C8D",
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
  },
  cardsContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardContent: {
    flexDirection: "row",
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    padding: 12,
  },
  viewText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginRight: 8,
  },
  actionContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    // marginLeft: 8,
    marginTop: 6,
  },
  floatingActionContainer: {
    position: "absolute",
    bottom: 110,
    right: 30,
    // left: 0,
    zIndex: 1000,
  },
  floatingActionButton: {
    height: 60,
    width: 60,
    borderRadius: 100,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4F46E5",
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000", // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
