// excelUtils.js - Place this in a utilities folder
import * as XLSX from "xlsx";
import { Paths, File } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";
import { showToast } from "../../utils/Toaster";

/**
 * Formats client data for export to Excel
 * @param {Array} clients - Array of client objects
 * @returns {Array} - Formatted array for Excel export
 */
export const formatClientsForExport = (clients) => {
  return clients.map((client) => ({
    Name: client.name || "N/A",
    Email: client.email || "N/A",
    Phone: client.contact || "N/A",
    Age: client.age || "N/A",
    Location: client.place || "N/A",
    Batch: client.batch || "N/A",
    "Training Type": client.training || "N/A",
    "Fee Status": client.feePaid || "N/A",
    Goal: client.goal || "N/A",
    "Joined Date": client.joined_date || "N/A",
    BMI: client.bmi || "N/A",
  }));
};

/**
 * Creates an Excel file from data
 * @param {Array} data - Formatted data array
 * @param {String} sheetName - Name for the Excel sheet
 * @returns {String} - Base64 encoded Excel content
 */
export const createExcelBuffer = (data, sheetName = "Sheet1") => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  return XLSX.write(workbook, {
    bookType: "xlsx",
    type: "base64",
  });
};

/**
 * Writes Excel buffer to file system and returns path
 * @param {String} buffer - Base64 encoded Excel content
 * @param {String} fileName - Name for the saved file
 * @returns {Promise<String>} - Path to saved file
 */
export const saveExcelToFileSystem = async (buffer, fileName) => {
  // Use new Expo SDK 54 File API
  const file = new File(Paths.cache, fileName);

  // Check if file exists and delete it first to avoid "File already exists" error
  if (file.exists) {
    await file.delete();
  }

  await file.create();
  await file.write(buffer);

  return file.uri;
};

/**
 * Saves Excel file to device storage
 * @param {String} buffer - Base64 encoded Excel content
 * @param {String} fileName - Name for the saved file
 * @returns {Promise<void>}
 */
export const saveExcelToDeviceStorage = async (buffer, fileName) => {
  if (Platform.OS === "android") {
    // Android: Use Storage Access Framework to save directly
    const permissions =
      await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      throw new Error("Storage permission is required to save the file");
    }

    // Create file in the selected directory
    const fileUri =
      await FileSystemLegacy.StorageAccessFramework.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

    // Write the Excel data to the file
    await FileSystemLegacy.writeAsStringAsync(fileUri, buffer, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });
  } else {
    // iOS: Use expo-sharing (iOS requires user interaction to save files)
    const file = new File(Paths.cache, fileName);

    // Check if file exists and delete it first to avoid "File already exists" error
    if (file.exists) {
      await file.delete();
    }

    await file.create();
    await file.write(buffer);

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      throw new Error("Sharing is not available on this device");
    }

    await Sharing.shareAsync(file.uri, {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      dialogTitle: "Save Excel File",
      UTI: "com.microsoft.excel.xlsx",
    });
  }
};

/**
 * Main function to export client data to Excel and save to device storage
 * @param {Array} clients - Array of client objects
 * @param {String} category - Category name for the file
 * @returns {Promise<void>}
 */
export const exportClientsToExcel = async (clients, category = "all") => {
  try {
    // Format data for export
    const formattedData = formatClientsForExport(clients);

    // Create Excel buffer
    const excelBuffer = createExcelBuffer(formattedData, "Clients");

    // Generate file name with current date
    const fileName = `clients_${category}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Save to device storage
    await saveExcelToDeviceStorage(excelBuffer, fileName);

    showToast({
      type: "success",
      title: "Clients exported successfully",
    });

    return true;
  } catch (error) {
    showToast({
      type: "error",
      title: "Excel export error",
      desc: error.message,
    });
    throw error;
  }
};
