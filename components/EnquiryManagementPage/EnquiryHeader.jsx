import React from 'react';
import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

function EnquiryHeader({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'new', label: 'New', icon: 'add-circle' },
    { id: 'pending', label: 'Progress', icon: 'time' },
    { id: 'completed', label: 'Done', icon: 'checkmark-done' },
  ];

  return (
    <View style={styles.header}>
      <View style={styles.tabContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={isActive ? '#fff' : '#bdc3c7'}
                style={styles.icon}
              />
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default EnquiryHeader;

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#2c3e50',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  activeTab: {
    backgroundColor: '#FF5757',
  },
  icon: {
    marginRight: 6,
  },
  tabText: {
    color: '#ecf0f1',
    fontSize: 14,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#fff',
  },
});
