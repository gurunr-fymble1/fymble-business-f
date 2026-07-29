import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";

import { getToken } from "../../utils/auth";
import { Ionicons } from "@expo/vector-icons";
import {
  AddExpenditureAPI,
  DeleteExpenditureAPI,
  getCollectionSummaryAPI,
  addExpendituresAPI,
  getGymHomeDataAPI,
  UpdateExpenditureAPI,
  getExpenditureListAPI,
} from "../../services/Api";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import SummaryCard from "./finances/SummaryCard";
import NetProfitCard from "./finances/NetProfitCard";
import ReceiptsCard from "./finances/ReceiptsCard";
import ActionButton from "./finances/ActionButtons";
import { showToast } from "../../utils/Toaster";
import MonthSelectorModal from "./MonthSelectorModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PrizeSkeleton from "../ui/loaders/prizeSkeleton";
import FinanceTabSkeleton from "../ui/loaders/financeTabSkeleton";

const { width } = Dimensions.get("window");
const isLargeScreen = width >= 786;

const expenseTypes = [
  "Rent",
  "Utilities",
  "Equipment",
  "Supplies",
  "Marketing",
  "Insurance",
  "Salary",
  "Transportation",
  "Others",
];

const expenseTypeItems = expenseTypes.map((type) => ({
  label: type,
  value: type,
}));

const filterOptions = [
  { id: "overall", label: "Overall", icon: "bar-chart" },
  { id: "custom_interval", label: "Custom Range", icon: "calendar-outline" },
];

