import { Image } from "expo-image";
import React, { forwardRef } from "react";
import { Platform, StyleSheet, Text, View, Dimensions } from "react-native";
import { ScrollView, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

const { width } = Dimensions.get("window");
const isTablet = width >= 768;

const DietHeader = forwardRef(
  ({ tabHeaders, activeTabHeader, handleTabSelection, headerName }, ref) => {
    return (
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabsContainer,
          // { flex: tabHeaders.length > 3 ? 1 : 0 },
          { flex: (headerName === "client" || headerName === "analysis") && 1 },
          isTablet && { flex: 1, justifyContent: "space-around" },
        ]}
        pointerEvents="auto"
        style={{ zIndex: 999 }}
      >
        {tabHeaders?.map((tab, index) => {
          const isActive = activeTabHeader === tab.title;

          return (
            <TouchableOpacity
              key={tab.title}
              style={[
                styles.tabItem,
                isActive && styles.tabItemActive,
                isTablet && { flex: 1 },
              ]}
              onPress={() => handleTabSelection(tab.title, index)}
            >
              {isActive ? (
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[
                    styles.tabIconContainer,
                    styles.tabIconContainerActive,
                    { borderRadius: 20 },
                  ]}
                >
                  {tab.iconType === "icon" &&
                    tab.iconLibrary &&
                    tab.iconName && (
                      <tab.iconLibrary
                        name={tab.iconName}
                        size={16}
                        color="#fff"
                      />
                    )}
                  {tab.iconType === "png" && (
                    <Image
                      source={tab.iconSource}
                      style={{
                        width: 40,
                        height: 40,
                        tintColor: "#fff",
                      }}
                      contentFit="contain"
                    />
                  )}
                  {tab.iconType === "image" && (
                    <Image
                      source={tab.iconSource}
                      style={{
                        width: 14,
                        height: 14,
                      }}
                      contentFit="contain"
                    />
                  )}
                </LinearGradient>
              ) : (
                <View style={[styles.tabIconContainer]}>
                  {tab.iconType === "icon" &&
                    tab.iconLibrary &&
                    tab.iconName && (
                      <tab.iconLibrary
                        name={tab.iconName}
                        size={16}
                        color="#A6A9A9"
                      />
                    )}
                  {tab.iconType === "png" && (
                    <Image
                      source={tab.iconSource}
                      style={{
                        width: 40,
                        height: 40,
                        tintColor: "#A6A9A9",
                      }}
                      contentFit="contain"
                    />
                  )}
                  {tab.iconType === "image" && (
                    <Image
                      source={tab.iconSource}
                      style={{
                        width: 14,
                        height: 14,
                      }}
                      contentFit="contain"
                    />
                  )}
                </View>
              )}
              {isActive ? (
                <MaskedView
                  maskElement={
                    <Text style={[styles.tabTextHeader, styles.tabTextActive]}>
                      {tab.title}
                    </Text>
                  }
                >
                  <LinearGradient
                    colors={["#000000", "#000000"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={[styles.tabTextHeader, { opacity: 0 }]}>
                      {tab.title}
                    </Text>
                  </LinearGradient>
                </MaskedView>
              ) : (
                <Text style={styles.tabTextHeader}>{tab.title}</Text>
              )}
              {isActive && (
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.border_bottom}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  },
);

export default DietHeader;

const styles = StyleSheet.create({
  tabsContainer: {
    // flex: 1,
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 0.5,
    gap: isTablet ? 0 : 30,
    borderBottomColor: "rgba(255, 255, 255, 0.2)",
    // backgroundColor: 'green',
  },
  tabItem: {
    // paddingBottom: 8,
    alignItems: "center",
    position: "relative",
  },
  tabItemActive: {
    // borderBottomWidth: 3,
    // borderBottomColor: '#fff',
    // borderTopLeftRadius: 50,
  },
  tabIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 0,
  },
  tabIconContainerActive: {
    // Style for active tab icon if needed
  },
  tabTextHeader: {
    fontSize: 12,
    fontWeight: "500",
    color: "#A6A9A9",
    paddingBottom: 8,
    marginTop: 3,
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "500",
  },
  tabDescription: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
    fontSize: 15,
    fontWeight: "bold",
    color: "#000000",
    borderRadius: 5,
  },
  logoFirstPart: {
    color: "#FF5757",
  },
  logoSecondPart: {
    color: "#FFFFFF",
  },
  border_bottom: {
    width: "100%",
    height: 3,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: "#fff",
  },
});
