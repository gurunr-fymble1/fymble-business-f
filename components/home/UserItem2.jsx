import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Linking,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { dateUtils } from "../../utils/date";

const UserItem2 = ({
  item,
  index,
  setParticularInvoiceData,
  SetShowInvoice,
  showInvoice,
  handleOpenAboutToExpireModal,
  handleUpdateDiscount,
  toggleItemSelection,
  emailSent,
  title,
  isSelected,
  role,
  showFeeTypeTag = true,
}) => {
  const [editableDiscount, setEditableDiscount] = useState("");
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [isEditingDiscount, setIsEditingDiscount] = useState(false);

  const dueDate = new Date(item?.due_date);
  const today = new Date();
  const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

  const getDueDateColor = () => {
    if (daysUntilDue < 0) return "#FF3B30";
    if (daysUntilDue <= 3) return "#FF9500";
    return "#34C759";
  };

  const getDueDateBackground = () => {
    if (daysUntilDue < 0) return "#FFE5E5";
    if (daysUntilDue <= 3) return "#FFF5E5";
    return "#E5F9ED";
  };

  const getDueDateText = () => {
    if (daysUntilDue < 0) return "Overdue";
    if (daysUntilDue === 0) return "Today";
    if (daysUntilDue <= 3) return `${daysUntilDue} days left`;
    return "Upcoming";
  };

  const getFeeTypeStyles = () => {
    const feeType = item.fees_type?.toLowerCase();
    if (feeType === "admission") {
      return {
        backgroundColor: "#FF9500",
        color: "#FFFFFF",
        text: "Admission Fee",
      };
    } else if (feeType === "gym_membership") {
      return {
        backgroundColor: "#34C759",
        color: "#FFFFFF",
        text: "Gym Membership",
      };
    } else if (feeType === "personal_training") {
      return {
        backgroundColor: "#34C759",
        color: "#FFFFFF",
        text: "Personal Training",
      };
    } else if (feeType === "renewal") {
      return {
        backgroundColor: "#34C759",
        color: "#FFFFFF",
        text: "Fee Renewal",
      };
    } else if (feeType === "normal") {
      return {
        backgroundColor: "#34C759",
        color: "#FFFFFF",
        text: "Offline",
      };
    }
    return {
      backgroundColor: "#787878d5",
      color: "#FFFFFF",
    };
  };

  const backgroundColor = index % 2 === 0 ? "#f9fafc" : "#ffffff";

  const currentDiscount =
    item.discount !== undefined && item.discount !== null
      ? String(item.discount)
      : "0";

  const handleCall = () => {
    Linking.openURL(`tel:${"+91"}${item.client_contact}`);
  };

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor },
        item.mail_send && styles.emailSentCard,
      ]}
    >
      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => toggleItemSelection(item)}
        disabled={item.mail_send}
      >
        <View
          style={[
            styles.checkbox,
            isSelected && styles.checkboxSelected,
            (item.mail_send || item.mail_status) && styles.checkboxDisabled,
          ]}
        >
          {isSelected && <Icon name="check" size={16} color="#fff" />}
          {(item.mail_send || item.mail_status) && (
            <Icon name="mail" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>

      <View style={styles.infoSection}>
        <View
          style={[
            styles.userName,
            { alignItems: "center", flexDirection: "row" },
          ]}
        >
          <Text>{item?.client_name}</Text>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Icon name="phone" size={12} color="#fff" />
          </TouchableOpacity>
          {showFeeTypeTag && item.fees_type && (
            <View
              style={[
                styles.feeBadge,
                {
                  backgroundColor: getFeeTypeStyles().backgroundColor,
                  marginLeft: 10,
                },
              ]}
            >
              <Text
                style={[styles.feeText, { color: getFeeTypeStyles().color }]}
              >
                {/* {item.fees_type.charAt(0).toUpperCase() +
                  item.fees_type.slice(1)} */}
                {getFeeTypeStyles().text || ""}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.feeBadge, { backgroundColor: "#787878d5" }]}>
            <Text style={[styles.feeText, { color: "#ffffff" }]}>
              ₹{item.total_amount || item.fees}
            </Text>
          </View>

          {title !== "Estimate" && (
            <View
              style={[
                styles.dueDateBadge,
                { backgroundColor: getDueDateBackground() },
              ]}
            >
              <Icon name="calendar" size={14} color={getDueDateColor()} />
              <Text style={[styles.dueDateText, { color: getDueDateColor() }]}>
                {title === "Receipt"
                  ? dateUtils.formatToDateOnly(item.payment_date)
                  : getDueDateText()}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowActionsModal(true)}
      >
        <Icon name="more-vertical" size={20} color="#6c757d" />
      </TouchableOpacity>

      <Modal
        transparent={true}
        visible={showActionsModal}
        animationType="fade"
        onRequestClose={() => setShowActionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionsModal(false)}
        >
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Options for {item?.client_name}
            </Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setParticularInvoiceData(item);
                SetShowInvoice(!showInvoice);
                handleOpenAboutToExpireModal();
                setShowActionsModal(false);
              }}
            >
              <Icon name="file-text" size={20} color="#10A0F6" />
              <Text style={styles.modalOptionText}>View Invoice/Estimate</Text>
            </TouchableOpacity>

            {title !== "Receipt" && role !== "trainer" && (
              <TouchableOpacity
                style={styles.modalOption}
                onPress={() => {
                  setIsEditingDiscount(true);
                  setEditableDiscount(currentDiscount);
                  setShowActionsModal(false);
                }}
              >
                <Icon name="percent" size={20} color="#10A0F6" />
                <Text style={styles.modalOptionText}>
                  Send Discounted Estimate
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.modalOption} onPress={handleCall}>
              <Icon name="phone" size={20} color="#10A0F6" />
              <Text style={styles.modalOptionText}>
                Call {item.client_contact}
              </Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <View style={styles.detailsSection}>
              <Text style={styles.detailsTitle}>Plan Details</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fee:</Text>
                <Text style={styles.detailValue}>₹{item.fees}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>{item.plan_description}</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Discount:</Text>
                <Text style={styles.detailValue}>{currentDiscount}%</Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>
                  {dateUtils.formatToDateOnly(item?.due_date)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Contact:</Text>
                <Text style={styles.detailValue}>{item.client_contact}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowActionsModal(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        transparent={true}
        visible={isEditingDiscount}
        animationType="fade"
        onRequestClose={() => setIsEditingDiscount(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsEditingDiscount(false)}
        >
          <View style={styles.discountModalContainer}>
            <Text style={styles.modalTitle}>Send Discounted Estimate</Text>
            <Text style={styles.modalSubtitle}>Enter final discounted fee</Text>

            <View style={styles.discountInputContainer}>
              <TextInput
                style={styles.discountInputField}
                keyboardType="numeric"
                value={editableDiscount}
                onChangeText={(text) => setEditableDiscount(text)}
                placeholder="Enter final amount"
                autoFocus={true}
              />
            </View>

            <View style={styles.discountButtonsRow}>
              <TouchableOpacity
                style={[styles.discountButton, styles.cancelButton]}
                onPress={() => setIsEditingDiscount(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.discountButton, styles.saveButton]}
                onPress={() => {
                  // Set the discounted_fees to the entered discount value
                  const updatedItem = {
                    ...item,
                    discounted_fees: parseFloat(editableDiscount) || item.fees,
                    discount:
                      item.fees - (parseFloat(editableDiscount) || item.fees),
                  };
                  setParticularInvoiceData(updatedItem);
                  setIsEditingDiscount(false);
                  SetShowInvoice(true);
                  handleOpenAboutToExpireModal();
                }}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#eaeef2",
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#ced4da",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: "#10A0F6",
    borderColor: "#10A0F6",
  },
  infoSection: {
    flex: 1,
    justifyContent: "center",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2d3748",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  feeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E5F9ED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  feeText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#27a308",
    marginLeft: 4,
  },
  dueDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dueDateText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10A0F6",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginLeft: 8,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#fff",
    marginLeft: 6,
  },
  menuButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    color: "#2d3748",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 15,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  modalOptionText: {
    fontSize: 16,
    marginLeft: 15,
    color: "#2d3748",
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 14,
  },
  detailsSection: {
    marginBottom: 15,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#2d3748",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748b",
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: "#2d3748",
    flex: 1,
  },
  closeButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2d3748",
  },
  discountModalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  discountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    borderWidth: 1,
    borderColor: "#ced4da",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  discountInputField: {
    flex: 1,
    fontSize: 16,
    padding: 10,
  },
  percentSign: {
    fontSize: 16,
    color: "#6c757d",
    marginLeft: 5,
  },
  discountButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  discountButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#4a5568",
  },
  saveButton: {
    backgroundColor: "#10A0F6",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
  },
  emailSentCard: {
    borderLeftWidth: 3,
    borderLeftColor: "#10A0F6",
    opacity: 0.85,
  },
  emailSentBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  emailSentText: {
    color: "#10A0F6",
    fontSize: 12,
    fontWeight: "500",
  },
  checkboxDisabled: {
    backgroundColor: "#10A0F6",
    borderColor: "#10A0F6",
    opacity: 0.7,
  },
});

export default UserItem2;
