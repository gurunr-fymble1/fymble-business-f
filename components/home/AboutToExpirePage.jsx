import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { showToast } from "../../utils/Toaster";
import {
  SendEstimatesToExpireMembers,
  UpdateInvoiceDiscount,
  SendReceiptsToPaidMembers,
} from "../../services/Api";
import UserItem2 from "./UserItem2";
import NoDataComponent from "../../utils/noDataComponent";
import PaginationControls from "../ui/PaginationControls";

const RenderAboutToExpirePage = ({
  SetShowInvoice,
  setParticularInvoiceData,
  fetchInvoiceData,
  activeTab,
  title,
  allUsers,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  flatListRef,
  localSelectedMonth,
  localSelectedYear,
  isAboutToExpireModalOpen,
  handleOpenAboutToExpireModal,
  paginationInfo = null,
  viewMode = "monthly",
  selectedUnsentItems = new Set(),
  onSelectUnsentItem = () => {},
  showCheckboxes = false,
  getItemId = (item) => item.id || item.invoice_number || item.client_id,
  role,
  showFeeTypeTag = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectAll, setIsSelectAll] = useState(false);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [emailProgress, setEmailProgress] = useState({ sent: 0, total: 0 });
  const [emailSentUsers, setEmailSentUsers] = useState([]);
  const [paginatedUsers, setPaginatedUsers] = useState([]);
  const [paginationLoading, setPaginationLoading] = useState(false);

  useEffect(() => {
    setSelectedItems([]);
    setIsSelectAll(false);
    setEmailSentUsers([]);
  }, [activeTab, allUsers]);

  useEffect(() => {
    if (viewMode === "all" || !allUsers) {
      setPaginatedUsers(allUsers || []);
      setPaginationLoading(false);
    } else {
      setPaginationLoading(true);
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentItems = allUsers?.slice(startIndex, endIndex);

      setTimeout(() => {
        setPaginatedUsers(currentItems);
        setPaginationLoading(false);
        if (flatListRef.current) {
          flatListRef?.current.scrollToOffset({ offset: 0, animated: true });
        }
      }, 100);
    }
  }, [currentPage, allUsers, itemsPerPage, viewMode]);

  const handlePageChange = useCallback(
    (page) => {
      let maxPages;

      if (viewMode === "all" && paginationInfo) {
        maxPages =
          activeTab === "Sent"
            ? paginationInfo.total_pages_sent
            : paginationInfo.total_pages_unsent;
      } else {
        maxPages = Math.ceil(allUsers?.length / itemsPerPage);
      }

      if (page < 1 || page > maxPages) {
        return;
      }
      setCurrentPage(page);
    },
    [allUsers?.length, itemsPerPage, viewMode, paginationInfo, activeTab]
  );

  const toggleItemSelection = useCallback(
    (item) => {
      if (showCheckboxes && activeTab === "All") {
        const itemId = getItemId(item);
        onSelectUnsentItem(itemId);
        return;
      }

      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      const itemId = item[idKey];

      if (emailSentUsers.includes(itemId)) {
        showToast({
          type: "info",
          title: "Email Already Sent",
          desc: "An email has already been sent for this member.",
        });
        return;
      }

      setSelectedItems((prev) => {
        if (prev.includes(itemId)) {
          return prev.filter((id) => id !== itemId);
        } else {
          return [...prev, itemId];
        }
      });
    },
    [
      title,
      emailSentUsers,
      showCheckboxes,
      activeTab,
      getItemId,
      onSelectUnsentItem,
    ]
  );

  const toggleSelectAll = useCallback(() => {
    if (isSelectAll) {
      setSelectedItems([]);
      setIsSelectAll(false);
    } else {
      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      const selectableItems = paginatedUsers
        .filter((user) => !emailSentUsers.includes(user[idKey]))
        .map((user) => user[idKey]);

      setSelectedItems(selectableItems);
      setIsSelectAll(true);
    }
  }, [isSelectAll, paginatedUsers, emailSentUsers, title]);

  useEffect(() => {
    if (paginatedUsers?.length === 0) {
      setIsSelectAll(false);
      return;
    }

    const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
    const selectableUsersOnPage = paginatedUsers.filter(
      (user) => !emailSentUsers.includes(user[idKey])
    );

    const allSelectedOnPage =
      selectableUsersOnPage?.length > 0 &&
      selectableUsersOnPage.every((user) =>
        selectedItems.includes(user[idKey])
      );

    setIsSelectAll(allSelectedOnPage);
  }, [selectedItems, paginatedUsers, emailSentUsers, title]);

  const handleUpdateDiscount = useCallback(
    async (payload) => {
      setIsLoading(true);
      try {
        const response = await UpdateInvoiceDiscount(payload);
        if (response.status === 200) {
          showToast({
            type: "success",
            title: "Discount updated successfully!",
          });
          if (fetchInvoiceData) {
            fetchInvoiceData();
          }
        } else {
          showToast({
            type: "error",
            title: response?.message || "Failed to update discount.",
          });
        }
      } catch (error) {
        showToast({
          type: "error",
          title: "Error updating discount",
          desc: "An error occurred while updating discount.",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [fetchInvoiceData]
  );

  const handleSendEmails = useCallback(async () => {
    if (selectedItems?.length === 0) {
      showToast({
        type: "error",
        title: "No Selection",
        desc: "Please select at least one user to send emails.",
      });
      return;
    }

    Alert.alert(
      `Send ${title}s`,
      `Are you sure you want to send ${title}s to ${selectedItems?.length} selected members?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Send",
          onPress: async () => {
            setSendingEmails(true);
            setEmailProgress({ sent: 0, total: selectedItems?.length });

            try {
              const payload = [...selectedItems];

              const response =
                title === "Receipt"
                  ? await SendReceiptsToPaidMembers(payload)
                  : await SendEstimatesToExpireMembers(payload);

              if (response?.status === 200) {
                showToast({
                  type: "success",
                  title: `${payload?.length} ${title}s sent successfully!`,
                });
                setEmailSentUsers((prev) => [...prev, ...payload]);
                setSelectedItems([]);
                if (fetchInvoiceData) {
                  fetchInvoiceData();
                }
              } else {
                showToast({
                  type: "error",
                  title: response?.message || `Failed to send ${title}s.`,
                });
              }
            } catch (error) {
              showToast({
                type: "error",
                title: "Error",
                desc: `Failed to send ${title}s. Please try again.`,
              });
            } finally {
              setSendingEmails(false);
            }
          },
        },
      ]
    );
  }, [selectedItems, title, fetchInvoiceData]);

  const keyExtractor = useCallback(
    (item) => {
      const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
      return item[idKey] ? item[idKey].toString() : Math.random().toString();
    },
    [title]
  );

  const renderUserItem = useCallback(
    ({ item, index }) => {
      const realIndex = (currentPage - 1) * itemsPerPage + index + 1;

      let isSelected = false;
      let isEmailSent = false;

      if (showCheckboxes && activeTab === "All") {
        const itemId = getItemId(item);
        isSelected = selectedUnsentItems.has(itemId);
        isEmailSent = item.status === "sent";
      } else {
        const idKey = title === "Receipt" ? "receipt_id" : "expiry_id";
        isEmailSent = emailSentUsers.includes(item[idKey]);
        isSelected = selectedItems.includes(item[idKey]);
      }

      return (
        <UserItem2
          item={item}
          index={realIndex}
          setParticularInvoiceData={setParticularInvoiceData}
          SetShowInvoice={SetShowInvoice}
          handleUpdateDiscount={handleUpdateDiscount}
          toggleItemSelection={toggleItemSelection}
          emailSent={isEmailSent}
          title={title}
          isSelected={isSelected}
          handleOpenAboutToExpireModal={handleOpenAboutToExpireModal}
          showCheckbox={
            showCheckboxes &&
            (activeTab === "All" ? item.status === "unsent" : true)
          }
          isAllTab={activeTab === "All"}
          role={role}
          showFeeTypeTag={showFeeTypeTag}
        />
      );
    },
    [
      currentPage,
      itemsPerPage,
      emailSentUsers,
      selectedItems,
      setParticularInvoiceData,
      SetShowInvoice,
      handleUpdateDiscount,
      toggleItemSelection,
      title,
      handleOpenAboutToExpireModal,
      showCheckboxes,
      activeTab,
      selectedUnsentItems,
      getItemId,
    ]
  );

  const getTotalPages = () => {
    if (viewMode === "all" && paginationInfo) {
      return Math.max(
        1,
        activeTab === "Sent"
          ? paginationInfo.total_pages_sent
          : paginationInfo.total_pages_unsent
      );
    }
    return Math.max(1, Math.ceil(allUsers?.length / itemsPerPage));
  };

  const totalPages = getTotalPages();

  const ListHeader = useCallback(() => {
    return (
      <View style={styles.headerContainer}>
        {activeTab === "Unsent" && paginatedUsers?.length > 0 && (
          <View style={styles.actionsBar}>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={toggleSelectAll}
              disabled={sendingEmails || paginatedUsers?.length === 0}
            >
              <Icon
                name={isSelectAll ? "check-square" : "square"}
                size={18}
                color="#10A0F6"
              />
              <Text style={styles.selectButtonText}>
                {isSelectAll ? "Unselect All" : "Select All"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (selectedItems?.length === 0 || sendingEmails) &&
                  styles.disabledButton,
              ]}
              onPress={handleSendEmails}
              disabled={selectedItems?.length === 0 || sendingEmails}
            >
              {sendingEmails ? (
                <Text style={styles.sendButtonText}>Sending...</Text>
              ) : (
                <>
                  <Icon name="mail" size={18} color="white" />
                  <Text style={styles.sendButtonText}>
                    Send ({selectedItems?.length})
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {sendingEmails && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="small" color="#10A0F6" />
            <Text style={styles.progressText}>Sending emails...</Text>
          </View>
        )}
      </View>
    );
  }, [
    activeTab,
    paginatedUsers?.length,
    toggleSelectAll,
    sendingEmails,
    isSelectAll,
    selectedItems?.length,
    handleSendEmails,
  ]);

  const renderPaginationLoader = useCallback(() => {
    if (!paginationLoading) return null;
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#10A0F6" />
        <Text style={styles.loaderText}>Loading users...</Text>
      </View>
    );
  }, [paginationLoading]);

  const renderPaginationInfo = useCallback(() => {
    if (viewMode === "all" && paginationInfo) {
      const totalItems =
        activeTab === "Sent"
          ? paginationInfo.total_sent
          : paginationInfo.total_unsent;
      const itemsOnCurrentPage = paginatedUsers?.length || 0;
      const start = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
      const end = Math.min(start + itemsOnCurrentPage - 1, totalItems);

      if (totalItems === 0) return null;

      return (
        <Text style={styles.paginationInfoText}>
          Showing {start} - {end} of {totalItems} receipts
        </Text>
      );
    } else {
      const start = Math.min(
        (currentPage - 1) * itemsPerPage + 1,
        allUsers?.length || 0
      );
      const end = Math.min(currentPage * itemsPerPage, allUsers?.length || 0);
      const total = allUsers?.length || 0;

      if (total === 0) return null;

      return (
        <Text style={styles.paginationInfoText}>
          Showing {start} - {end} of {total} users
        </Text>
      );
    }
  }, [
    currentPage,
    allUsers?.length,
    itemsPerPage,
    viewMode,
    paginationInfo,
    activeTab,
    paginatedUsers?.length,
  ]);

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={paginatedUsers}
        keyExtractor={keyExtractor}
        renderItem={renderUserItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          paginationLoading ? (
            renderPaginationLoader()
          ) : (
            <NoDataComponent title={`No ${activeTab} ${title} Found`} />
          )
        }
        contentContainerStyle={styles.flatListContent}
        removeClippedSubviews={false}
        initialNumToRender={itemsPerPage}
        maxToRenderPerBatch={itemsPerPage}
        windowSize={itemsPerPage}
      />

      {((viewMode === "all" &&
        paginationInfo &&
        (paginationInfo.total_sent > 0 || paginationInfo.total_unsent > 0)) ||
        (viewMode !== "all" && allUsers?.length > 0)) && (
        <View style={styles.paginationFooter}>
          {renderPaginationInfo()}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  flatListContent: {
    paddingBottom: 20,
    paddingHorizontal: 15,
  },
  headerContainer: {
    paddingVertical: 10,
    backgroundColor: "#F5F7FA",
    zIndex: 1,
  },
  actionsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 5,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    backgroundColor: "#E6F3FF",
    borderWidth: 1,
    borderColor: "#A6D9FF",
  },
  selectButtonText: {
    marginLeft: 8,
    color: "#10A0F6",
    fontWeight: "600",
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10A0F6",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  sendButtonText: {
    marginLeft: 8,
    color: "white",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    backgroundColor: "#e0f7fa",
    borderRadius: 8,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#b2ebf2",
  },
  progressText: {
    marginLeft: 10,
    color: "#00796b",
    fontWeight: "bold",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 14,
    color: "#555",
  },
  paginationFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  paginationInfoText: {
    fontSize: 14,
    color: "#666",
  },
});

export default RenderAboutToExpirePage;
