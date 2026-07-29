import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/dimensions';

const NavigationBarVersion2 = ({
  tabs = [],
  activeTab,
  onTabPress,
  style = {},
  tabStyle = {},
  textStyle = {},
}) => {
  if (tabs.length === 0) return null;

  return (
    <View style={[styles.navigationTabs, style]}>
      <View style={styles.tabsContainer}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.navTab,
                tabStyle,
                isActive && styles.activeNavTab,
                // Special styling when we have 1 or 2 tabs
                tabs.length <= 2 && styles.fewTabsStyle,
              ]}
              onPress={() => onTabPress(tab)}
              activeOpacity={1}
            >
              {isActive && <View style={styles.activeIndicator} />}
              <Text
                style={[
                  styles.navTabText,
                  textStyle,
                  isActive && styles.activeNavTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationTabs: {
    // backgroundColor: 'rgba(245,245,247,0.9)',
    backgroundColor: 'rgba(245,245,247,0.9)',
    marginHorizontal: WINDOW_WIDTH * 0.05,
    borderRadius: 16,
    marginBottom: WINDOW_HEIGHT * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  navTab: {
    paddingVertical: WINDOW_HEIGHT * 0.012,
    paddingHorizontal: WINDOW_WIDTH * 0.04,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    minHeight: WINDOW_HEIGHT * 0.05,
  },
  fewTabsStyle: {
    // When we have only 1-2 tabs, give them more space
    paddingHorizontal: WINDOW_WIDTH * 0.08,
    marginHorizontal: WINDOW_WIDTH * 0.02,
  },
  activeNavTab: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  navTabText: {
    color: '#888',
    fontWeight: '500',
    fontSize: WINDOW_WIDTH * 0.035,
  },
  activeNavTabText: {
    color: '#333',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    height: 3,
    width: '30%',
    backgroundColor: '#FF5757', // Modern accent color
    borderRadius: 3,
    alignSelf: 'center',
  },
});

export default NavigationBarVersion2;