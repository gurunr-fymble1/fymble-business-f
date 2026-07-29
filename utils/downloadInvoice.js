import { Platform } from "react-native";
import { showToast } from "./Toaster";

// Import modules conditionally to prevent errors
let PermissionsAndroid;
let ToastAndroid;
let RNHTMLtoPDF;

// Only import React Native specific modules when running on mobile
if (Platform.OS === "android" || Platform.OS === "ios") {
  // Dynamic imports to prevent web errors
  PermissionsAndroid = require("react-native").PermissionsAndroid;
  ToastAndroid = require("react-native").ToastAndroid;

  // Import the PDF library if we're on a mobile device
  try {
    RNHTMLtoPDF = require("react-native-html-to-pdf").default;
  } catch (e) {
    showToast({
      type: "error",
      title: "Error",
      desc: "react-native-html-to-pdf not available:",
    });
  }
}

// Helper function for showing messages across platforms
const showMessage = (message) => {
  if (Platform.OS === "android" && ToastAndroid) {
    ToastAndroid.show(message, ToastAndroid.SHORT);
  } else {
  }
};

export const downloadInvoiceAsPDF = async (invoice) => {
  try {
    // Check if we're running on web
    if (Platform.OS === "web") {
      showToast({
        type: "error",
        title: "Error",
        desc: "PDF generation not supported on web. Printing invoice data instead:",
      });
      return null;
    }

    // Check if the module is available
    if (!RNHTMLtoPDF) {
      showToast({
        type: "error",
        title: "Error",
        desc: "PDF generation module not available. Make sure react-native-html-to-pdf is installed",
      });
      return null;
    }

    // Permission check for Android only
    if (
      Platform.OS === "android" &&
      Platform.Version < 33 &&
      PermissionsAndroid
    ) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Storage permission denied",
        });
        return null;
      }
    }

    // Check if invoice is valid
    if (!invoice || typeof invoice !== "object") {
      throw new Error("Invalid invoice data");
    }

    // Create HTML content with proper error handling for undefined values
    const htmlContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            .section { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; border-bottom: 1px solid #ccc; text-align: left; }
            .footer { margin-top: 30px; }
            .footer-content { display: flex; justify-content: space-between; }
            .total { font-weight: bold; font-size: 18px; }
            @media print {
              body { padding: 0; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Invoice</h1>
            <p><strong>Invoice No:</strong> ${invoice.id || "N/A"}</p>
          </div>

          <div class="section">
            <h3>Bill To</h3>
            <p><strong>Name:</strong> ${invoice.name || "N/A"}</p>
            <p><strong>Address:</strong> ${invoice.address || "N/A"}</p>
            <p><strong>Contact:</strong> ${invoice.contact || "N/A"}</p>
          </div>

          <div class="section">
            <h3>Payment Details</h3>
            <table>
              <thead>
                <tr>
                  <th>Schedule</th>
                  <th>Description</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                ${
                  Array.isArray(invoice.items)
                    ? invoice.items
                        .map(
                          (item) => `
                  <tr>
                    <td>${item.date || "N/A"}</td>
                    <td>${item.description || "N/A"}</td>
                    <td>₹${item.amount || "0"}</td>
                  </tr>
                `
                        )
                        .join("")
                    : '<tr><td colspan="3">No items available</td></tr>'
                }
              </tbody>
            </table>
          </div>

          <div class="footer">
            <div class="footer-content">
              <div>
                <p><strong>Payment Method:</strong> ${
                  invoice.paymentMethod || "N/A"
                }</p>
                <p><strong>Bank Details:</strong> ${
                  invoice.bankDetails || "N/A"
                }</p>
              </div>
              <div>
                <p><strong>Discount:</strong> ${invoice.discount || "0"}%</p>
                <p class="total">Total: ₹${invoice.total || "0"}</p>
              </div>
            </div>
          </div>


          
        </body>
      </html>
    `;

    const options = {
      html: htmlContent,
      fileName: `Invoice-${invoice.id || Date.now()}`,
      directory: "Documents",
      base64: false,
    };

    const file = await RNHTMLtoPDF.convert(options);

    if (file && file.filePath) {
      showMessage("Invoice downloaded successfully!");
      return file.filePath;
    } else {
      throw new Error("PDF generation failed");
    }
  } catch (error) {
    showToast({
      type: "error",
      title: "Download PDF error",
      desc: error.message,
    });
    return null;
  }
};
