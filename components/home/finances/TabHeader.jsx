import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';


const TabHeader = ({ tabs, activeTab, onTabChange, customStyles = {} }) => {
  return (
    <View style={[styles.tabContainer, customStyles.tabContainer]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[
            styles.tabButton,
            activeTab === tab.id && styles.activeTabButton,
            customStyles.tabButton,
            activeTab === tab.id && customStyles.activeTabButton,
          ]}
          onPress={() => onTabChange(tab.id)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab.id && styles.activeTabText,
              customStyles.tabText,
              activeTab === tab.id && customStyles.activeTabText,
            ]}
          >
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: '#10A0F6',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#777',
  },
  activeTabText: {
    color: '#10A0F6',
    fontWeight: '600',
  },
});

export default TabHeader;
