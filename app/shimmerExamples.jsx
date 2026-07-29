import React from "react";
import { View, ScrollView, StyleSheet, Text, SafeAreaView } from "react-native";
import {
  ShimmerBlock,
  ShimmerCard,
  ShimmerListItem,
  ShimmerProfileHeader,
  ShimmerNewsArticle,
  ShimmerGrid,
  ShimmerTextLines,
  ShimmerButton,
} from "../components/shimmerUI/ShimmerComponentsPreview"; // Adjust path as needed

const ShimmerExamples = () => {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Basic Blocks Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Shimmer Blocks</Text>
          <ShimmerBlock width={200} height={20} style={styles.block} />
          <ShimmerBlock
            width={150}
            height={15}
            borderRadius={10}
            style={styles.block}
          />
          <ShimmerBlock
            width={100}
            height={30}
            borderRadius={15}
            shimmerColor="#FFE5E5"
            highlightColor="#FFF5F5"
            duration={1000}
            style={styles.block}
          />
        </View>

        {/* Card Examples */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Card Shimmers</Text>

          {/* Standard Card with Image */}
          <ShimmerCard
            style={styles.card}
            imageHeight={150}
            titleLines={1}
            descriptionLines={2}
            backgroundColor="#FFFFFF"
            shimmerColor="#E1E9EE"
            highlightColor="#F2F8FC"
          />

          {/* Card without Image */}
          <ShimmerCard
            showImage={false}
            titleLines={2}
            descriptionLines={3}
            style={styles.card}
            backgroundColor="#FFF8E1"
            shimmerColor="#FFE082"
            highlightColor="#FFF9C4"
          />
        </View>

        {/* List Items Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>List Item Shimmers</Text>

          <ShimmerListItem
            showAvatar={true}
            avatarSize={40}
            titleWidth="70%"
            subtitleWidth="50%"
            rightContent={true}
            style={styles.listItem}
          />

          <ShimmerListItem
            showAvatar={true}
            avatarSize={50}
            titleWidth="80%"
            subtitleWidth="40%"
            rightContent={false}
            backgroundColor="#F3E5F5"
            shimmerColor="#CE93D8"
            highlightColor="#F8BBD9"
            style={styles.listItem}
          />

          <ShimmerListItem
            showAvatar={false}
            titleWidth="60%"
            subtitleWidth="30%"
            rightContent={true}
            style={styles.listItem}
          />
        </View>

        {/* Profile Header Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Shimmer</Text>
          <ShimmerProfileHeader
            showCoverImage={true}
            coverHeight={120}
            avatarSize={80}
            style={styles.profile}
          />
        </View>

        {/* News Articles Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>News Article Shimmers</Text>

          {/* Image on top */}
          <ShimmerNewsArticle
            showImage={true}
            imagePosition="top"
            style={styles.news}
          />

          {/* Image on left */}
          <ShimmerNewsArticle
            showImage={true}
            imagePosition="left"
            backgroundColor="#E8F5E8"
            shimmerColor="#A5D6A7"
            highlightColor="#C8E6C9"
            style={styles.news}
          />

          {/* No image */}
          <ShimmerNewsArticle showImage={false} style={styles.news} />
        </View>

        {/* Grid Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Grid Shimmers</Text>

          {/* 2 Column Grid */}
          <ShimmerGrid
            columns={2}
            itemCount={4}
            itemHeight={120}
            spacing={12}
            style={styles.grid}
          />

          {/* 3 Column Grid */}
          <ShimmerGrid
            columns={3}
            itemCount={6}
            itemHeight={80}
            spacing={8}
            backgroundColor="#FFF3E0"
            shimmerColor="#FFCC02"
            highlightColor="#FFF8E1"
            style={styles.grid}
          />
        </View>

        {/* Text Lines Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Text Line Shimmers</Text>
          <ShimmerTextLines
            lines={3}
            lineHeight={16}
            lineSpacing={8}
            lastLineWidth="70%"
            style={styles.textLines}
          />

          <ShimmerTextLines
            lines={5}
            lineHeight={14}
            lineSpacing={6}
            lastLineWidth="40%"
            shimmerColor="#E1F5FE"
            highlightColor="#B3E5FC"
            style={styles.textLines}
          />
        </View>

        {/* Button Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Button Shimmers</Text>
          <View style={styles.buttonRow}>
            <ShimmerButton
              width={100}
              height={40}
              borderRadius={8}
              style={styles.button}
            />
            <ShimmerButton
              width={120}
              height={45}
              borderRadius={25}
              shimmerColor="#FFEBEE"
              highlightColor="#FFCDD2"
              style={styles.button}
            />
          </View>
        </View>

        {/* Custom Loading Screen Example */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom Loading Screen</Text>
          <View style={styles.customScreen}>
            <ShimmerBlock
              width="60%"
              height={24}
              style={{ marginBottom: 20 }}
            />

            {Array.from({ length: 3 }).map((_, index) => (
              <ShimmerListItem
                key={index}
                showAvatar={true}
                avatarSize={45}
                titleWidth="75%"
                subtitleWidth="55%"
                rightContent={index % 2 === 0}
                style={{ marginBottom: 12 }}
              />
            ))}

            <View style={styles.buttonRow}>
              <ShimmerButton
                width={80}
                height={35}
                style={{ marginRight: 12 }}
              />
              <ShimmerButton width={100} height={35} />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#2C3E50",
  },
  block: {
    marginBottom: 10,
  },
  card: {
    marginBottom: 16,
  },
  listItem: {
    marginBottom: 8,
  },
  profile: {
    marginBottom: 16,
  },
  news: {
    marginBottom: 12,
  },
  grid: {
    marginBottom: 16,
  },
  textLines: {
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 8,
  },
  button: {
    marginRight: 12,
  },
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  customScreen: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});

export default ShimmerExamples;
