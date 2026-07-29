import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { dateUtils } from "../../utils/date";

const InvoiceModal = ({
  visible,
  onClose,
  invoice,
  onDownload,
  onsubmit,
  RedButtonText = "Send Invoice",
  gymData,
}) => {
  const calculateGSTAmounts = () => {
    const baseAmount = invoice.discountedFees || 0;
    const gstPercentage = invoice.gstPercentage || 18;

    if (invoice.gstType === "no_gst" || !gstPercentage) {
      return {
        subtotal: baseAmount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        total: baseAmount,
      };
    }

    if (invoice.gstType === "inclusive") {
      const gstAmount = (baseAmount * gstPercentage) / (100 + gstPercentage);
      const subtotal = baseAmount - gstAmount;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;

      return {
        subtotal: subtotal,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        total: baseAmount,
      };
    } else {
      const gstAmount = (baseAmount * gstPercentage) / 100;
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      const total = baseAmount + gstAmount;

      return {
        subtotal: baseAmount,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        total: total,
      };
    }
  };

  const gstAmounts = calculateGSTAmounts();

  const generateAndSharePDF = async () => {
    try {
      // Create HTML content for the invoice
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice - ${invoice?.name}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                padding-bottom: 60px;
                background: #fff;
                font-size: 12px;
                line-height: 1.4;
              }
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #ccc;
                padding-bottom: 15px;
              }
              .logo {
                width: 60px;
                height: 60px;
                border-radius: 50px;
              }
              .header-right { text-align: right; }
              .gym-name {
                font-size: 18px;
                font-weight: bold;
                color: #333;
                margin-bottom: 4px;
              }
              .gym-location, .date-text, .invoice-info, .gst-info {
                font-size: 11px;
                color: #666;
                margin-bottom: 2px;
              }
              .invoice-info {
                font-size: 14px;
                font-weight: bold;
                color: #333;
              }
              .section { margin-bottom: 15px; }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 8px;
                color: #222;
              }
              .text { font-size: 10px; color: #333; margin-bottom: 3px; }
              .bank-customer-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
              }
              .bank-details, .customer-details { width: 48%; }
              .customer-details {
                border-left: 1px solid #ccc;
                padding-left: 15px;
              }
              .table-header {
                display: flex;
                background: #f8f9fa;
                padding: 8px;
                border-bottom: 1px solid #ccc;
                font-weight: bold;
              }
              .table-row {
                display: flex;
                padding: 6px 8px;
                border-bottom: 1px solid #eee;
              }
              .table-cell { flex: 1; }
              .table-cell.date { flex: 0 0 20%; }
              .table-cell.description { flex: 0 0 60%; }
              .table-cell.amount { flex: 0 0 20%; text-align: right; }
              .hsn-text { font-size: 9px; color: #666; font-style: italic; margin-top: 2px; }
              .discount-text {
                font-size: 12px;
                color: #28A745;
                margin: 5px 0;
                font-weight: 500;
              }
              .amount-breakdown {
                text-align: right;
                margin: 15px 0;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
              }
              .total {
                font-size: 14px;
                font-weight: bold;
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #ddd;
              }
              .notes-section {
                margin-top: 20px;
                padding: 15px;
                background: #f9f9f9;
                border-radius: 5px;
              }
              .note-text {
                font-size: 11px;
                color: #555;
                margin-bottom: 4px;
                padding-left: 5px;
              }
              .thanks-text {
                text-align: center;
                font-weight: bold;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #ccc;
                font-size: 14px;
              }
              .footer-note {
                text-align: center;
                font-style: italic;
                font-size: 12px;
                color: #666;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${
                invoice.gymLogo ||
                gymData?.logo ||
                "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/default.png"
              }" class="logo" alt="Gym Logo">
              <div class="header-right">
                <div class="date-text">${new Date().toLocaleDateString()}</div>
                <div class="gym-name">${
                  invoice.gymName || gymData?.name || "Fitness Gym"
                }</div>
                <div class="gym-location">${
                  invoice.gymAddress || gymData?.location || "Location"
                }</div>
                <div class="invoice-info">Estimate No: ${
                  invoice.invoice_number || "N/A"
                }</div>
                <div class="gst-info">GST No: ${
                  invoice.gst_number || gymData?.gst_number || "09AAACH7409R1ZZ"
                }</div>
              </div>
            </div>

            <div class="bank-customer-section">
              <div class="bank-details">
                <div class="section-title">Payment Details</div>
                <div class="text">Account Holder: ${
                  gymData?.account_holdername || "Bank Details"
                }</div>
                <div class="text">Bank: ${
                  invoice?.bankDetails || "Bank Details"
                }</div>
                <div class="text">IFSC Code: ${
                  invoice?.IFSC || "Bank Details"
                }</div>
                <div class="text">Branch: ${gymData?.account_branch || ""}</div>
                ${
                  gymData?.upi_id
                    ? `<div class="text">UPI ID: ${gymData.upi_id}</div>`
                    : ""
                }
              </div>
              <div class="customer-details">
                <div class="section-title">Bill To</div>
                <div class="text">Name: ${invoice.name || ""}</div>
                ${
                  invoice.address
                    ? `<div class="text">Address: ${invoice.address}</div>`
                    : ""
                }
                <div class="text">Contact: ${invoice.contact || ""}</div>
                <div class="text">Due Date: ${
                  invoice?.items?.[0]?.date || "TBD"
                }</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Service Details</div>
              <div class="table-header">
                <div class="table-cell date">Due Date</div>
                <div class="table-cell description">Plan Details</div>
                <div class="table-cell amount">Amount</div>
              </div>
              ${
                invoice?.items
                  ?.map(
                    (item) => `
                <div class="table-row">
                  <div class="table-cell date">${item.date}</div>
                  <div class="table-cell description">
                    ${item.description}
                    <div class="hsn-text">HSN: 998213</div>
                    <div class="hsn-text">Fitness & Gym Services</div>
                  </div>
                  <div class="table-cell amount">₹${item.amount}</div>
                </div>
              `
                  )
                  .join("") || ""
              }
            </div>

            ${
              invoice.paymentReferenceNumber
                ? `
              <div class="section">
                <div class="section-title">Payment Reference</div>
                <div class="text">Reference No: ${invoice.paymentReferenceNumber}</div>
              </div>
            `
                : ""
            }

            <div class="amount-breakdown">
              <div class="text">Subtotal: ₹${(
                invoice?.items?.[0]?.amount || 0
              ).toFixed(2)}</div>

              ${
                invoice.discount > 0
                  ? `
                <div class="discount-text">
                  Discount (${(
                    ((invoice.fees - invoice.discountedFees) / invoice.fees) *
                    100
                  ).toFixed(2)}%): -₹${invoice.discount.toFixed(2)}
                </div>
              `
                  : ""
              }

              <div class="text">Amount after discount: ₹${gstAmounts.subtotal.toFixed(
                2
              )}</div>

              ${
                invoice.gstType !== "no_gst" &&
                (invoice.gstPercentage || 18) > 0
                  ? `
                <div class="text">CGST (${(
                  (invoice.gstPercentage || 18) / 2
                ).toFixed(1)}%): ₹${gstAmounts.cgst.toFixed(2)}</div>
                <div class="text">SGST (${(
                  (invoice.gstPercentage || 18) / 2
                ).toFixed(1)}%): ₹${gstAmounts.sgst.toFixed(2)}</div>
                <div class="text" style="font-style: italic;">GST Type: ${
                  invoice.gstType === "inclusive" ? "Inclusive" : "Exclusive"
                }</div>
              `
                  : ""
              }

              ${
                invoice.gstType === "no_gst"
                  ? '<div class="text" style="font-style: italic;">No GST Applied</div>'
                  : ""
              }

              <div class="total">Total Amount: ₹${(
                invoice.total || gstAmounts.total
              ).toFixed(2)}</div>
            </div>

            <div class="notes-section">
              <div class="section-title">Important Notes</div>
              <div class="note-text">• This is an estimate/invoice for gym membership services</div>
              <div class="note-text">• Payment is due by the date mentioned above</div>
              <div class="note-text">• Please make payment to the bank details provided</div>
              <div class="note-text">• Contact us for any queries regarding this invoice</div>
            </div>

            <div class="thanks-text">
              Thank you for choosing our fitness services!
            </div>
            <div class="footer-note">
              We look forward to helping you achieve your fitness goals.
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Check if sharing is available and share directly (no need to move file in SDK 54)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Invoice",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error generating/sharing PDF:", error);
      Alert.alert(
        "Error",
        "Failed to generate or share the invoice. Please try again."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            style={styles.scrollView}
          >
            <View style={styles.header}>
              <Image
                source={{
                  uri:
                    invoice.gymLogo ||
                    gymData?.logo ||
                    "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/default.png",
                }}
                style={styles.logo}
                defaultSource={require("../../assets/images/gym-logo.webp")}
              />
              <View style={styles.headerRight}>
                <Text style={styles.dateText}>
                  {dateUtils.getCurrentDateFormatted()}
                </Text>
                <Text style={styles.gymName}>
                  {invoice.gymName || gymData?.name || "Fitness Gym"}
                </Text>
                <Text style={styles.gymLocation}>
                  {invoice.gymAddress || gymData?.location || "Location"}
                </Text>
                <Text style={styles.invoiceInfo}>
                  Estimate No: {invoice.invoice_number}
                </Text>
                <Text style={styles.gstInfo}>
                  GST No:{" "}
                  {invoice.gst_number ||
                    gymData?.gst_number ||
                    "09AAACH7409R1ZZ"}
                </Text>
              </View>
            </View>

            <View style={styles.sectionDivider} />

            <View
              style={[
                styles.section,
                { flexDirection: "row", justifyContent: "space-between" },
              ]}
            >
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Details</Text>
                <Text style={styles.text}>
                  Account Holder Name:{" "}
                  {gymData?.account_holdername || "Bank Details"}
                </Text>
                <Text style={styles.text}>
                  Bank: {invoice?.bankDetails || "Bank Details"}
                </Text>
                <Text style={styles.text}>
                  IFSC code: {invoice?.IFSC || "Bank Details"}
                </Text>
                <Text style={styles.text}>
                  Branch: {gymData?.account_branch}
                </Text>
                {gymData?.upi_id && (
                  <Text style={styles.text}>UPI ID: {gymData.upi_id}</Text>
                )}
              </View>

              <View
                style={{
                  marginLeft: 10,
                  paddingLeft: 10,
                  borderLeftWidth: 1,
                  borderLeftColor: "#ccc",
                }}
              >
                <Text style={styles.sectionTitle}>Bill To</Text>
                <Text style={styles.text}>Name: {invoice.name}</Text>
                {invoice.address && (
                  <Text style={styles.text}>Address: {invoice.address}</Text>
                )}
                <Text style={styles.text}>Contact: {invoice.contact}</Text>
                <Text style={styles.text}>
                  Due Date: {invoice?.items?.[0]?.date || "TBD"}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Service Details</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Due Date</Text>
                <Text style={[styles.tableCell, { flex: 4 }]}>
                  Plan Details
                </Text>
                <Text
                  style={[styles.tableCell, { flex: 2, textAlign: "right" }]}
                >
                  Amount
                </Text>
              </View>
              {invoice?.items?.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {item.date}
                  </Text>
                  <View style={[{ flex: 4 }]}>
                    <Text style={styles.tableCell}>{item.description}</Text>
                    <Text style={styles.hsnText}>HSN: 998213</Text>
                    <Text style={styles.hsnText}>Fitness & Gym Services</Text>
                  </View>
                  <Text
                    style={[styles.tableCell, { flex: 2, textAlign: "right" }]}
                  >
                    ₹{item.amount}
                  </Text>
                </View>
              ))}
            </View>

            {invoice.paymentReferenceNumber && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Reference</Text>
                <Text style={styles.text}>
                  Reference No: {invoice.paymentReferenceNumber}
                </Text>
              </View>
            )}

            <View style={styles.amountBreakdown}>
              <Text style={styles.text}>
                Subtotal: ₹{(invoice?.items?.[0]?.amount || 0).toFixed(2)}
              </Text>

              {invoice.discount > 0 && (
                <Text style={styles.discountText}>
                  Discount (
                  {(
                    ((invoice.fees - invoice.discountedFees) / invoice.fees) *
                    100
                  ).toFixed(2)}
                  %): -₹{invoice.discount.toFixed(2)}
                </Text>
              )}

              <Text style={styles.text}>
                Amount after discount: ₹{gstAmounts.subtotal.toFixed(2)}
              </Text>

              {invoice.gstType !== "no_gst" &&
                (invoice.gstPercentage || 18) > 0 && (
                  <>
                    <Text style={styles.text}>
                      CGST ({((invoice.gstPercentage || 18) / 2).toFixed(1)}%):
                      ₹{gstAmounts.cgst.toFixed(2)}
                    </Text>
                    <Text style={styles.text}>
                      SGST ({((invoice.gstPercentage || 18) / 2).toFixed(1)}%):
                      ₹{gstAmounts.sgst.toFixed(2)}
                    </Text>
                    <Text style={styles.gstTypeInfo}>
                      GST Type:{" "}
                      {invoice.gstType === "inclusive"
                        ? "Inclusive"
                        : "Exclusive"}
                    </Text>
                  </>
                )}

              {invoice.gstType === "no_gst" && (
                <Text style={styles.noGstText}>No GST Applied</Text>
              )}

              <Text style={styles.total}>
                Total Amount: ₹{(invoice.total || gstAmounts.total).toFixed(2)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Important Notes</Text>
              <Text style={styles.noteText}>
                • This is an estimate/invoice for gym membership services
              </Text>
              <Text style={styles.noteText}>
                • Payment is due by the date mentioned above
              </Text>
              <Text style={styles.noteText}>
                • Please make payment to the bank details provided
              </Text>
              <Text style={styles.noteText}>
                • Contact us for any queries regarding this invoice
              </Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.section}>
                <Text style={styles.thanksText}>
                  Thank you for choosing our fitness services!
                </Text>
                <Text style={styles.footerNote}>
                  We look forward to helping you achieve your fitness goals.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.stickyButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={generateAndSharePDF}
              style={styles.shareButton}
            >
              <Feather name="share-2" size={16} color="#fff" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>

            {onsubmit && (
              <TouchableOpacity onPress={onsubmit} style={styles.saveButton}>
                <Text style={styles.saveText}>{RedButtonText}</Text>
              </TouchableOpacity>
            )}
            {onDownload && (
              <TouchableOpacity
                onPress={onDownload}
                style={styles.downloadButton}
              >
                <Feather name="download" size={16} color="#fff" />
                <Text style={styles.downloadText}>Download</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default InvoiceModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 10,
    shadowColor: "#000",
    maxHeight: "90%",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    width: 80,
    height: 80,
    resizeMode: "contain",
    borderRadius: 50,
    borderWidth: 1,
    borderColor: "#aaa",
  },
  headerRight: {
    alignItems: "flex-end",
    flex: 1,
    marginLeft: 16,
  },
  dateText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  gymName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
    color: "#333",
  },
  gymLocation: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  invoiceInfo: {
    fontSize: 14,
    color: "#333",
    marginBottom: 2,
    fontWeight: "600",
  },
  gstInfo: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
  },
  hsnText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
    fontStyle: "italic",
  },
  sectionDivider: {
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
    marginVertical: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#222",
  },
  text: {
    fontSize: 10,
    color: "#333",
    marginBottom: 3,
  },
  discountText: {
    fontSize: 13,
    color: "#28A745",
    marginBottom: 3,
    fontWeight: "500",
  },
  gstTypeInfo: {
    fontSize: 12,
    color: "#666",
    marginBottom: 3,
    fontStyle: "italic",
  },
  noGstText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 3,
    fontStyle: "italic",
  },
  thanksText: {
    fontSize: 14,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  noteText: {
    fontSize: 12,
    color: "#555",
    marginBottom: 4,
    paddingLeft: 5,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingBottom: 6,
    marginBottom: 6,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tableRow: {
    flexDirection: "row",
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tableCell: {
    fontSize: 12,
    color: "#444",
  },
  amountBreakdown: {
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 8,
    backgroundColor: "#f8f9fa",
    paddingVertical: 12,
    borderRadius: 6,
  },
  footer: {
    flexDirection: "column",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 14,
    marginTop: 20,
  },
  total: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  stickyButtonContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#6B7280",
    borderRadius: 6,
    marginRight: 6,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#FF9500",
    borderRadius: 6,
    marginHorizontal: 3,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#10A0F6",
    borderRadius: 6,
    marginHorizontal: 3,
  },
  downloadButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#059669",
    borderRadius: 6,
    marginLeft: 6,
  },
  cancelText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  shareText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
    marginLeft: 6,
  },
  saveText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    textAlign: "center",
  },
  downloadText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    marginLeft: 4,
  },
});
