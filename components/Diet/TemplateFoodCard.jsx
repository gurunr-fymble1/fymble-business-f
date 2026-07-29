import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Checkbox from '../../components/ui/CustomCheckbox';
import { MaskedTextIcon } from '../../components/ui/MaskedText';

const { width } = Dimensions.get('window');

const TemplateFoodCard = ({
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
}) => {
  const nutrients = [
    {
      label: 'Calories',
      value: calories,
      width: 13,
      icon: require('../../assets/images/diet/calorie.png'),
    },
    {
      label: 'Proteins',
      value: protein,
      width: 22,
      icon: require('../../assets/images/diet/protein.png'),
    },
    {
      label: 'Carbs',
      value: carbs,
      width: 22,
      icon: require('../../assets/images/diet/carb.png'),
    },
    {
      label: 'Fats',
      value: fat,
      width: 17,
      icon: require('../../assets/images/diet/fat.png'),
    },
    ,
    {
      label: "Fiber",
      value: fiber || 0,
      width: 26,
      icon: require("../../assets/images/diet/fiber.png"),
    },
    {
      label: "Sugar",
      value: sugar  || 0,
      width: 22,
      icon: require("../../assets/images/diet/sugar.png"),
    },
  ];

  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  // const [isSelected, setIsSelected] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };


  return (
    <LinearGradient
      colors={['#F8FCFF', '#F2FAF5']}
      start={[0, 0]}
      end={[1, 1]}
      style={styles.cardContainer}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{title}</Text>
        {!templateTitle && (
          <Text style={styles.bowlText}>{quantity} items</Text>
        )}
        {/* <Ionicons name="ellipsis-vertical" size={14} color="#0000005f" /> */}
        <View style={styles.menuContainer}>
          {!defaultTemplate && (
            <>
              {!templateTitle && !templateId ? (
                <>
                  {!defaultTemplateId && (
                    <TouchableOpacity onPress={toggleDropdown}>
                      <Ionicons
                        name="ellipsis-vertical"
                        size={14}
                        color="#0000005f"
                      />
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
                    <Ionicons name="trash-outline" size={14} color="#ff7f7f" />
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
                borderColor: 'rgba(40, 167, 70, 0.446)',
              }}
              checkmarkStyle={{ backgroundColor: '#2db84e' }}
            />
          )}

          {showDropdown && (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity style={styles.dropdownItem} onPress={onEdit}>
                <Ionicons name="create-outline" size={16} color="#333" />
                <Text style={styles.dropdownItemText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dropdownItem} onPress={onDelete}>
                <Ionicons name="trash-outline" size={16} color="#ff3b30" />
                <Text style={[styles.dropdownItemText, { color: '#ff3b30' }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          )}
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

      {!templateTitle && !templateId && !defaultTemplateId && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // router.push('/client/logDiet');
              if (defaultTemplate) {
                router.push({
                  pathname: '/client/logDiet',
                  params: {
                    defaultTemplateId: id,
                    defaultTemplateTitle: title,
                    method: method,
                  },
                });
              } else {
                router.push({
                  pathname: '/client/logDiet',
                  params: { templateId: id, templateTitle: title },
                  method: method,
                });
              }
            }}
          >
            <MaskedTextIcon
              icon={'add-circle'}
              size={16}
              text={'Log Food'}
              bg1={'#28A745'}
              bg2={'#007BFF'}
              style={{}}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              if (defaultTemplate) {
                router.push({
                  pathname: '/client/addTemplateCategoryPage',
                  params: {
                    defaultTemplateId: id,
                    defaultTemplateTitle: title,
                    method: method,
                  },
                });
              } else {
                if (method === 'personal') {
                  router.push({
                    pathname: '/client/addTemplateCategoryPage',
                    params: {
                      templateId: id,
                      templateTitle: title,
                      method: method,
                    },
                  });
                } else {
                  router.push({
                    pathname: '/client/addTemplateCategoryPage',
                    params: {
                      // templateId: id,
                      // templateTitle: title,
                      trainerTemplateId: id,
                      trainerTemplateTitle: title,
                      SingleTemplateData: JSON.stringify(templateData),
                      method: method,
                    },
                  });
                }
              }
            }}
          >
            <MaskedTextIcon
              icon={'eye'}
              size={16}
              text={'View Food'}
              bg1={'#28A745'}
              bg2={'#007BFF'}
              style={{}}
            />
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    marginTop: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    marginBottom: 12,
    borderColor: '#d6d6d6',
    borderBottomWidth: 0.5,
  },
  menuContainer: {
    position: 'relative',
  },
  dropdownMenu: {
    position: 'absolute',
    right: 0,
    top: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: 110,
    zIndex: 10,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    gap: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  title: {
    fontSize: 12,
    color: '#0A0A0A',
  },
  itemCount: {
    fontSize: 14,
    color: '#777',
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 14,
    color: '#777',
  },
  macroValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  icon: {
    height: 21,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logFoodText: {
    color: 'green',
    fontSize: 14,
    fontWeight: '500',
  },
  viewFoodText: {
    color: 'blue',
    fontSize: 14,
    fontWeight: '500',
  },
  nutrition_2: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    borderColor: '#d6d6d6',
    borderBottomWidth: 0.5,
  },
  row: {
    alignItems: 'center',
  },
  label: {
    fontSize: 10,
    color: '#666',
  },
  value: {
    fontSize: 10,
  },
  bowlText: {
    fontSize: 10,
    color: '#888',
  },
});

export default TemplateFoodCard;