const RenderFinancesTab = ({
  styles,
  fetchAttendanceData,
  financialData: financialData2,
  isIncomeModalVisible,
  setIncomeModalVisible,
  isExpenditureModalVisible,
  setExpenditureModalVisible,
}) => {
  const router = useRouter();
  const [filteredExpenses, setFilteredExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expenseDate, setExpenseDate] = useState(new Date());
  const [editingExpense, setEditingExpense] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseType, setExpenseType] = useState("");
  const [customExpenseType, setCustomExpenseType] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filteredIncome, setFilteredIncome] = useState([]);
  const [isAddExpenseModalVisible, setAddExpenseModalVisible] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] =
    useState(false);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const [currentFilter, setCurrentFilter] = useState({
    scope: "current_month",
    startDate: null,
    endDate: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [tempFilter, setTempFilter] = useState({
    scope: "overall",
    startDate: null,
    endDate: null,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const [tempStartDate, setTempStartDate] = useState(new Date());
  const [tempEndDate, setTempEndDate] = useState(new Date());
  const [tempExpenseDate, setTempExpenseDate] = useState(new Date());

  const [ledgerData, setLedgerData] = useState({});
  const [financialData, setFinancialData] = useState([]);
  const [selectedMonthName, setSelectedMonthName] = useState("");
  const [selectedYearNumber, setSelectedYearNumber] = useState(null);
  const [isMonthSelectorVisible, setIsMonthSelectorVisible] = useState(false);

  const getFilterLabel = () => {
    switch (currentFilter.scope) {
      case "current_month":
        return "Current Month";
      case "overall":
        return "Overall";
      case "custom_interval":
        if (currentFilter.startDate && currentFilter.endDate) {
          return `${currentFilter.startDate.toLocaleDateString()} - ${currentFilter.endDate.toLocaleDateString()}`;
        }
        return "Custom Range";
      default:
        return "Current Month";
    }
  };

  const expenditureList = async () => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");
      const response = await getExpenditureListAPI(gymId);

      if (response?.status === 200) {
        setFinancialData(response.data);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const currentDate = new Date();
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    if (!selectedMonthName) {
      setSelectedMonthName(months[currentDate.getMonth()]);
    }
    if (!selectedYearNumber) {
      setSelectedYearNumber(currentDate.getFullYear());
    }
  }, []);

  const getMonthNumber = (monthName) => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return months.indexOf(monthName) + 1;
  };

  const openMonthSelectorModal = () => {
    setIsMonthSelectorVisible(true);
  };

  const closeMonthSelectorModal = () => {
    setIsMonthSelectorVisible(false);
  };

  const filterDataByMonthYear = (monthName, year, type) => {
    const monthNumber = getMonthNumber(monthName);

    if (type === "expense") {
      const filtered = financialData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getFullYear() === year &&
          expenseDate.getMonth() + 1 === monthNumber
        );
      });
      setFilteredExpenses(filtered);
    } else {
      const filtered = financialData.filter((income) => {
        const incomeDate = new Date(income.date);
        return (
          incomeDate.getFullYear() === year &&
          incomeDate.getMonth() + 1 === monthNumber
        );
      });
      setFilteredIncome(filtered);
    }
  };

  const handleMonthYearApply = (monthName, yearNumber) => {
    // Update state first
    setSelectedMonthName(monthName);
    setSelectedYearNumber(yearNumber);

    // Then filter with the new values
    if (isIncomeModalVisible) {
      filterDataByMonthYear(monthName, yearNumber, "income");
    } else if (isExpenditureModalVisible) {
      filterDataByMonthYear(monthName, yearNumber, "expense");
    }
    setIsMonthSelectorVisible(false);
  };

  const fetchLedgerData = async (filterParams = currentFilter) => {
    setIsLoading(true);
    try {
      const gymId = await getToken("gym_id");

      const apiParams = {
        gym_id: gymId,
        scope: filterParams.scope,
      };

      if (
        filterParams.scope === "custom_interval" &&
        filterParams.startDate &&
        filterParams.endDate
      ) {
        apiParams.start_date = filterParams.startDate
          .toISOString()
          .split("T")[0];
        apiParams.end_date = filterParams.endDate.toISOString().split("T")[0];
      } else if (filterParams.scope === "specific_month_year") {
        apiParams.month = filterParams.month;
        apiParams.year = filterParams.year;
      }

      const response = await getCollectionSummaryAPI(
        apiParams.gym_id,
        apiParams.scope,
        apiParams.start_date,
        apiParams.end_date,
        apiParams.month,
        apiParams.year,
      );

      if (response?.status === 200) {
        const data = {
          expenditure: response?.data?.expenditure,
          profit: response?.data?.profit,
          receipt_count: response?.data?.receipt_count,
          total_collection: response?.data?.total_collection,
          other_revenue: response?.data?.other_revenue,
          dailypass_revenue: response?.data?.dailypass_revenue,
        };
        setLedgerData(data);
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    expenditureList();
    fetchLedgerData();
  }, []);

  const openFilterModal = () => {
    setTempFilter(
      currentFilter.scope === "current_month"
        ? { ...currentFilter, scope: "overall" }
        : { ...currentFilter },
    );
    setIsFilterModalVisible(true);
  };

  const applyFilters = () => {
    setCurrentFilter({ ...tempFilter });
    fetchLedgerData(tempFilter);
    setIsFilterModalVisible(false);
  };

  const resetFilters = () => {
    const defaultFilter = {
      scope: "current_month",
      startDate: null,
      endDate: null,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
    };
    setCurrentFilter(defaultFilter);
    fetchLedgerData(defaultFilter);
    setIsFilterModalVisible(false);
  };

  const handleDateChange = (event, selectedDate, type) => {
    if (Platform.OS === "android") {
      if (type === "start") {
        setShowStartDatePicker(false);
        if (selectedDate) {
          setTempFilter((prev) => ({ ...prev, startDate: selectedDate }));
        }
      } else if (type === "end") {
        setShowEndDatePicker(false);
        if (selectedDate) {
          setTempFilter((prev) => ({ ...prev, endDate: selectedDate }));
        }
      } else if (type === "expense") {
        setShowDatePicker(false);
        if (selectedDate) {
          setExpenseDate(selectedDate);
        }
      } else if (type === "month") {
        setShowMonthPicker(false);
        if (selectedDate) {
          setSelectedMonth(selectedDate);
          if (isIncomeModalVisible) {
            filterDataByMonth(selectedDate, "income");
          } else if (isExpenditureModalVisible) {
            filterDataByMonth(selectedDate, "expense");
          }
        }
      }
    } else {
      if (selectedDate) {
        if (type === "start") {
          setTempStartDate(selectedDate);
        } else if (type === "end") {
          setTempEndDate(selectedDate);
        } else if (type === "expense") {
          setTempExpenseDate(selectedDate);
        } else if (type === "month") {
          setTempSelectedMonth(selectedDate);
        }
      }
    }
  };

  const confirmStartDateSelection = () => {
    setTempFilter((prev) => ({ ...prev, startDate: tempStartDate }));
    setShowStartDatePicker(false);
  };

  const confirmEndDateSelection = () => {
    setTempFilter((prev) => ({ ...prev, endDate: tempEndDate }));
    setShowEndDatePicker(false);
  };

  const confirmExpenseDateSelection = () => {
    setExpenseDate(tempExpenseDate);
    setShowDatePicker(false);
  };

  const cancelStartDateSelection = () => {
    setShowStartDatePicker(false);
  };

  const cancelEndDateSelection = () => {
    setShowEndDatePicker(false);
  };

  const cancelExpenseDateSelection = () => {
    setShowDatePicker(false);
  };

  const openStartDatePicker = () => {
    setTempStartDate(tempFilter.startDate || new Date());
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    setTempEndDate(tempFilter.endDate || new Date());
    setShowEndDatePicker(true);
  };

  const openExpenseDatePicker = () => {
    setTempExpenseDate(expenseDate);
    setShowDatePicker(true);
  };

  const toggleAddExpenseModal = (expense = null) => {
    setAddExpenseModalVisible(!isAddExpenseModalVisible);

    if (expense) {
      setEditingExpense(expense.expenditure_id);
      setExpenseDate(new Date(expense.date));
      setExpenseType(expense.type);
      if (!expenseTypes.includes(expense.type)) {
        setExpenseType("Others");
        setCustomExpenseType(expense.expenditure_type);
      }
      setExpenseAmount(expense.amount.toString());
    } else if (isAddExpenseModalVisible) {
      resetForm();
    }
  };

  const toggleIncomeModal = () => {
    setIncomeModalVisible(!isIncomeModalVisible);
    if (!isIncomeModalVisible) {
      filterDataByMonthYear(selectedMonthName, selectedYearNumber, "income");
    }
  };

  const toggleExpenditureModal = () => {
    setExpenditureModalVisible(!isExpenditureModalVisible);
    if (!isExpenditureModalVisible) {
      filterDataByMonthYear(selectedMonthName, selectedYearNumber, "expense");
    }
  };

  const handleDeleteExpense = (expense) => {
    setExpenseToDelete(expense);
    setIsDeleteConfirmModalVisible(true);
    setExpenditureModalVisible(false);
  };

  const closeDeleteConfirmModal = () => {
    setIsDeleteConfirmModalVisible(false);
    setExpenseToDelete(null);
  };

  const confirmDeleteExpense = async () => {
    try {
      setIsLoading(true);
      const gymId = await getToken("gym_id");

      if (!gymId || !expenseToDelete) {
        showToast({
          type: "error",
          title: "GymID or expenseToDelete is not available",
        });
        return;
      }

      const response = await DeleteExpenditureAPI(
        gymId,
        expenseToDelete.expenditure_id,
      );

      if (response?.status === 200) {
        showToast({
          type: "success",
          title: "Expense deleted successfully",
        });
        closeDeleteConfirmModal();

        await fetchAttendanceData();
        fetchLedgerData();

        if (isExpenditureModalVisible) {
          filterDataByMonthYear(
            selectedMonthName,
            selectedYearNumber,
            "expense",
          );
        }
      } else {
        showToast({
          type: "error",
          title: response?.detail || "Failed to delete expense",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setExpenseDate(new Date());
    setExpenseType("");
    setCustomExpenseType("");
    setExpenseAmount("");
    setFormErrors({});
    setEditingExpense(null);
  };

  const validateForm = () => {
    const errors = {};

    if (!expenseDate) {
      errors.date = "Date is required";
    }

    if (!expenseType) {
      errors.type = "Expense type is required";
    } else if (expenseType === "Others" && !customExpenseType.trim()) {
      errors.customType = "Please specify the expense type";
    }

    if (!expenseAmount) {
      errors.amount = "Amount is required";
    } else if (isNaN(expenseAmount) || parseFloat(expenseAmount) <= 0) {
      errors.amount = "Please enter a valid amount";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const filterDataByMonth = (date, type) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (type === "expense") {
      const filtered = financialData.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getFullYear() === year &&
          expenseDate.getMonth() + 1 === month
        );
      });
      setFilteredExpenses(filtered);
    } else {
      const filtered = financialData.filter((income) => {
        const incomeDate = new Date(income.date);
        return (
          incomeDate.getFullYear() === year &&
          incomeDate.getMonth() + 1 === month
        );
      });
      setFilteredIncome(filtered);
    }
  };

  const submitExpense = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setIsLoading(true);
      const gymId = await getToken("gym_id");

      if (!gymId) {
        showToast({
          type: "error",
          title: "GymID is not available",
        });
        return;
      }

      const payload = {
        gym_id: gymId,
        date: expenseDate.toISOString().split("T")[0],
        type: expenseType === "Others" ? customExpenseType : expenseType,
        amount: parseFloat(expenseAmount),
      };

      let response;

      if (editingExpense) {
        response = await UpdateExpenditureAPI({
          ...payload,
          expense_id: editingExpense,
        });
      } else {
        response = await AddExpenditureAPI(payload);
      }

      if (response?.status == 200) {
        showToast({
          type: "success",
          title: response?.message,
        });
        toggleAddExpenseModal();
        await fetchAttendanceData();
        fetchLedgerData();
        if (isExpenditureModalVisible) {
          filterDataByMonthYear(
            selectedMonthName,
            selectedYearNumber,
            "expense",
          );
        }
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Something went wrong, please try again later.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Something went wrong, please try again later.",
      });
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    if (!expenseDate) return false;
    if (!expenseType) return false;
    if (expenseType === "Others" && !customExpenseType.trim()) return false;
    if (
      !expenseAmount ||
      isNaN(expenseAmount) ||
      parseFloat(expenseAmount) <= 0
    )
      return false;
    return true;
  };

  const isFilterValid = () => {
    if (tempFilter.scope === "custom_interval") {
      return (
        tempFilter.startDate &&
        tempFilter.endDate &&
        tempFilter.startDate <= tempFilter.endDate
      );
    }
    return true;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollViewContent}
    >
      <View style={filterStyles.filterHeaderContainer}>
        <View style={filterStyles.filterHeaderLeft}>
          <Text style={filterStyles.filterTitle}>Financial Overview</Text>
          <Text style={filterStyles.filterSubtitle}>{getFilterLabel()}</Text>
        </View>

        <TouchableOpacity
          style={filterStyles.filterButton}
          onPress={openFilterModal}
        >
          <LinearGradient
            colors={["#FFFFFF", "#FFFFFF"]}
            style={filterStyles.filterButtonGradient}
          >
            <Ionicons
              name="filter"
              size={isLargeScreen ? 28 : 20}
              color="#000000"
            />
            {/* <Text style={filterStyles.filterButtonText}>Filter</Text> */}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.cardsContainer}>
        <SummaryCard
          title="Total Collection"
          amount={ledgerData?.total_collection || 0}
          icon="receipt"
          iconColor="#00A389"
          iconBgColor="#E6F7F4"
          leftImage={require("../../assets/images/finances/collection.png")}
        />
        <SummaryCard
          title="Expenditure"
          amount={ledgerData?.expenditure || 0}
          icon="trending-down"
          iconColor="#FF4747"
          iconBgColor="#FFEDED"
          rightImage={require("../../assets/images/finances/expenditure.png")}
        />
      </View>

      <View style={profitCardsStyles.profitCardsRow}>
        <View style={profitCardsStyles.profitCard}>
          <View style={profitCardsStyles.profitCardHeader}>
            <View
              style={[
                profitCardsStyles.iconCircle,
                { backgroundColor: "#E8F5E9" },
              ]}
            >
              <Ionicons
                name="fitness"
                size={isLargeScreen ? 24 : 18}
                color="#4CAF50"
              />
            </View>
            <Text style={profitCardsStyles.profitCardTitle}>Membership/PT</Text>
          </View>
          <Text style={profitCardsStyles.profitAmount}>
            ₹{(ledgerData?.other_revenue || 0).toLocaleString()}
          </Text>
          <Text style={profitCardsStyles.profitLabel}>Revenue</Text>
        </View>

        <View style={profitCardsStyles.profitCard}>
          <View style={profitCardsStyles.profitCardHeader}>
            <View
              style={[
                profitCardsStyles.iconCircle,
                { backgroundColor: "#FFF3E0" },
              ]}
            >
              <Ionicons
                name="calendar"
                size={isLargeScreen ? 24 : 18}
                color="#FF9800"
              />
            </View>
            <Text style={profitCardsStyles.profitCardTitle}>Daily Pass</Text>
          </View>
          <Text style={profitCardsStyles.profitAmount}>
            ₹{(ledgerData?.dailypass_revenue || 0).toLocaleString()}
          </Text>
          <Text style={profitCardsStyles.profitLabel}>Revenue</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: 15 }}>
        <NetProfitCard amount={ledgerData?.profit || 0} />
        <ReceiptsCard
          count={ledgerData?.receipt_count || 0}
          onPress={() => router.push("/owner/paidMembersReceiptListPage")}
        />

        <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
          <ActionButton
            onPress={() => {
              toggleAddExpenseModal();
            }}
            text={"Add Expenses"}
          />
          <ActionButton
            onPress={() => {
              toggleExpenditureModal();
            }}
            text={"View Expenses"}
          />
        </View>
      </View>

      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <View style={filterStyles.modalOverlay}>
          <View style={filterStyles.modalContainer}>
            <LinearGradient
              colors={["#4A90E2", "#357ABD"]}
              style={filterStyles.modalHeader}
            >
              <Text style={filterStyles.modalHeaderTitle}>Filter Options</Text>
              <TouchableOpacity
                style={filterStyles.closeButton}
                onPress={() => setIsFilterModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView
              style={[
                filterStyles.modalContent,
                { paddingBottom: insets.bottom },
              ]}
            >
              <View style={filterStyles.optionsContainer}>
                {filterOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      filterStyles.optionCard,
                      tempFilter.scope === option.id &&
                        filterStyles.optionCardSelected,
                    ]}
                    onPress={() =>
                      setTempFilter((prev) => ({ ...prev, scope: option.id }))
                    }
                  >
                    <View style={filterStyles.optionContent}>
                      <View
                        style={[
                          filterStyles.optionIcon,
                          tempFilter.scope === option.id &&
                            filterStyles.optionIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={option.icon}
                          size={24}
                          color={
                            tempFilter.scope === option.id ? "#fff" : "#4A90E2"
                          }
                        />
                      </View>
                      <Text
                        style={[
                          filterStyles.optionLabel,
                          tempFilter.scope === option.id &&
                            filterStyles.optionLabelSelected,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {tempFilter.scope === option.id && (
                      <View style={filterStyles.selectedIndicator}>
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4A90E2"
                        />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {tempFilter.scope === "custom_interval" && (
                <View style={filterStyles.dateSection}>
                  <Text style={filterStyles.sectionTitle}>
                    Select Date Range
                  </Text>

                  <View style={filterStyles.dateRangeContainer}>
                    <View style={filterStyles.dateInputContainer}>
                      <Text style={filterStyles.dateLabel}>From Date</Text>
                      <TouchableOpacity
                        style={filterStyles.dateButton}
                        onPress={openStartDatePicker}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#4A90E2"
                        />
                        <Text style={filterStyles.dateButtonText}>
                          {tempFilter.startDate
                            ? tempFilter.startDate.toLocaleDateString()
                            : "Select start date"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={filterStyles.dateInputContainer}>
                      <Text style={filterStyles.dateLabel}>To Date</Text>
                      <TouchableOpacity
                        style={filterStyles.dateButton}
                        onPress={openEndDatePicker}
                      >
                        <Ionicons
                          name="calendar-outline"
                          size={20}
                          color="#4A90E2"
                        />
                        <Text style={filterStyles.dateButtonText}>
                          {tempFilter.endDate
                            ? tempFilter.endDate.toLocaleDateString()
                            : "Select end date"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {Platform.OS === "ios" && showStartDatePicker && (
                    <Modal
                      transparent={true}
                      animationType="slide"
                      visible={showStartDatePicker}
                      onRequestClose={cancelStartDateSelection}
                    >
                      <TouchableWithoutFeedback
                        onPress={cancelStartDateSelection}
                      >
                        <View style={pickerStyles.pickerModalContainer}>
                          <TouchableWithoutFeedback
                            onPress={(e) => e.stopPropagation()}
                          >
                            <View style={pickerStyles.pickerContainer}>
                              <View style={pickerStyles.pickerHeader}>
                                <TouchableOpacity
                                  onPress={cancelStartDateSelection}
                                >
                                  <Text style={pickerStyles.pickerCancelText}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                                <Text style={pickerStyles.pickerTitle}>
                                  Select Start Date
                                </Text>
                                <TouchableOpacity
                                  onPress={confirmStartDateSelection}
                                >
                                  <Text style={pickerStyles.pickerConfirmText}>
                                    Done
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={tempStartDate}
                                mode="date"
                                display="spinner"
                                themeVariant="light"
                                textColor="#000000"
                                onChange={(event, date) =>
                                  handleDateChange(event, date, "start")
                                }
                                style={pickerStyles.iosPickerStyle}
                                maximumDate={new Date()}
                              />
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  )}

                  {Platform.OS === "ios" && showEndDatePicker && (
                    <Modal
                      transparent={true}
                      animationType="slide"
                      visible={showEndDatePicker}
                      onRequestClose={cancelEndDateSelection}
                    >
                      <TouchableWithoutFeedback
                        onPress={cancelEndDateSelection}
                      >
                        <View style={pickerStyles.pickerModalContainer}>
                          <TouchableWithoutFeedback
                            onPress={(e) => e.stopPropagation()}
                          >
                            <View style={pickerStyles.pickerContainer}>
                              <View style={pickerStyles.pickerHeader}>
                                <TouchableOpacity
                                  onPress={cancelEndDateSelection}
                                >
                                  <Text style={pickerStyles.pickerCancelText}>
                                    Cancel
                                  </Text>
                                </TouchableOpacity>
                                <Text style={pickerStyles.pickerTitle}>
                                  Select End Date
                                </Text>
                                <TouchableOpacity
                                  onPress={confirmEndDateSelection}
                                >
                                  <Text style={pickerStyles.pickerConfirmText}>
                                    Done
                                  </Text>
                                </TouchableOpacity>
                              </View>
                              <DateTimePicker
                                value={tempEndDate}
                                mode="date"
                                display="spinner"
                                themeVariant="light"
                                textColor="#000000"
                                onChange={(event, date) =>
                                  handleDateChange(event, date, "end")
                                }
                                style={pickerStyles.iosPickerStyle}
                                minimumDate={tempFilter.startDate}
                                maximumDate={new Date()}
                              />
                            </View>
                          </TouchableWithoutFeedback>
                        </View>
                      </TouchableWithoutFeedback>
                    </Modal>
                  )}

                  {Platform.OS === "android" && showStartDatePicker && (
                    <DateTimePicker
                      value={tempFilter.startDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) =>
                        handleDateChange(event, date, "start")
                      }
                      maximumDate={new Date()}
                    />
                  )}

                  {Platform.OS === "android" && showEndDatePicker && (
                    <DateTimePicker
                      value={tempFilter.endDate || new Date()}
                      mode="date"
                      display="default"
                      onChange={(event, date) =>
                        handleDateChange(event, date, "end")
                      }
                      minimumDate={tempFilter.startDate}
                      maximumDate={new Date()}
                    />
                  )}
                </View>
              )}
            </ScrollView>

            <View
              style={[
                filterStyles.actionButtons,
                { paddingBottom: 20 + insets.bottom },
              ]}
            >
              <TouchableOpacity
                style={filterStyles.resetButton}
                onPress={resetFilters}
              >
                <Text style={filterStyles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  filterStyles.applyButton,
                  !isFilterValid() && filterStyles.applyButtonDisabled,
                ]}
                onPress={applyFilters}
                disabled={!isFilterValid()}
              >
                <LinearGradient
                  colors={
                    isFilterValid() ? ["#4A90E2", "#357ABD"] : ["#ccc", "#aaa"]
                  }
                  style={filterStyles.applyButtonGradient}
                >
                  <Text style={filterStyles.applyButtonText}>
                    Apply Filters
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isIncomeModalVisible || isExpenditureModalVisible}
        animationType="slide"
        onRequestClose={() => {
          setIncomeModalVisible(false);
          setExpenditureModalVisible(false);
        }}
      >
        <View style={styles.fullScreenModal}>
          <View style={[styles.modalHeader, { paddingTop: insets.top }]}>
            <Text style={styles.modalHeaderTitle}>
              {isIncomeModalVisible ? "Income Details" : "Expenditure Details"}
            </Text>
            <TouchableOpacity
              style={styles.closeIconButton}
              onPress={() => {
                setIncomeModalVisible(false);
                setExpenditureModalVisible(false);
              }}
            >
              <Ionicons name="close" size={24} color="#444" />
            </TouchableOpacity>
          </View>

          <View style={styles.monthPickerContainer}>
            <TouchableOpacity
              style={styles.monthPickerButton}
              onPress={openMonthSelectorModal}
            >
              <Text style={styles.monthPickerText}>
                {selectedMonthName} {selectedYearNumber}
              </Text>
              <Ionicons name="calendar-outline" size={24} color="#444" />
            </TouchableOpacity>
          </View>

          <MonthSelectorModal
            visible={isMonthSelectorVisible}
            onClose={closeMonthSelectorModal}
            selectedMonth={selectedMonthName}
            selectedYear={selectedYearNumber}
            onSelectMonth={setSelectedMonthName}
            onSelectYear={setSelectedYearNumber}
            handleApply={handleMonthYearApply}
          />

          <View
            style={[styles.cardContainer, { paddingBottom: insets.bottom }]}
          >
            {isIncomeModalVisible ? (
              filteredIncome.length > 0 ? (
                <FlatList
                  data={filteredIncome}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.incomeCard}>
                      <View style={styles.cardHeader}>
                        <View style={styles.cardHeaderLeft}>
                          <Ionicons name="person" size={20} color="#444" />
                          <Text style={styles.cardHeaderText}>
                            {item.client_name}
                          </Text>
                        </View>
                        <Text style={styles.dateText}>{item.date}</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.amountLabel}>Amount Paid:</Text>
                        <Text style={styles.amountValue}>
                          ₹{item.fees_paid}
                        </Text>
                      </View>
                    </View>
                  )}
                  contentContainerStyle={styles.listContainer}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document" size={60} color="#ccc" />
                  <Text style={styles.emptyText}>
                    No income records found for this month
                  </Text>
                </View>
              )
            ) : filteredExpenses.length > 0 ? (
              <FlatList
                data={filteredExpenses}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.expenseCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderLeft}>
                        <Ionicons name="cash-outline" size={20} color="#444" />
                        <Text style={styles.cardHeaderText}>
                          {item.expenditure_type}
                        </Text>
                      </View>
                      <Text style={styles.dateText}>{item.date}</Text>
                    </View>
                    <View style={styles.cardBody}>
                      <Text style={styles.amountLabel}>Amount:</Text>
                      <Text style={styles.amountValue}>₹{item.amount}</Text>
                    </View>
                    <View style={styles.actionButtonsContainer}>
                      <TouchableOpacity
                        style={styles.editButton}
                        onPress={() => {
                          setExpenditureModalVisible(false);
                          setTimeout(() => toggleAddExpenseModal(item), 300);
                        }}
                      >
                        <Ionicons
                          name="create-outline"
                          size={20}
                          color="#fff"
                        />
                        <Text style={styles.editButtonText}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteExpense(item)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#fff" />
                        <Text style={styles.deleteButtonText}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="document" size={60} color="#ccc" />
                <Text style={styles.emptyText}>
                  No expense records found for this month
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteConfirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeDeleteConfirmModal}
        presentationStyle="overFullScreen"
        statusBarTranslucent={true}
      >
        <View style={[styles.confirmModalOverlay, { zIndex: 9999 }]}>
          <View style={styles.confirmModalContainer}>
            <View style={styles.confirmModalHeader}>
              <Ionicons name="warning-outline" size={32} color="#FF5757" />
              <Text style={styles.confirmModalTitle}>Delete Expense</Text>
            </View>
            <Text style={styles.confirmModalText}>
              Are you sure you want to delete this expense? This action cannot
              be undone.
            </Text>
            <View style={styles.confirmModalButtons}>
              <TouchableOpacity
                style={styles.confirmCancelButton}
                onPress={closeDeleteConfirmModal}
                disabled={isLoading}
              >
                <Text style={styles.confirmCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.confirmDeleteButton,
                  isLoading && styles.disabledButton,
                ]}
                onPress={confirmDeleteExpense}
                disabled={isLoading}
              >
                <Text style={styles.confirmDeleteButtonText}>
                  {isLoading ? "Deleting..." : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
            {isLoading && <PrizeSkeleton />}
          </View>
        </View>
      </Modal>
      <Modal
        visible={isAddExpenseModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => toggleAddExpenseModal()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={[styles.modalContainer, { maxHeight: "80%" }]}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                  <Text style={styles.modalHeader}>
                    {editingExpense ? "Edit Expense" : "Add New Expense"}
                  </Text>

                  <View style={styles.formContainer}>
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Date *</Text>
                      <TouchableOpacity
                        style={styles.datePickerButton}
                        onPress={openExpenseDatePicker}
                      >
                        <Text style={styles.dateText}>
                          {expenseDate.toLocaleDateString()}
                        </Text>
                        <Ionicons
                          name="calendar-outline"
                          size={24}
                          color="#444"
                        />
                      </TouchableOpacity>
                      {formErrors.date && (
                        <Text style={styles.errorText}>{formErrors.date}</Text>
                      )}

                      {Platform.OS === "ios" && showDatePicker && (
                        <Modal
                          transparent={true}
                          animationType="slide"
                          visible={showDatePicker}
                          onRequestClose={cancelExpenseDateSelection}
                        >
                          <TouchableWithoutFeedback
                            onPress={cancelExpenseDateSelection}
                          >
                            <View style={pickerStyles.pickerModalContainer}>
                              <TouchableWithoutFeedback
                                onPress={(e) => e.stopPropagation()}
                              >
                                <View style={pickerStyles.pickerContainer}>
                                  <View style={pickerStyles.pickerHeader}>
                                    <TouchableOpacity
                                      onPress={cancelExpenseDateSelection}
                                    >
                                      <Text
                                        style={pickerStyles.pickerCancelText}
                                      >
                                        Cancel
                                      </Text>
                                    </TouchableOpacity>
                                    <Text style={pickerStyles.pickerTitle}>
                                      Select Date
                                    </Text>
                                    <TouchableOpacity
                                      onPress={confirmExpenseDateSelection}
                                    >
                                      <Text
                                        style={pickerStyles.pickerConfirmText}
                                      >
                                        Done
                                      </Text>
                                    </TouchableOpacity>
                                  </View>
                                  <DateTimePicker
                                    value={tempExpenseDate}
                                    mode="date"
                                    display="spinner"
                                    themeVariant="light"
                                    textColor="#000000"
                                    onChange={(event, date) =>
                                      handleDateChange(event, date, "expense")
                                    }
                                    style={pickerStyles.iosPickerStyle}
                                    maximumDate={new Date()}
                                  />
                                </View>
                              </TouchableWithoutFeedback>
                            </View>
                          </TouchableWithoutFeedback>
                        </Modal>
                      )}

                      {Platform.OS === "android" && showDatePicker && (
                        <DateTimePicker
                          value={expenseDate}
                          mode="date"
                          display="default"
                          onChange={(event, date) =>
                            handleDateChange(event, date, "expense")
                          }
                          maximumDate={new Date()}
                        />
                      )}
                    </View>

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Expense Type *</Text>
                      <View style={pickerSelectStyles.pickerContainer}>
                        <RNPickerSelect
                          value={expenseType}
                          onValueChange={(value) => setExpenseType(value)}
                          pickerProps={{
                            itemStyle: {
                              color: "#000000",
                            },
                          }}
                          style={pickerSelectStyles}
                          placeholder={{
                            label: "Select expense type...",
                            value: "",
                          }}
                          items={expenseTypeItems}
                          Icon={() => (
                            <Ionicons
                              name="chevron-down"
                              size={20}
                              color="#666666"
                            />
                          )}
                          useNativeAndroidPickerStyle={false}
                          fixAndroidTouchableBug={true}
                        />
                      </View>
                      {formErrors.type && (
                        <Text style={styles.errorText}>{formErrors.type}</Text>
                      )}
                    </View>

                    {expenseType === "Others" && (
                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Specify Type *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Enter expense type"
                          value={customExpenseType}
                          onChangeText={setCustomExpenseType}
                        />
                        {formErrors.customType && (
                          <Text style={styles.errorText}>
                            {formErrors.customType}
                          </Text>
                        )}
                      </View>
                    )}

                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Amount (₹) *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter amount"
                        keyboardType="numeric"
                        value={expenseAmount}
                        onChangeText={setExpenseAmount}
                      />
                      {formErrors.amount && (
                        <Text style={styles.errorText}>
                          {formErrors.amount}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.modalButtonContainer}>
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => toggleAddExpenseModal()}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.submitButton,
                        !isFormValid() && styles.disabledButton,
                      ]}
                      onPress={submitExpense}
                      disabled={!isFormValid() || isSubmitting}
                    >
                      <Text style={styles.submitButtonText}>
                        {isSubmitting
                          ? "Submitting..."
                          : editingExpense
                            ? "Update"
                            : "Add"}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {isSubmitting && <FinanceTabSkeleton />}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {isLoading && <FinanceTabSkeleton />}
    </ScrollView>
  );
};

