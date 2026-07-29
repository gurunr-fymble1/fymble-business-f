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
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";
import { dateUtils } from "../../utils/date";

const EstimateModal = ({
  visible,
  onClose,
  estimate,
  onDownload,
  onsubmit,
  RedButtonText,
  gymData,
}) => {
  const receiptRef = useRef();

  // Use correct calculations based on NewEnquiryForm logic
  const calculateCorrectAmounts = () => {
    const baseFees = parseFloat(estimate.fees) || 0;
    const admissionFees = parseFloat(estimate.admissionFee) || 0;
    const discount = parseFloat(estimate.discount) || 0;
    const gstPercentage = parseFloat(estimate.gstPercentage) || 0;
    const gstType = estimate.gstType || "no_gst";

    // Calculate discount amount (already calculated correctly in the form)
    const discountAmount = discount;
    
    // Calculate discounted fee
    const discountedFees = Math.max(0, baseFees - discountAmount);
    
    // Calculate base amount (fees + admission after discount)
    const baseAmount = discountedFees + admissionFees;
    
    if (gstType === "no_gst" || !gstPercentage) {
      return {
        subtotal: baseAmount,
        cgst: 0,
        sgst: 0,
        igst: 0,
        gstAmount: 0,
        total: baseAmount,
        discountedFees: discountedFees,
        baseAmount: baseAmount
      };
    }

    const gstAmount = (baseAmount * gstPercentage) / 100;
    const cgst = gstAmount / 2;
    const sgst = gstAmount / 2;

    if (gstType === "inclusive") {
      // For inclusive GST, the total is the base amount, GST is included
      const subtotalWithoutGst = baseAmount - gstAmount;
      return {
        subtotal: subtotalWithoutGst,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        gstAmount: gstAmount,
        total: baseAmount,
        discountedFees: discountedFees,
        baseAmount: baseAmount
      };
    } else {
      // For exclusive GST, GST is added on top
      return {
        subtotal: baseAmount,
        cgst: cgst,
        sgst: sgst,
        igst: 0,
        gstAmount: gstAmount,
        total: baseAmount + gstAmount,
        discountedFees: discountedFees,
        baseAmount: baseAmount
      };
    }
  };

  const amounts = calculateCorrectAmounts();

  const generateAndSharePDF = async () => {
    try {
      // Create HTML content for the estimate
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Estimate - ${estimate?.name}</title>
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
              .estimate-title {
                color: #007AFF;
                font-size: 16px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <img src="${gymData?.logo || gymData?.gym_logo || 'https://fittbot-uploads.s3.ap-south-2.amazonaws.com/default.png'}" class="logo" alt="Gym Logo">
              <div class="header-right">
                <div class="date-text">${new Date().toLocaleDateString()}</div>
                <div class="gym-name">${gymData?.name || gymData?.gym_name || 'Fitness Gym'}</div>
                <div class="gym-location">${gymData?.location || gymData?.gym_location || 'Location'}</div>
                <div class="gst-info">GST No: ${gymData?.gst_number || '09AAACH7409R1ZZ'}</div>
              </div>
            </div>

            <div class="bank-customer-section">
              ${gymData ? `
                <div class="bank-details">
                  <div class="section-title">Bank Details</div>
                  <div class="text">Account Holder: ${gymData.account_holdername || estimate?.account_holder_name || ''}</div>
                  <div class="text">Account No: ${gymData.account_number || estimate?.bankDetails || ''}</div>
                  <div class="text">IFSC Code: ${gymData.account_ifsccode || estimate?.IFSC || ''}</div>
                  <div class="text">Branch: ${gymData.account_branch || estimate?.branch || ''}</div>
                  ${gymData.upi_id ? `<div class="text">UPI ID: ${gymData.upi_id}</div>` : ''}
                </div>
              ` : ''}
              <div class="customer-details">
                <div class="section-title">Estimate For</div>
                <div class="text">Name: ${estimate?.name || ''}</div>
                <div class="text">Contact: ${estimate?.contact || ''}</div>
                <div class="text">Email: ${estimate?.email || ''}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Plan Details</div>
              <div class="table-header">
                <div class="table-cell date">Date</div>
                <div class="table-cell description">Plan Details</div>
                <div class="table-cell amount">Amount</div>
              </div>
              ${estimate?.items?.map(item => `
                <div class="table-row">
                  <div class="table-cell date">${item.date}</div>
                  <div class="table-cell description">
                    ${item.description}
                    <div class="hsn-text">HSN: 998213</div>
                  </div>
                  <div class="table-cell amount">₹${parseFloat(item.amount).toFixed(2)}</div>
                </div>
              `).join('') || ''}
              
              ${estimate?.admissionFee && parseFloat(estimate.admissionFee) > 0 ? `
                <div class="table-row">
                  <div class="table-cell date">${estimate?.items?.[0]?.date || new Date().toLocaleDateString()}</div>
                  <div class="table-cell description">
                    Admission Fee
                    <div class="hsn-text">HSN: 998213</div>
                  </div>
                  <div class="table-cell amount">₹${parseFloat(estimate.admissionFee).toFixed(2)}</div>
                </div>
              ` : ''}
            </div>

            ${estimate.discount > 0 ? `
              <div class="discount-text">
                Discount: -₹${parseFloat(estimate.discount).toFixed(2)}
              </div>
            ` : ''}

            <div class="footer-right">
              <div class="text">Base Fees: ₹${parseFloat(estimate.fees).toFixed(2)}</div>
              ${estimate.admissionFee && parseFloat(estimate.admissionFee) > 0 ? `
                <div class="text">Admission Fees: ₹${parseFloat(estimate.admissionFee).toFixed(2)}</div>
              ` : ''}
              ${estimate.discount > 0 ? `
                <div class="text">After Discount: ₹${amounts.baseAmount.toFixed(2)}</div>
              ` : ''}
              
              ${estimate.gstType !== "no_gst" && estimate.gstPercentage > 0 ? `
                ${estimate.gstType === "inclusive" ? `
                  <div class="text">Subtotal (excl. GST): ₹${amounts.subtotal.toFixed(2)}</div>
                ` : `
                  <div class="text">Subtotal: ₹${amounts.subtotal.toFixed(2)}</div>
                `}
                <div class="text">CGST (${(estimate.gstPercentage / 2).toFixed(1)}%): ₹${amounts.cgst.toFixed(2)}</div>
                <div class="text">SGST (${(estimate.gstPercentage / 2).toFixed(1)}%): ₹${amounts.sgst.toFixed(2)}</div>
                <div class="text" style="font-style: italic;">GST Type: ${estimate.gstType === "inclusive" ? "Inclusive" : "Exclusive"}</div>
              ` : ''}
              
              ${estimate.gstType === "no_gst" ? '<div class="text" style="font-style: italic;">No GST Applied</div>' : ''}
              
              <div class="total">Total Estimated Amount: ₹${amounts.total.toFixed(2)}</div>
            </div>

            <div class="thanks-text">
              This is an estimate. Actual charges may vary.
            </div>
          </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      // Check if sharing is available and share directly (no need to move file in SDK 54)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Estimate',
          UTI: 'com.adobe.pdf'
        });
      } else {
        Alert.alert('Error', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error generating/sharing PDF:', error);
      Alert.alert('Error', 'Failed to generate or share the estimate. Please try again.');
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
                    gymData?.logo ||
                    gymData?.gym_logo ||
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
                  {gymData?.name || gymData?.gym_name || "Fitness Gym"}
                </Text>
                <Text style={styles.gymLocation}>
                  {gymData?.location || gymData?.gym_location || "Location"}
                </Text>
                <Text style={styles.gstInfo}>
                  GST No: {gymData?.gst_number || "09AAACH7409R1ZZ"}
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
              {gymData && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Bank Details</Text>
                  <Text style={styles.text}>
                    Account Holder:{" "}
                    {gymData.account_holdername || estimate?.account_holder_name}
                  </Text>
                  <Text style={styles.text}>
                    Account No: {gymData.account_number || estimate?.bankDetails}
                  </Text>
                  <Text style={styles.text}>
                    IFSC Code: {gymData.account_ifsccode || estimate?.IFSC}
                  </Text>
                  <Text style={styles.text}>
                    Branch: {gymData.account_branch || estimate?.branch}
                  </Text>
                  {gymData.upi_id && (
                    <Text style={styles.text}>UPI ID: {gymData.upi_id}</Text>
                  )}
                </View>
              )}
              <View
                style={{
                  marginLeft: 10,
                  paddingLeft: 10,
                  borderLeftWidth: 1,
                  borderLeftColor: "#ccc",
                }}
              >
                <Text style={styles.sectionTitle}>Estimate For</Text>
                <Text style={styles.text}>Name: {estimate?.name}</Text>
                <Text style={styles.text}>Contact: {estimate?.contact}</Text>
                <Text style={styles.text}>Email: {estimate?.email}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Plan Details</Text>
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
              {estimate?.items?.map((item, index) => (
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
                    ₹{parseFloat(item.amount).toFixed(2)}
                  </Text>
                </View>
              ))}
              
              {/* Admission Fee Row */}
              {estimate?.admissionFee && parseFloat(estimate.admissionFee) > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, { flex: 2 }]}>
                    {estimate?.items?.[0]?.date || new Date().toLocaleDateString()}
                  </Text>
                  <View style={[{ flex: 4 }]}>
                    <Text style={styles.tableCell}>Admission Fee</Text>
                    <Text style={styles.hsnText}>HSN: 998213</Text>
                  </View>
                  <Text
                    style={[styles.tableCell, { flex: 2, textAlign: "right" }]}
                  >
                    ₹{parseFloat(estimate.admissionFee).toFixed(2)}
                  </Text>
                </View>
              )}
            </View>

            {estimate.discount > 0 && (
              <Text style={styles.discountText}>
                Discount: -₹{parseFloat(estimate.discount).toFixed(2)}
              </Text>
            )}

            <View style={styles.footerRight}>
              <Text style={styles.text}>
                Base Fees: ₹{parseFloat(estimate.fees).toFixed(2)}
              </Text>

              {estimate.admissionFee && parseFloat(estimate.admissionFee) > 0 && (
                <Text style={styles.text}>
                  Admission Fees: ₹{parseFloat(estimate.admissionFee).toFixed(2)}
                </Text>
              )}

              {estimate.discount > 0 && (
                <Text style={styles.text}>
                  After Discount: ₹{amounts.baseAmount.toFixed(2)}
                </Text>
              )}

              {estimate.gstType !== "no_gst" && estimate.gstPercentage > 0 && (
                <>
                  {estimate.gstType === "inclusive" ? (
                    <Text style={styles.text}>
                      Subtotal (excl. GST): ₹{amounts.subtotal.toFixed(2)}
                    </Text>
                  ) : (
                    <Text style={styles.text}>
                      Subtotal: ₹{amounts.subtotal.toFixed(2)}
                    </Text>
                  )}
                  <Text style={styles.text}>
                    CGST ({(estimate.gstPercentage / 2).toFixed(1)}%): ₹
                    {amounts.cgst.toFixed(2)}
                  </Text>
                  <Text style={styles.text}>
                    SGST ({(estimate.gstPercentage / 2).toFixed(1)}%): ₹
                    {amounts.sgst.toFixed(2)}
                  </Text>
                  <Text style={styles.gstTypeInfo}>
                    GST Type:{" "}
                    {estimate.gstType === "inclusive"
                      ? "Inclusive"
                      : "Exclusive"}
                  </Text>
                </>
              )}

              {estimate.gstType === "no_gst" && (
                <Text style={styles.noGstText}>No GST Applied</Text>
              )}

              <Text style={styles.total}>
                Total Estimated Amount: ₹{amounts.total.toFixed(2)}
              </Text>
            </View>

            <View style={styles.footer}>
              <View style={styles.section}>
                <Text style={styles.thanksText}>
                  This is an estimate. Actual charges may vary.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.stickyButtonContainer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>
                {RedButtonText ? "Close" : "Cancel"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={generateAndSharePDF} style={styles.shareButton}>
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

export default EstimateModal;

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
  estimateHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  estimateTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
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
    color: "#007AFF",
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