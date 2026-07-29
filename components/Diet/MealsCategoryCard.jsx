import React from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import Checkbox from '../../components/ui/CustomCheckbox';
import GradientButton2 from '../../components/ui/GradientButton2';
import TemplateFoodCard from './TemplateFoodCard';

const { width } = Dimensions.get('window');

const MealsCategoryCard = ({
  title,
  timeRange,
  onAddFood,
  itemsCount,
  onPress,
  foodList,
  templateTitle,
  templateId,
  updateDietTemplate,
  logFood,
  catSelected,
  handleSelection,
  categoryId,
  defaultTemplateId,
}) => {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.timeRange}>{timeRange}</Text>
        </View>

        {logFood ? (
          <Checkbox
            label=""
            checked={catSelected}
            onChange={() => handleSelection({ catId: categoryId })}
            containerStyle={{}}
            checkboxStyle={{
              width: 18,
              height: 18,
              borderWidth: 1,
              borderColor: '#007bffcc',
            }}
          />
        ) : (
          <>
            {!defaultTemplateId && (
              <GradientButton2
                title={'+ Add Food'}
                onPress={() => onPress()}
                fromColor={'#28A745'}
                toColor={'#007BFF'}
                textStyle={{}}
                containerStyle={{
                  borderRadius: 8,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                }}
              />
            )}
          </>
        )}
      </View>

      {foodList.length === 0 && (
        <View style={styles.footerRow}>
          <Text style={styles.noItemsText}>
            {itemsCount > 0
              ? `${itemsCount} items added`
              : 'No items added yet'}
          </Text>
        </View>
      )}

      {foodList.length > 0 && (
        <View style={styles.foodList}>
          <FlatList
            data={foodList}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TemplateFoodCard
                id={item.id}
                image={item.image}
                title={item.name}
                calories={item.calories}
                carbs={item.carbs}
                fat={item.fat}
                sugar={item.sugar}
                fiber={item.fiber}
                protein={item.protein}
                quantity={item.quantity}
                deleteMeal={() => {
                  updateDietTemplate(item.id);
                }}
                mealSelected={item.selected}
                handleSelection={() =>
                  handleSelection({
                    mealId: item.id,
                    catId: categoryId,
                  })
                }
                templateTitle={templateTitle}
                templateId={templateId}
                logFood={logFood}
                defaultTemplateId={defaultTemplateId}
              />
            )}
            contentContainerStyle={{ paddingBottom: 10, paddingTop: 0 }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FAFAFA',
    borderRadius: 14,
    padding: 16,
    marginVertical: 10,
    width: width * 0.9,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    color: '#0A0A0A',
  },
  timeRange: {
    fontSize: 10,
    color: '#777',
    marginTop: 4,
  },
  addButtonWrapper: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  addButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  footerRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  noItemsText: {
    fontSize: 12,
    color: '#777',
  },
  foodList: {
    padding: 0,
  },
});

export default MealsCategoryCard;
