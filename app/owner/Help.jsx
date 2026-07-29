import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  StatusBar,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supportAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import { TouchableWithoutFeedback } from "react-native-web";
import HardwareBackHandler from "../../components/HardwareBackHandler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";

const HelpSupportScreen = () => {
  const [selectedTab, setSelectedTab] = useState("Add Client");
  const router = useRouter();
  const [expandedItem, setExpandedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [token, setToken] = useState(null);
  const [ticketData, setTicketData] = useState({
    issueType: "",
    customSubject: "",
    email: "",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const insets = useSafeAreaInsets();
  // Updated issue types for gym admin software
  const commonIssues = [
    "Select an issue type",
    "Technical Support",
    "Adding Client",
    "Payment & Billing",
    "Daily Pass & Fitness Classes",
    "Feature Request",
    "Data Import/Export",
    "Other",
  ];

  const faqData = {
    "Add Client": [
      {
        id: 1,
        question: "How do I Add a New Client to my Gym?",
        answer:
          "Navigate to the Add Clients from Quick Links and Scan the QR of Client from Fymble App(both Online and Offline Clients) or Accept the Join Request given by the Client from the Fymble App's Gym Studios Page(Offline Clients Only).You will get two options 1) Quick Add 2) Full Details.Using any of this You can add the client to your Gym",
      },
      {
        id: 105,
        question:
          "Can I export the client's data from another software and import to Fymble Business?",
        answer:
          "Yes, Click the Clients Bottom Tab and Select Gym Clients.At the top You will see the Import Button.You can upload Excel in required format as Mentioned( Download Sample Template) or You can import Manually by entering the details.But after Import, adding clients through scan or request only can make you track their Fee, Workout etc",
      },
      {
        id: 2,
        question:
          "What's the Difference between Quick Add and Full Details in Client Addition?",
        answer:
          "Using Quick add , you can add the client within 5 seconds with just Plan Duration and Amount Paid.Using Full Details, adding client becomes more flexible with Discount, GST Info, Batch Assignment and other details",
      },
      {
        id: 3,
        question: "Can I edit the Joining Date and Expiry Date?",
        answer:
          "Yes, You Can Edit the Joining Date and Expiry Date anytime by clicking the client info from Gym Clients Page (Clients Bottom Tab --> Gym Clients --> Click the Required Client --> Update the Joining and Expiry Dates)",
      },
      {
        id: 4,
        question: "How to Enter/Update the Fee Renewal of my Client?",
        answer:
          "It is the same as Client Adding. Navigate to the Add Clients from Quick Links and Scan the QR of Client from Fymble App(both Online and Offline Clients) or Accept the Join Request given by the Client from the Fymble App's Gym Studios Page(Offline Clients Only).You will get two options 1) Quick Add 2) Full Details.Using any of this You can add the client to your Gym",
      },
      {
        id: 5,
        question: "How to send the Fee receipt to my Client?",
        answer:
          "Click on 'Receipts' in Quick Links and You can find the Clients who have joined.You can Select Multiple Clients & send the Receipt in email or Click on the three dots --> View Invoice & Share through Whatsapp Individually",
      },
    ],
    "Daily Pass & Sessions": [
      {
        id: 111,
        question: "What is Daily Gym Pass in Fymble?",
        answer:
          "Daily Gym Pass is one day gym entry pass for your gym. Users can purchase daily gym pass from 1 to 29 days. User's Pass need to be scanned by Gym Owners/Trainers before allowed to workout and amount will be credited to the gym only if the pass is scanned",
      },
      {
        id: 115,
        question: "What is Fitness Classes in Fymble?",
        answer:
          "Fitness Classes is demand based pass for your gym's services like Personal Training, Zumba, Dance, Yoga, Pilates, Martial Arts etc.Each Class is 60 Minutes long. Users can Purchase Class from 1 to 29 days based on Slots available on that day. User's Pass need to be scanned by Gym Owners/Trainers before allowed to workout and amount will be credited to the gym only if the pass is scanned",
      },
      {
        id: 113,
        question: "How to Create the Daily Gym Pass & Fitness Classes?",
        answer:
          "Click on the 'Set Price' Button on the Home page's Daily Pass & Fitness Classes Card.Select Daily Pass or Desired Class and Toggle on the Booking and Set the Price",
      },
      {
        id: 112,
        question: "How to Scan the Daily Gym Pass & Fitness Classes?",
        answer:
          "Click the 'Scan Daily Pass & Fitness Classes Pass' Button in the home page to scan the QR code of the user's daily gym pass & Fitness Classes.",
      },
      {
        id: 114,
        question:
          "How to View the Bookings of Daily Pass & Fitness Classes in my Gym?",
        answer:
          "Click on the 'View Bookings' Button on the Home page's Daily Pass & Fitness Classes Card. You can view the bookings for next 30 days. Count Mentioned is the Expected Count only based on bookings, It may differ slightly",
      },
      {
        id: 117,
        question:
          "How to View my Earnings through Daily Pass & Fitness Classes in my Gym?",
        answer:
          "Go to Clients Bottom Tab and Select the 'Daily Pass and Fitness Classes Clients' and Choose the type of Class or Daily Pass to View the earnings ",
      },
    ],

    "Plans & Pricing": [
      {
        id: 6,
        question: "How do I create different Membership plans?",
        answer:
          "Navigate to the Plans & Batches from Quick Links and click 'Add New Plan' and Fill the required details to create a plan. You can Create Different type of Plans like Membership, PT Plans, Couple Membership, Couple PT Plans",
      },
      {
        id: 8,
        question: "How do I manage Fee collection and Payment tracking?",
        answer:
          "Navigate to Client's Tab to find their Fee status.You can filter the Clients based on their Fee Status ( Paid and Unpaid )",
      },
      {
        id: 7,
        question: "How to Provide No Cost EMI to my Clients?",
        answer:
          "You can toggle the No Cost EMI button 'on' in Plans Page, to apply No Cost EMI to your plans. Only Plans above ₹4000 are eligible for No Cost EMI. The Interest will be beared by the Gym",
      },
    ],

    Trainers: [
      {
        id: 69,
        question: "How do I create trainer login?",
        answer:
          "Tap the Manage Trainers from '+' button. Select Add Trainer and Enter the details and create the trainer login. Trainer can login with that mobile number and create the password during the first login",
      },
    ],

    "App Features": [
      {
        id: 14,
        question: "How do I manage gym enquiries and leads?",
        answer:
          "The Enquiry Management system helps you track potential clients, follow up on leads and convert enquiries into memberships with automated workflows.You can reach the page from Home - Active Enquiries Card",
      },
      {
        id: 15,
        question: "Can I send emails to members?",
        answer:
          "Yes, you can emails for membership expiry reminders, payment due notifications and so on",
      },
    ],
  };

  const toggleExpand = (itemId) => {
    if (expandedItem === itemId) {
      setExpandedItem(null);
    } else {
      setExpandedItem(itemId);
    }
  };

  const validateEmail = (email) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate the form before submission
  const validateForm = () => {
    let newErrors = {};
    let isValid = true;

    // Check issue type
    if (
      ticketData.issueType === "" ||
      ticketData.issueType === "Select an issue type"
    ) {
      newErrors.issueType = "Please select an issue type";
      isValid = false;
    }

    // Check custom subject if "Other" is selected
    if (ticketData.issueType === "Other" && !ticketData.customSubject.trim()) {
      newErrors.customSubject = "Please enter your subject";
      isValid = false;
    }

    // Check email
    if (!ticketData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!validateEmail(ticketData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Check description
    if (!ticketData.description.trim()) {
      newErrors.description = "Please describe your issue";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitTicket = async () => {
    if (validateForm()) {
      try {
        const gym_id = await getToken("gym_id");
        if (!gym_id) {
          showToast({
            type: "error",
            title: "Error",
            desc: "Something went wrong. Please try again later",
          });
        }
        const payload = {
          gym_id,
          subject:
            ticketData?.issueType === "Other"
              ? ticketData.customSubject
              : ticketData?.issueType,
          email: ticketData?.email,
          issue: ticketData?.description,
        };

        const response = await supportAPI(payload);
        if (response?.status === 200) {
          setToken(response?.data);
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            setModalVisible(false);
            setTicketData({
              issueType: "",
              customSubject: "",
              email: "",
              description: "",
            });
            setErrors({});
          }, 5000);
        } else {
          showToast({
            type: "error",
            title: "Error",
            desc:
              response?.detail ||
              "Something went wrong. Please try again later",
          });
        }
      } catch (err) {
        showToast({
          type: "error",
          title: "Error",
          desc: "Something went wrong. Please try again later",
        });
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setTicketData({
      issueType: "",
      customSubject: "",
      email: "",
      description: "",
    });
    setErrors({});
    setShowSuccess(false);
  };

  const openWhatsApp = () => {
    const phoneNumber = "919743971315";
    const url = `whatsapp://send?phone=${phoneNumber}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          Alert.alert("Error", "WhatsApp is not installed on this device");
        }
      })
      .catch((err) => console.error("Error opening WhatsApp:", err));
  };

  return (
    <View style={styles.container}>
      <HardwareBackHandler routePath="/owner/home" enabled={true} />

      {/* Header */}
      <NewOwnerHeader
        text="Help & Support"
        onBackButtonPress={() => router.push("/owner/home")}
      />

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {Object.keys(faqData).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.activeTab]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text
                style={[
                  styles.tabText,
                  selectedTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* FAQ Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {faqData[selectedTab].map((item) => (
          <View key={item.id} style={styles.faqItem}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(item.id)}
            >
              <Text style={styles.question}>{item.question}</Text>
              <Ionicons
                name={expandedItem === item.id ? "chevron-up" : "chevron-down"}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
            {expandedItem === item.id && (
              <Text style={styles.answer}>{item.answer}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.supportSection}>
        <View style={styles.supportCard}>
          <Text style={styles.supportTitle}>Need Technical Support?</Text>
          <Text style={styles.supportText}>
            Having trouble with the gym management system or need help with a
            feature? Our technical support team is here to help you maximize
            your gym's efficiency.
          </Text>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.supportButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="support-agent" size={18} color="#FFF" />
              <Text style={styles.supportButtonText}>Raise a ticket</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={openWhatsApp}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFF" />
              <Text style={styles.supportButtonText}>WhatsApp</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.supportHoursText}>
            WhatsApp support - Monday to Saturday 10 AM - 7 PM only
          </Text>
        </View>
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          style={styles.modalOverlay}
        >
          <TouchableWithoutFeedback
            onPress={() => {
              Keyboard.dismiss();
              setModalVisible(false);
            }}
          >
            <View style={styles.modalContent}>
              {showSuccess ? (
                <View style={styles.successContainer}>
                  <View style={styles.successIcon}>
                    <Ionicons
                      name="checkmark-circle"
                      size={60}
                      color="#4CAF50"
                    />
                  </View>
                  <Text style={styles.successTitle}>
                    Support Request Submitted!
                  </Text>
                  <Text style={styles.successText}>
                    Your support ticket ID is {token}. Our technical support
                    team will review your request and get back to you within 24
                    hours.
                  </Text>
                </View>
              ) : (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Raise a ticket</Text>
                    <TouchableOpacity
                      onPress={closeModal}
                      style={styles.closeButton}
                    >
                      <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={[
                        styles.dropdownSelector,
                        errors.issueType && styles.inputError,
                      ]}
                      onPress={() => setDropdownVisible(true)}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          ticketData.issueType === "Select an issue type" ||
                          !ticketData.issueType
                            ? styles.placeholderText
                            : null,
                        ]}
                      >
                        {ticketData.issueType || "Select an issue type"}
                      </Text>
                      <Ionicons name="chevron-down" size={20} color="#999" />
                    </TouchableOpacity>
                    {errors.issueType && (
                      <Text style={styles.errorTextIssue}>
                        {errors.issueType}
                      </Text>
                    )}

                    {/* Custom Dropdown Menu */}
                    {dropdownVisible && (
                      <View style={styles.dropdownMenu}>
                        {commonIssues.map((issue) => (
                          <TouchableOpacity
                            key={issue}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setTicketData({
                                ...ticketData,
                                issueType: issue,
                              });
                              if (errors.issueType) {
                                setErrors({ ...errors, issueType: null });
                              }
                              setDropdownVisible(false);
                            }}
                          >
                            <Text style={styles.dropdownItemText}>{issue}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Add this to close dropdown when clicking outside */}
                  {dropdownVisible && (
                    <TouchableOpacity
                      style={styles.dropdownBackdrop}
                      onPress={() => setDropdownVisible(false)}
                    />
                  )}

                  {/* Custom Subject (only shown if "Other" is selected) */}
                  {ticketData.issueType === "Other" && (
                    <View>
                      <TextInput
                        style={[
                          styles.input,
                          errors.customSubject && styles.inputError,
                        ]}
                        placeholder="Enter your subject"
                        placeholderTextColor="#999"
                        value={ticketData.customSubject}
                        onChangeText={(text) => {
                          setTicketData({ ...ticketData, customSubject: text });
                          if (errors.customSubject) {
                            setErrors({ ...errors, customSubject: null });
                          }
                        }}
                      />
                      {errors.customSubject && (
                        <Text style={styles.errorText}>
                          {errors.customSubject}
                        </Text>
                      )}
                    </View>
                  )}

                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    placeholder="Admin Email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    value={ticketData.email}
                    onChangeText={(text) => {
                      setTicketData({ ...ticketData, email: text });
                      if (errors.email) {
                        setErrors({ ...errors, email: null });
                      }
                    }}
                  />
                  {errors.email && (
                    <Text style={styles.errorText}>{errors.email}</Text>
                  )}

                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      errors.description && styles.inputError,
                    ]}
                    placeholder="Describe your issue or request in detail"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                    value={ticketData.description}
                    onChangeText={(text) => {
                      setTicketData({ ...ticketData, description: text });
                      if (errors.description) {
                        setErrors({ ...errors, description: null });
                      }
                    }}
                  />
                  {errors.description && (
                    <Text style={styles.errorText}>{errors.description}</Text>
                  )}

                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={submitTicket}
                  >
                    <Text style={styles.submitButtonText}>Submit Request</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#000",
  },
  flexHead: {
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
  },
  tabContainer: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  tab: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 5,
    backgroundColor: "#F8F8F8",
    minWidth: 120,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  faqItem: {
    backgroundColor: "#FFFFFF",
    marginBottom: 10,
    borderRadius: 8,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  questionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
  },
  question: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  answer: {
    fontSize: 12,
    color: "#666",
    padding: 15,
    paddingTop: 0,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    width: "90%",
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000",
  },
  closeButton: {
    padding: 5,
  },
  dropdown: {
    marginBottom: 15,
  },
  dropdownSelector: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
  placeholderText: {
    color: "#999",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 14,
    color: "#333",
  },
  inputError: {
    borderColor: "#FF3B30",
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  errorTextIssue: {
    color: "#FF3B30",
    fontSize: 12,
    // marginTop: -10,
    marginBottom: 10,
    marginLeft: 5,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  supportSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  supportCard: {
    backgroundColor: "#FFF",
    borderRadius: 7,
    padding: 15,
    paddingVertical: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  supportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  supportText: {
    fontSize: 12,
    color: "#666",
    lineHeight: 18,
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  supportButton: {
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
  },
  whatsappButton: {
    backgroundColor: "#25D366",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    flex: 1,
  },
  supportButtonText: {
    color: "#FFF",
    fontWeight: "600",
    marginLeft: 8,
    fontSize: 12,
  },
  supportHoursText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    marginTop: 5,
  },
  // Success state styles
  successContainer: {
    alignItems: "center",
    padding: 20,
  },
  successIcon: {
    marginBottom: 15,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  dropdownMenu: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    zIndex: 1000,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 999,
  },
});

export default HelpSupportScreen;
