import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { WINDOW_HEIGHT, WINDOW_WIDTH } from '../../utils/dimensions';

const HomeNavigationTabs = ({
  tabs = [],
  activeTab,
  onTabPress,
  style = {},
  tabStyle = {},
  textStyle = {},
}) => {
  return (
    <View style={[styles.navigationTabs, style]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.navTab,
            tabStyle,
            activeTab === tab && styles.activeNavTab,
          ]}
          onPress={() => onTabPress(tab)}
        >
          <Text
            style={[
              styles.navTabText,
              textStyle,
              activeTab === tab && styles.activeNavTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  navigationTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: WINDOW_WIDTH * 0.02,
    borderRadius: 12,
    padding: WINDOW_WIDTH * 0.02,
    marginBottom: WINDOW_HEIGHT * 0.02,
  },
  navTab: {
    paddingVertical: WINDOW_HEIGHT * 0.01,
    paddingHorizontal: WINDOW_WIDTH * 0.03,
    borderRadius: 8,
  },
  activeNavTab: {
    backgroundColor: '#FF5757',
  },
  navTabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeNavTabText: {
    color: '#FFF',
    fontWeight: '700',
  },
});

export default HomeNavigationTabs;
