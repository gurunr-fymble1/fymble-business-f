import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Dimensions,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
  Modal,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import Checkbox from "../ui/CustomCheckbox";

const TemplateFoodCard2 = ({
  id,
  image,
  title,
  calories,
  carbs,
  fat,
  protein,
  fiber,
  sugar,
  quantity,
  templateTitle,
  templateId,
  onEdit,
  onDelete,
  deleteMeal,
  logFood,
  mealSelected,
  handleSelection,
  defaultTemplate,
  defaultTemplateId,
  trainerDietTemplateId,
  method,
  templateData,
  onPress,
}) => {
  const nutrients = [
    {
      label: "Calories",
      value: Number(calories).toFixed(2),
      width: 13,
      icon: require("../../assets/images/diet/calorie.png"),
    },
    {
      label: "Proteins",
      value: Number(protein).toFixed(2),
      width: 22,
      icon: require("../../assets/images/diet/protein.png"),
    },
    {
      label: "Carbs",
      value: Number(carbs).toFixed(2),
      width: 22,
      icon: require("../../assets/images/diet/carb.png"),
    },
    {
      label: "Fats",
      value: Number(fat).toFixed(2),
      width: 17,
      icon: require("../../assets/images/diet/fat.png"),
    },
    {
      label: "Fiber",
      value: Number(fiber || 0).toFixed(2),
      width: 26,
      icon: require("../../assets/images/diet/fiber.png"),
    },
    {
      label: "Sugar",
      value: Number(sugar || 0).toFixed(2),
      width: 22,
      icon: require("../../assets/images/diet/sugar.png"),
    },
  ];

  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const toggleDropdown = (event) => {
    if (Platform.OS === "ios") {
      // For iOS, capture the touch position for modal positioning
      event.persist();
      const { pageX, pageY } = event.nativeEvent;
      setMenuPosition({ x: pageX - 110, y: pageY }); // Adjust x to align menu properly
    }
    setShowDropdown(!showDropdown);
  };

  const handleEdit = () => {
    setShowDropdown(false);
    onEdit();
  };

  const handleDelete = () => {
    setShowDropdown(false);
    onDelete();
  };

  // iOS Modal Dropdown Component
  const IOSDropdownModal = () => (
    <Modal
      transparent={true}
      visible={showDropdown}
      animationType="fade"
      onRequestClose={() => setShowDropdown(false)}
    >
      <TouchableWithoutFeedback onPress={() => setShowDropdown(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.iosDropdownMenu,
              {
                left: menuPosition.x,
                top: menuPosition.y,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.iosDropdownItem}
              onPress={handleEdit}
            >
              <Ionicons name="create-outline" size={16} color="#333" />
              <Text style={styles.iosDropdownItemText}>Edit</Text>
            </TouchableOpacity>
            <View style={styles.dropdownSeparator} />
            <TouchableOpacity
              style={styles.iosDropdownItem}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color="#ff3b30" />
              <Text style={[styles.iosDropdownItemText, { color: "#ff3b30" }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  // Android Dropdown Component (original approach)
  const AndroidDropdown = () =>
    showDropdown && (
      <View style={styles.androidDropdownMenu}>
        <TouchableOpacity style={styles.dropdownItem} onPress={handleEdit}>
          <Ionicons name="create-outline" size={16} color="#333" />
          <Text style={styles.dropdownItemText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dropdownItem} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={16} color="#ff3b30" />
          <Text style={[styles.dropdownItemText, { color: "#ff3b30" }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <LinearGradient
        colors={["#F8FCFF", "#F2FAF5"]}
        start={[0, 0]}
        end={[1, 1]}
        style={styles.cardContainer}
      >
        <View style={styles.headerRow}>
          <Text style={styles.title}>{title}</Text>
          {quantity && <Text style={styles.bowlText}>{quantity} items</Text>}

          <View style={styles.menuContainer}>
            {!defaultTemplate && (
              <>
                {!templateTitle && !templateId ? (
                  <>
                    {!defaultTemplateId && (
                      <TouchableOpacity
                        onPress={toggleDropdown}
                        style={styles.menuButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <View style={styles.menuIconContainer}>
                          <Ionicons
                            name="ellipsis-vertical"
                            size={18}
                            color="#666"
                          />
                        </View>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  !logFood && (
                    <TouchableOpacity
                      onPress={() => {
                        deleteMeal();
                      }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={14}
                        color="#ff7f7f"
                      />
                    </TouchableOpacity>
                  )
                )}
              </>
            )}

            {logFood && (
              <Checkbox
                label=""
                checked={mealSelected}
                onChange={handleSelection}
                containerStyle={{}}
                checkboxStyle={{
                  width: 16,
                  height: 16,
                  borderWidth: 1,
                  borderColor: "rgba(40, 167, 70, 0.446)",
                }}
                checkmarkStyle={{ backgroundColor: "#2db84e" }}
              />
            )}

            {/* Render different dropdown based on platform */}
            {Platform.OS === "ios" ? <IOSDropdownModal /> : <AndroidDropdown />}
          </View>
        </View>

        <View style={styles.nutrition_2}>
          {nutrients.map((item, index) => (
            <View style={styles.row} key={index}>
              <Image
                source={item.icon}
                style={[styles.icon, { width: item.width }]}
              />
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.value}>{item.value}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
    height: 130,
    zIndex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    marginBottom: 12,
    borderColor: "#d6d6d6",
    borderBottomWidth: 0.5,
  },
  menuContainer: {
    position: "relative",
  },

  // Menu button styles
  menuButton: {
    padding: 4,
  },
  menuIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  iosDropdownMenu: {
    position: "absolute",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    width: 110,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  iosDropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  iosDropdownItemText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  dropdownSeparator: {
    height: 0.5,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 12,
  },

  // Android Dropdown Styles (original)
  androidDropdownMenu: {
    position: "absolute",
    right: 0,
    top: 25,
    backgroundColor: "#ffffff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
    width: 110,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
    gap: 8,
    backgroundColor: "#ffffff",
  },
  dropdownItemText: {
    fontSize: 14,
    color: "#333",
  },

  // Common styles
  title: {
    fontSize: 12,
    color: "#0A0A0A",
  },
  itemCount: {
    fontSize: 14,
    color: "#777",
  },
  macroRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    fontSize: 14,
    color: "#777",
  },
  macroValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  icon: {
    height: 21,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logFoodText: {
    color: "green",
    fontSize: 14,
    fontWeight: "500",
  },
  viewFoodText: {
    color: "blue",
    fontSize: 14,
    fontWeight: "500",
  },
  nutrition_2: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    borderColor: "#d6d6d6",
  },
  row: {
    alignItems: "center",
  },
  label: {
    fontSize: 10,
    color: "#666",
  },
  value: {
    fontSize: 10,
  },
  bowlText: {
    fontSize: 10,
    color: "#888",
  },
});

export default TemplateFoodCard2;
