import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const CustomCalendar = ({ selectedDate, onDateSelect, clientData = [] }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = new Date();

  // Generate dates for 30 days from today
  const generateCalendarDates = () => {
    const allDates = [];

    // Generate 30 days from today
    const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 29); // 30 days total (0-29)

    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      allDates.push(new Date(date));
    }

    // Group by month for display
    const currentMonthDates = [];
    const nextMonthDates = [];

    allDates.forEach(date => {
      if (date.getMonth() === today.getMonth()) {
        currentMonthDates.push(date);
      } else {
        nextMonthDates.push(date);
      }
    });

    return { currentMonthDates, nextMonthDates };
  };

  const { currentMonthDates, nextMonthDates } = generateCalendarDates();

  // Check if date has expected clients
  const hasExpectedClients = (date) => {
    const dateString = date.toDateString();
    return clientData.some(client =>
      new Date(client.expectedDate).toDateString() === dateString && client.expectedCount > 0
    );
  };

  // Get expected client count for a date
  const getExpectedCount = (date) => {
    const dateString = date.toDateString();
    const clientInfo = clientData.find(client =>
      new Date(client.expectedDate).toDateString() === dateString
    );
    return clientInfo ? clientInfo.expectedCount : 0;
  };

  const isSelectedDate = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    return date.toDateString() === today.toDateString();
  };

  const renderDateItem = (date, index) => {
    const selected = isSelectedDate(date);
    const todayDate = isToday(date);
    const hasClients = hasExpectedClients(date);
    const clientCount = getExpectedCount(date);

    const getGradientColors = () => {
      if (selected) {
        return ['#4A90E2', '#357ABD']; // Blue gradient for selected
      } else if (todayDate) {
        return ['#FCD34D', '#F59E0B']; // Yellow gradient for today
      } else if (hasClients) {
        return ['#34D399', '#10B981']; // Green gradient for clients
      } else {
        return ['#F9FAFB', '#F3F4F6']; // Light gray gradient for normal dates
      }
    };

    return (
      <TouchableOpacity
        key={index}
        style={styles.dateItemContainer}
        onPress={() => onDateSelect(date)}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={styles.dateItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text
            style={[
              styles.dateText,
              (selected || todayDate || hasClients) && styles.highlightedDateText,
            ]}
          >
            {date.getDate()}
          </Text>
          {hasClients && (
            <View style={[
              styles.clientIndicator,
              selected && styles.selectedClientIndicator
            ]}>
              <Text style={[
                styles.clientCount,
                selected && styles.selectedClientCount
              ]}>
                {clientCount}
              </Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderMonth = (dates, monthTitle) => {
    // Group dates by weeks
    const weeks = [];
    let currentWeek = [];

    dates.forEach((date, index) => {
      currentWeek.push(date);

      // If it's Sunday (day 0) or the last date, complete the week
      if (date.getDay() === 0 || index === dates.length - 1) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    });

    return (
      <View style={styles.monthContainer}>
        <View style={styles.monthHeader}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
        </View>

        {/* Week day headers */}
        <View style={styles.weekHeader}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarGrid}>
          {weeks.map((week, weekIndex) => (
            <View key={weekIndex} style={styles.weekRow}>
              {/* Fill empty slots for the first week */}
              {weekIndex === 0 && week[0].getDay() !== 1 && (
                Array.from({ length: week[0].getDay() === 0 ? 6 : week[0].getDay() - 1 }).map((_, emptyIndex) => (
                  <View key={`empty-${emptyIndex}`} style={styles.emptyDateItem} />
                ))
              )}

              {week.map((date, dateIndex) => renderDateItem(date, `${weekIndex}-${dateIndex}`))}

              {/* Fill remaining empty slots */}
              {Array.from({
                length: 7 - week.length - (weekIndex === 0 && week[0].getDay() !== 1 ?
                  (week[0].getDay() === 0 ? 6 : week[0].getDay() - 1) : 0)
              }).map((_, emptyIndex) => (
                <View key={`empty-end-${emptyIndex}`} style={styles.emptyDateItem} />
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#007AFF' }]} />
          <Text style={styles.legendText}>Selected</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>Has Clients</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Today</Text>
        </View>
      </View>

      {/* Current Month */}
      {renderMonth(
        currentMonthDates,
        today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      )}

      {/* Next Month */}
      {renderMonth(
        nextMonthDates,
        new Date(today.getFullYear(), today.getMonth() + 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  monthContainer: {
    marginBottom: 20,
  },
  monthHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  weekHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    gap: 4,
  },
  weekRow: {
    flexDirection: 'row',
    gap: 4,
  },
  dateItemContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  dateItem: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    minHeight: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyDateItem: {
    flex: 1,
    aspectRatio: 1,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  highlightedDateText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  clientIndicator: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedClientIndicator: {
    backgroundColor: '#F59E0B',
  },
  clientCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  selectedClientCount: {
    color: '#FFFFFF',
  },
});

export default CustomCalendar;