const pickerStyles = {
  pickerModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  pickerContainer: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pickerCancelText: {
    fontSize: 16,
    color: "#666",
  },
  pickerConfirmText: {
    fontSize: 16,
    color: "#007AFF",
    fontWeight: "600",
  },
  iosPickerStyle: {
    height: 200,
    width: "100%",
  },
  confirmModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxWidth: 340,
    width: "90%",
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    zIndex: 10000,
  },
};

const pickerSelectStyles = StyleSheet.create({
  pickerContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  inputIOS: {
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 0,
    borderRadius: 12,
    color: "#333",
    paddingRight: 50,
    backgroundColor: "transparent",
    minHeight: 45,
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 0,
    borderRadius: 12,
    color: "#333",
    paddingRight: 50,
    backgroundColor: "transparent",
  },
  placeholder: {
    color: "#999",
    fontSize: 16,
  },
  iconContainer: {
    top: Platform.OS === "ios" ? 16 : 12,
    right: 16,
  },
});

const filterStyles = {
  filterHeaderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: isLargeScreen ? 12 : 6,
    marginHorizontal: isLargeScreen ? 24 : 16,
    gap: isLargeScreen ? 18 : 12,
    paddingTop: isLargeScreen ? 12 : Platform.OS === "ios" ? 30 : 15,
    marginTop: isLargeScreen ? 15 : 0,
  },
  filterHeaderLeft: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: isLargeScreen ? 24 : 16,
    paddingVertical: isLargeScreen ? 8 : 4,
    borderRadius: isLargeScreen ? 16 : 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterTitle: {
    fontSize: isLargeScreen ? 20 : 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: isLargeScreen ? 6 : 4,
  },
  filterSubtitle: {
    fontSize: isLargeScreen ? 16 : 12,
    color: "#666",
  },
  filterButton: {
    borderRadius: isLargeScreen ? 16 : 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  filterButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: isLargeScreen ? 24 : 16,
    paddingVertical: isLargeScreen ? 18 : 12,
  },
  filterButtonText: {
    color: "#000000",
    fontWeight: "600",
    marginLeft: isLargeScreen ? 9 : 6,
    fontSize: isLargeScreen ? 18 : 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  optionsContainer: {
    paddingTop: 20,
  },
  optionCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionCardSelected: {
    backgroundColor: "#e3f2fd",
    borderColor: "#4A90E2",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#e3f2fd",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  optionIconSelected: {
    backgroundColor: "#4A90E2",
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  optionLabelSelected: {
    color: "#4A90E2",
  },
  selectedIndicator: {
    marginLeft: 8,
  },
  dateSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  dateButtonText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  dateRangeContainer: {
    gap: 12,
  },
  dateInputContainer: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  resetButton: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6c757d",
  },
  applyButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  applyButtonDisabled: {
    opacity: 0.5,
  },
  applyButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
};

const profitCardsStyles = {
  profitCardsRow: {
    flexDirection: "row",
    gap: isLargeScreen ? 18 : 12,
    marginVertical: isLargeScreen ? 18 : 12,
    marginTop: 0,
    marginHorizontal: isLargeScreen ? 15 : 10,
  },
  profitCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: isLargeScreen ? 16 : 12,
    padding: isLargeScreen ? 20 : 14,
    paddingVertical: isLargeScreen ? 10 : 6,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  profitCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: isLargeScreen ? 10 : 6,
  },
  iconCircle: {
    width: isLargeScreen ? 44 : 32,
    height: isLargeScreen ? 44 : 32,
    borderRadius: isLargeScreen ? 22 : 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: isLargeScreen ? 12 : 8,
  },
  profitCardTitle: {
    fontSize: isLargeScreen ? 16 : 12,
    fontWeight: "600",
    color: "#666",
    flex: 1,
  },
  profitAmount: {
    fontSize: isLargeScreen ? 24 : 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 0,
  },
  profitLabel: {
    fontSize: isLargeScreen ? 14 : 11,
    color: "#999",
    fontWeight: "500",
  },
};

export default RenderFinancesTab;
