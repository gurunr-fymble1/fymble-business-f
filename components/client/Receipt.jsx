import { Feather } from "@expo/vector-icons";
import React, { useRef } from "react";
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
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { textSplitterAndCapitalizer } from "../../utils/textSplitterAndCapitalizer";
import { dateUtils } from "../../utils/date";

const ReceiptModal = ({
  visible,
  onClose,
  invoice,
  onDownload,
  onsubmit,
  RedButtonText,
  gymData,
}) => {
  const receiptRef = useRef();
  const calculateGSTAmounts = () => {
    const amount = invoice.total || 0;
    const gstPercentage = invoice.gstPercentage || 0;
    const discount =
      (((invoice?.items?.[0]?.amount || 0) * invoice.discount) / 100).toFixed(
        2
      ) || 0;
    const baseAmount = amount - discount;

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
      const gstAmount = Math.round(baseAmount * (gstPercentage / 100));
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
      const gstAmount = Math.round((baseAmount * gstPercentage) / 100);
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
      // Create HTML content for the receipt
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Receipt - ${invoice?.name}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
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
              .gym-location, .date-text, .gst-info {
                font-size: 11px;
                color: #666;
                margin-bottom: 2px;
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
                margin: 10px 0;
                text-align: right;
                font-weight: 500;
              }
              .footer-right {
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
              .thanks-text {
                text-align: center;
                font-style: italic;
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #ccc;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${
                gymData?.logo ||
                gymData?.gym_logo ||
                "https://fittbot-uploads.s3.ap-south-2.amazonaws.com/default.png"
              }" class="logo" alt="Gym Logo">
              <div class="header-right">
                <div class="date-text">${new Date().toLocaleDateString()}</div>
                <div class="gym-name">${
                  gymData?.name || gymData?.gym_name || "Fitness Gym"
                }</div>
                <div class="gym-location">${
                  gymData?.location || gymData?.gym_location || "Location"
                }</div>
                <div class="gst-info">GST No: ${
                  gymData?.gst_number || "09AAACH7409R1ZZ"
                }</div>
              </div>
            </div>

            <div class="bank-customer-section">
              
              <div class="customer-details">
                <div class="section-title">Paid By</div>
                <div class="text">Name: ${invoice?.name || ""}</div>
                <div class="text">Contact: ${invoice?.contact || ""}</div>
                <div class="text">Payment Method: ${
                  invoice.paymentMethod || gymData?.payment_method || ""
                }</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Payment Details</div>
              <div class="table-header">
                <div class="table-cell date">Date</div>
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
                  </div>
                  <div class="table-cell amount">₹${item.amount}</div>
                </div>
              `
                  )
                  .join("") || ""
              }

              ${
                invoice?.admissionFee && parseFloat(invoice.admissionFee) > 0
                  ? `
                <div class="table-row">
                  <div class="table-cell date">${
                    invoice?.items?.[0]?.date || new Date().toLocaleDateString()
                  }</div>
                  <div class="table-cell description">
                    Admission Fee
                    <div class="hsn-text">HSN: 998213</div>
                  </div>
                  <div class="table-cell amount">₹${parseFloat(
                    invoice.admissionFee
                  ).toFixed(2)}</div>
                </div>
              `
                  : ""
              }
            </div>

            ${
              invoice.discount > 0
                ? `
              <div class="discount-text">
                Discount (${invoice.discount.toFixed(2)}%): -₹${(
                    ((invoice?.items?.[0]?.amount || 0) * invoice.discount) /
                    100
                  ).toFixed(2)}
              </div>
            `
                : ""
            }

            ${
              invoice.paymentReferenceNumber
                ? `
              <div class="section">
                <div class="text">Reference No: ${invoice.paymentReferenceNumber}</div>
              </div>
            `
                : ""
            }

            <div class="footer-right">
              <div class="text">Subtotal: ₹${gstAmounts.subtotal.toFixed(
                2
              )}</div>

              ${
                invoice.gstType !== "no_gst" && invoice.gstPercentage > 0
                  ? `
                <div class="text">CGST (${(invoice.gstPercentage / 2).toFixed(
                  1
                )}%): ₹${gstAmounts.cgst.toFixed(2)}</div>
                <div class="text">SGST (${(invoice.gstPercentage / 2).toFixed(
                  1
                )}%): ₹${gstAmounts.sgst.toFixed(2)}</div>
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

              <div class="total">Total: ₹${gstAmounts.total.toFixed(2)}</div>
            </div>

            <div class="thanks-text">
              Thanks for being part of our gym community.
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const Print = await import("expo-print");
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      // Check if sharing is available and share directly (no need to move file in SDK 54)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Share Receipt",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error("Error generating/sharing PDF:", error);
      Alert.alert(
        "Error",
        "Failed to generate or share the receipt. Please try again."
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
                  uri: gymData?.logo || gymData?.gym_logo || null,
                }}
                style={styles.logo}
                defaultSource={require("../../assets/images/gym-logo.webp")}
              />
              <View style={styles.headerRight}>
                <Text style={styles.dateText}>
                  {dateUtils.getCurrentDateFormatted()}
                </Text>
                <Text style={styles.gymName}>
                  {gymData?.name || gymData?.gym_name || "Gym Name"}
                </Text>
                <Text style={styles.gymLocation}>
                  {gymData?.location || gymData?.gym_location || "Location"}
                </Text>
                {/* <Text style={styles.receiptInfo}>Receipt No: {invoice.id}</Text> */}
                <Text style={styles.gstInfo}>
                  GST No: {gymData?.gst_number || "NA"}
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
              <View style={{}}>
                <Text style={styles.sectionTitle}>Paid By</Text>
                <Text style={styles.text}>Name: {invoice?.name}</Text>
                <Text style={styles.text}>Contact: {invoice?.contact}</Text>
                <Text style={styles.text}>
                  Payment Method:{" "}
                  {textSplitterAndCapitalizer(
                    invoice.paymentMethod || gymData?.payment_method
                  )}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Payment Details</Text>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { flex: 2 }]}>Date</Text>
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
                  </View>
                  <Text
                    style={[styles.tableCell, { flex: 2, textAlign: "right" }]}
                  >
                    ₹{item.amount}
                  </Text>
                </View>
              ))}

              {/* Admission Fee Row */}
              {invoice?.admissionFee &&
                parseFloat(invoice.admissionFee) > 0 && (
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>
                      {invoice?.items?.[0]?.date ||
                        new Date().toLocaleDateString()}
                    </Text>
                    <View style={[{ flex: 4 }]}>
                      <Text style={styles.tableCell}>Admission Fee</Text>
                      <Text style={styles.hsnText}>HSN: 998213</Text>
                    </View>
                    <Text
                      style={[
                        styles.tableCell,
                        { flex: 2, textAlign: "right" },
                      ]}
                    >
                      ₹{parseFloat(invoice.admissionFee).toFixed(2)}
                    </Text>
                  </View>
                )}
            </View>

            {invoice.discount > 0 && (
              <Text style={styles.discountText}>
                Discount ({invoice.discount.toFixed(2)}%): -₹
                {(
                  ((invoice?.items?.[0]?.amount || 0) * invoice.discount) /
                  100
                ).toFixed(2)}
              </Text>
            )}

            {invoice.paymentReferenceNumber && (
              <View style={styles.section}>
                <Text style={styles.text}>
                  Reference No: {invoice.paymentReferenceNumber}
                </Text>
              </View>
            )}

            <View style={styles.footerRight}>
              <Text style={styles.text}>
                Subtotal: ₹{gstAmounts.subtotal.toFixed(2)}
              </Text>

              {invoice.gstType !== "no_gst" && invoice.gstPercentage > 0 && (
                <>
                  <Text style={styles.text}>
                    CGST ({(invoice.gstPercentage / 2).toFixed(1)}%): ₹
                    {gstAmounts.cgst.toFixed(2)}
                  </Text>
                  <Text style={styles.text}>
                    SGST ({(invoice.gstPercentage / 2).toFixed(1)}%): ₹
                    {gstAmounts.sgst.toFixed(2)}
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
                Total: ₹{gstAmounts.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.section}>
                <Text style={styles.thanksText}>
                  Thanks for being part of our gym community.
                </Text>
              </View>

              {/* <View style={styles.section}>
                <Text style={styles.CCText}>
                  This invoice has been paid in full.
                </Text>
              </View> */}
            </View>
          </ScrollView>

          <View style={styles.stickyButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>
                {RedButtonText ? "Close" : "Cancel"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={generateAndSharePDF}
              style={styles.shareButton}
            >
              <Feather name="share-2" size={16} color="#fff" />
              <Text style={styles.shareText}>Share</Text>
            </TouchableOpacity>

            {RedButtonText && (
              <TouchableOpacity onPress={onsubmit} style={styles.saveButton}>
                <Text style={styles.saveText}>{RedButtonText}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ReceiptModal;

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
    paddingBottom: 10,
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
    elevation: 2,
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
  receiptInfo: {
    fontSize: 12,
    color: "#333",
    marginBottom: 2,
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
  downloadBtn: {
    flexDirection: "row",
    backgroundColor: "#1D4ED8",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignItems: "center",
    gap: 6,
  },
  downloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
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
    fontSize: 11,
    color: "#333",
    marginBottom: 3,
  },
  discountText: {
    fontSize: 13,
    color: "#28A745",
    marginBottom: 15,
    fontWeight: "500",
    textAlign: "right",
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
    fontSize: 12,
    color: "#333",
    marginBottom: 4,
    textAlign: "center",
    fontStyle: "italic",
  },
  CCText: {
    fontSize: 10,
    color: "#848484",
    marginBottom: 4,
    textAlign: "right",
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
  footer: {
    flexDirection: "column",
    borderTopWidth: 1,
    borderColor: "#ccc",
    paddingTop: 14,
    marginTop: 20,
  },
  footerLeft: {
    flex: 1.5,
  },
  footerRight: {
    alignItems: "flex-end",
    marginBottom: 16,
    paddingHorizontal: 8,
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
    paddingHorizontal: 30,
    backgroundColor: "#6B7280",
    borderRadius: 6,
    marginRight: 8,
  },
  shareButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#10A0F6",
    borderRadius: 6,
    marginHorizontal: 4,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: "#ef4444",
    borderRadius: 6,
    marginLeft: 8,
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
});
