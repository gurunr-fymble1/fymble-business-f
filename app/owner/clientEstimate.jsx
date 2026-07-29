import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View, ActivityIndicator, Text } from "react-native";
import RenderAboutToExpirePage from "../../components/home/AboutToExpirePage";
import { showToast } from "../../utils/Toaster";
import { getmembersDataAPI } from "../../services/Api";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { useRouter } from "expo-router";
import SearchBarWithFilterButton from "../../components/ui/SearchBarWithMonthFilter";
import InvoiceModal from "../../components/home/Invoice";
import { getToken } from "../../utils/auth";
import { dateUtils } from "../../utils/date";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

const AboutToExpireMembersListPage = () => {
  const [showInvoice, SetShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState({ send: [], unsend: [] });
  const [particularInvoiceData, setParticularInvoiceData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [role, setRole] = useState(null);

  const [filteredAndSearchedUsers, setFilteredAndSearchedUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const flatListRef = useRef(null);
  const insets = useSafeAreaInsets();
  const searchInputRef = useRef(null);

  const [isAboutToExpireModalOpen, setIsAboutToExpireModalOpen] =
    useState(true);

  const router = useRouter();

  const fetchAboutToExpireData = useCallback(async () => {
    setIsLoading(true);
    try {
      const gym_id = await getToken("gym_id");
      if (!gym_id) {
        showToast({ type: "error", title: "Gym ID is not available." });
        return;
      }
      const response = await getmembersDataAPI(gym_id);

      if (response?.status === 200) {
        setInvoiceData(
          response?.data?.invoice_data || { send: [], unsend: [] }
        );
      } else {
        showToast({
          type: "error",
          title:
            response?.detail || "Failed to fetch about to expire members data.",
        });
      }
    } catch (error) {
      showToast({
        type: "error",
        title: "Error fetching data",
        desc: "Something went wrong, please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchAboutToExpireData();
      getToken("role").then(setRole);
    }, [fetchAboutToExpireData])
  );

  useEffect(() => {
    const dataToFilter = invoiceData.unsend;

    const filtered = dataToFilter.filter(
      (user) =>
        user.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.client_contact?.includes(searchQuery)
    );
    setFilteredAndSearchedUsers(filtered);
    setCurrentPage(1);
  }, [invoiceData, searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    searchInputRef.current?.focus();
  }, []);

  const handleOpenAboutToExpireModal = () => {
    setIsAboutToExpireModalOpen(!isAboutToExpireModalOpen);
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.push("/owner/home")}
        text={"About to Expire Members"}
      />

      <View style={styles.searchContainer}>
        <SearchBarWithFilterButton
          placeholder="Search by name or contact"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClearText={handleClearSearch}
          showFilter={false}
          ref={searchInputRef}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10A0F6" />
          <Text style={styles.loadingText}>
            Loading About to Expire Members...
          </Text>
        </View>
      ) : (
        <RenderAboutToExpirePage
          SetShowInvoice={SetShowInvoice}
          setParticularInvoiceData={setParticularInvoiceData}
          fetchInvoiceData={fetchAboutToExpireData}
          activeTab={"Unsent"}
          heading={"About to Expire Members"}
          title={"About to Expire"}
          allUsers={filteredAndSearchedUsers}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          itemsPerPage={itemsPerPage}
          flatListRef={flatListRef}
          localSelectedMonth={null}
          localSelectedYear={null}
          isAboutToExpireModalOpen={isAboutToExpireModalOpen}
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
          role={role}
        />
      )}

      <InvoiceModal
        visible={showInvoice}
        onClose={() => SetShowInvoice(false)}
        RedButtonText="Send Invoice"
        gymData={{
          name: particularInvoiceData?.gym_name,
          location: particularInvoiceData?.gym_location,
          logo: particularInvoiceData?.gym_logo,
          gst_number: particularInvoiceData?.gst_number,
          account_holdername: particularInvoiceData?.account_holder_name,
          account_number: particularInvoiceData?.account_number || "XXXXXXXXXX",
          account_ifsccode: particularInvoiceData?.ifsc_code || "",
          account_branch: particularInvoiceData?.branch || "",
          upi_id: particularInvoiceData?.upi_id || "",
        }}
        invoice={{
          invoice_number: particularInvoiceData?.invoice_number || "",
          name: particularInvoiceData?.client_name || "Client Name",
          contact: particularInvoiceData?.client_contact || "+91 XXXXXXXXXX",
          paymentReferenceNumber:
            particularInvoiceData?.payment_reference_number || "",
          bankDetails: particularInvoiceData?.bank_details,
          IFSC: particularInvoiceData?.ifsc_code,
          fees: particularInvoiceData?.fees,
          discount: particularInvoiceData?.discount || 0,
          discountedFees:
            particularInvoiceData?.discounted_fees ||
            particularInvoiceData?.fees,
          gymName: particularInvoiceData?.gym_name || "Fitness Gym",
          gymAddress: particularInvoiceData?.gym_location || "Gym Address",
          gstType: "inclusive",
          gstPercentage: 18,
          items: [
            {
              date:
                particularInvoiceData?.due_date?.split(" ")[0] ||
                dateUtils.getCurrentDateFormatted(),
              description:
                particularInvoiceData?.plan_description || "Gym Membership",
              method: "Bank Transfer",
              amount: particularInvoiceData?.fees || 0,
            },
          ],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  searchContainer: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchInput: {
    borderRadius: 8,
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
});

export default AboutToExpireMembersListPage;
