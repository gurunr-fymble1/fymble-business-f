import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

const MonthSelectorModal = ({
  visible,
  onClose,
  onSelectMonth,
  selectedMonth,
  selectedYear,
  onSelectYear,
  handleApply,
}) => {
  const [activeTab, setActiveTab] = useState('month');
  const [currentDate] = useState(new Date());
  const [localMonth, setLocalMonth] = useState(selectedMonth);
  const [localYear, setLocalYear] = useState(selectedYear);

  // Sync local state with parent when modal opens
  useEffect(() => {
    if (visible) {
      setLocalMonth(selectedMonth);
      setLocalYear(selectedYear);
    }
  }, [visible, selectedMonth, selectedYear]);

  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  // Generate list of years (current year - 10 years to current year)
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const years = Array.from({ length: 12 }, (_, i) => currentYear - 10 + i);

  // Check if a month is in the future (disabled)
  const isMonthDisabled = (month) => {
    const monthIndex = months.indexOf(month);
    return localYear === currentYear && monthIndex > currentMonth;
  };

  // Check if a year is in the future (disabled)
  const isYearDisabled = (year) => {
    return year > currentYear;
  };

  const handleSelectMonth = (month) => {
    if (!isMonthDisabled(month)) {
      setLocalMonth(month);
    }
  };

  const handleSelectYear = (year) => {
    if (!isYearDisabled(year)) {
      setLocalYear(year);

      // If we select current year and the previously selected month is in the future,
      // set the month to current month
      if (year === currentYear && isMonthDisabled(localMonth)) {
        setLocalMonth(months[currentMonth]);
      }
    }
  };

  const handleApplyClick = () => {
    onSelectMonth(localMonth);
    onSelectYear(localYear);
    handleApply(localMonth, localYear);
  };

  const renderTabContent = () => {
    if (activeTab === 'month') {
      return (
        <FlatList
          data={months}
          keyExtractor={(item) => item}
          numColumns={3}
          renderItem={({ item }) => {
            const disabled = isMonthDisabled(item);
            return (
              <TouchableOpacity
                style={[
                  styles.monthItem,
                  localMonth === item && styles.selectedMonthItem,
                  disabled && styles.disabledItem,
                ]}
                onPress={() => handleSelectMonth(item)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.monthText,
                    localMonth === item && styles.selectedMonthText,
                    disabled && styles.disabledText,
                  ]}
                >
                  {item.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      );
    } else {
      return (
        <FlatList
          data={years}
          keyExtractor={(item) => item.toString()}
          numColumns={3}
          renderItem={({ item }) => {
            const disabled = isYearDisabled(item);
            return (
              <TouchableOpacity
                style={[
                  styles.yearItem,
                  localYear === item && styles.selectedYearItem,
                  disabled && styles.disabledItem,
                ]}
                onPress={() => handleSelectYear(item)}
                disabled={disabled}
              >
                <Text
                  style={[
                    styles.yearText,
                    localYear === item && styles.selectedYearText,
                    disabled && styles.disabledText,
                  ]}
                >
                  {String(item)}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.selectionDisplay}>
              <Text style={styles.selectionText}>
                {localMonth} {String(localYear)}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Icon name="x" size={20} color="#10A0F6" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'month' && styles.activeTab]}
              onPress={() => setActiveTab('month')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'month' && styles.activeTabText,
                ]}
              >
                Month
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'year' && styles.activeTab]}
              onPress={() => setActiveTab('year')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'year' && styles.activeTabText,
                ]}
              >
                Year
              </Text>
            </TouchableOpacity>
          </View>

          {renderTabContent()}

          <TouchableOpacity style={styles.applyButton} onPress={handleApplyClick}>
            <Text style={styles.applyButtonText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default MonthSelectorModal;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectionDisplay: {
    flex: 1,
  },
  selectionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eaeaea',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#10A0F6',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#10A0F6',
    fontWeight: '600',
  },
  monthItem: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedMonthItem: {
    backgroundColor: '#10A0F6',
  },
  monthText: {
    fontSize: 14,
    color: '#333',
  },
  selectedMonthText: {
    color: '#fff',
    fontWeight: '600',
  },
  yearItem: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 5,
    borderRadius: 5,
    backgroundColor: '#f5f5f5',
  },
  selectedYearItem: {
    backgroundColor: '#10A0F6',
  },
  yearText: {
    fontSize: 14,
    color: '#333',
  },
  selectedYearText: {
    color: '#fff',
    fontWeight: '600',
  },
  disabledItem: {
    backgroundColor: '#f0f0f0',
    opacity: 0.5,
  },
  disabledText: {
    color: '#aaa',
  },
  applyButton: {
    backgroundColor: '#10A0F6',
    borderRadius: 5,
    padding: 12,
    alignItems: 'center',
    marginTop: 15,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
