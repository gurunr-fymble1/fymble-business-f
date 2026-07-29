import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState, useMemo } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Header from "./newbies/Header";
import SearchBar from "./newbies/SearchBar";

import FilterModal from "./newbies/FilterModal";
import { getNewbiesListAPI, getPlansandBatchesAPI } from "../../services/Api";
import { getToken } from "../../utils/auth";
import ClientItem from "./newbies/ClientItem";

import { showToast } from "../../utils/Toaster";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const { width } = Dimensions.get("window");

const RenderMembersTabs = ({
  styles,
  newEntrantData,
  setBatchModal,
  batchModal,
  setModalVisible,
  modalVisible,
}) => {
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    batch: "",
    training: "",
    aim: "",
    feePaid: "",
  });
  const [query, setQuery] = useState("");
  // const [allUsers, setAllUsers] = useState(newEntrantData?.details); // original data
  // const [users, setUsers] = useState(newEntrantData?.details); // filtered data

  const [newbiesList, setNewbiesList] = useState([]);
  const [filteredList, setFilteredList] = useState([]);
  const [totalEntrants, setTotalEntrants] = useState(0);

  const [plans, setPlans] = useState([]);
  const [batches, setBatches] = useState([]);
  const insets = useSafeAreaInsets();
  const fetchNewbiesList = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Gym details not available",
        });
        return;
      }

      const response = await getNewbiesListAPI(gymId);

      if (response?.status === 200) {
        const { clients, total_entrants } = response.data;

        setNewbiesList(clients);
        setTotalEntrants(total_entrants);
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
    }
  };

  const fetchPlansAndBatches = async () => {
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "GymID is not available",
        });
        return;
      }
      const response = await getPlansandBatchesAPI(gymId);

      if (response?.status === 200) {
        setPlans(response.data.plans);
        setBatches(response.data.batches);
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
    }
  };

  const applyFilters = () => {
    let filtered = [...newbiesList];

    if (filters.name) {
      filtered = filtered.filter((client) =>
        client.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    if (filters.batch) {
      filtered = filtered.filter((client) => client.batch_id === filters.batch);
    }

    if (filters.training) {
      filtered = filtered.filter(
        (client) => client.training_id === filters.training
      );
    }

    if (filters.aim) {
      filtered = filtered.filter((client) => client.goal === filters.aim);
    }

    if (filters.feePaid !== "") {
      filtered = filtered.filter(
        (client) => client.feePaid === filters.feePaid
      );
    }

    setFilteredList(filtered);
    setFilterModalVisible(false);
  };

  const resetFilters = () => {
    setFilters({
      name: "",
      batch: "",
      training: "",
      aim: "",
      feePaid: "",
    });
    setQuery("");
    setFilteredList(newbiesList);
    setFilterModalVisible(false);
  };

  useEffect(() => {
    fetchPlansAndBatches();
    fetchNewbiesList();
    return () => {};
  }, []);

  const applySearchAndFilters = (
    searchText = query,
    filterValues = filters
  ) => {
    let result = [...newbiesList];

    if (searchText) {
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          (item.phone && item.phone.includes(searchText))
      );
    }

    if (filterValues.batch) {
      result = result.filter(
        (client) => client.batch_id === filterValues.batch
      );
    }

    if (filterValues.training) {
      result = result.filter(
        (client) => client.training_id === filterValues.training
      );
    }

    if (filterValues.aim) {
      result = result.filter((client) => client.goal === filterValues.aim);
    }

    if (filterValues.feePaid !== "") {
      result = result.filter(
        (client) => client.feePaid === filterValues.feePaid
      );
    }

    setFilteredList(result);
  };

  const handleSearch = (searchText) => {
    setQuery(searchText);
    applySearchAndFilters(searchText, filters);
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    applySearchAndFilters(query, newFilters);
  };

  useEffect(() => {
    if (newbiesList?.length > 0) {
      applySearchAndFilters();
    }
  }, [newbiesList]);

  const EmptyMessage = useMemo(() => {
    if (filteredList?.length === 0) {
      return (
        <Text
          style={{
            textAlign: "center",
            marginTop: 20,
            color: "#6B7280",
            fontSize: 16,
            paddingHorizontal: 16,
          }}
        >
          No clients match your search or filters.
        </Text>
      );
    }
    return null;
  }, [filteredList?.length]);

  if (newbiesList?.length <= 0) {
    return (
      <View style={styles.containerLive}>
        <Ionicons name="fitness-outline" size={80} color="#A0A0A0" />
        <Text style={styles.mainText}>No new Entrants this month</Text>
        <Text style={styles.subText}>
          Check back later for real-time updates
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#ffffff",
        marginTop: width >= 786 ? 20 : Platform.OS === "ios" ? 25 : 15,
        marginBottom: Platform.OS === "ios" ? 50 : 15,
      }}
    >
      <View style={{ paddingHorizontal: 16 }}>
        <Header
          count={totalEntrants}
          title="New Entrants"
          word1={"New"}
          word2={"Entrants"}
        />

        <SearchBar
          query={query}
          onChange={handleSearch}
          onPress={() => setFilterModalVisible(!filterModalVisible)}
        />
      </View>

      <FlatList
        data={
          filteredList?.length > 0 ||
          query ||
          Object.values(filters).some(Boolean)
            ? filteredList
            : newbiesList
        }
        keyExtractor={(item, index) => {
          // Use unique identifier instead of index for better performance
          return (
            item?.client_id?.toString() ||
            item?.id?.toString() ||
            `newbie-${index}`
          );
        }}
        renderItem={({ item }) => {
          return <ClientItem client={item} />;
        }}
        // Performance optimizations
        initialNumToRender={7}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
        updateCellsBatchingPeriod={50}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 16,
          marginTop: 10,
        }}
        ListHeaderComponent={
          <View style={styles.listHeaderContainer}>{EmptyMessage}</View>
        }
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      />

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        plans={plans}
        batches={batches}
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
        resetFilters={resetFilters}
        insets={insets}
      />
    </View>
  );
};

export default RenderMembersTabs;
