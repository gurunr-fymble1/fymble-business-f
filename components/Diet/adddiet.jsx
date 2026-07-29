import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, View } from 'react-native';

import WorkoutCard from '../Workout/WorkoutCard';

const { width, height } = Dimensions.get('window');

const DietSelection = ({ gender }) => {
  const router = useRouter();

  const renderSelectionButtons = () => {
    return (
      <View style={styles.selectionButtonsContainer}>
        <WorkoutCard
          title={'Log Your Meals'}
          subtitle={
            'Search and log foods directly from our database to track your daily nutrition'
          }
          imagePath={
            gender.toLowerCase() == 'male'
              ? require('../../../assets/images/diet/char_4.png')
              : require('../../../assets/images/diet/char_7.png')
          }
          buttonText="Add Food"
          onPress={() => router.push('/client/myListedFoodLogs')}
          textColor={'#000000'}
          paraTextColor={'#00000081'}
          buttonTextColor={'#28A745'}
          bg1={'#fff'}
          bg2={'#28a74620'}
          border1={'#28a74629'}
          border2={'#297eb32f'}
          charWidth={100}
        />

        <WorkoutCard
          title={'Quick Add with Templates'}
          subtitle={
            'Create and Quickly log your meal in one tap. Perfect for your daily go-to foods.'
          }
          imagePath={
            gender.toLowerCase() === 'male'
              ? require('../../../assets/images/diet/char_5.png')
              : require('../../../assets/images/diet/char_8.png')
          }
          buttonText="Add Food"
          onPress={() =>
            router.push({
              pathname: '/client/personalTemplate',
              params: { method: 'personal' },
            })
          }
          textColor={'#000000'}
          paraTextColor={'#00000081'}
          buttonTextColor={'#28A745'}
          bg1={'#fff'}
          bg2={'#28a74620'}
          border1={'#28a74629'}
          border2={'#297eb32f'}
          charWidth={100}
        />

        <WorkoutCard
          title={'Default Template'}
          subtitle={
            'Search and log foods directly from our database to track your daily nutrition'
          }
          imagePath={
            gender.toLowerCase() === 'male'
              ? require('../../../assets/images/diet/char_6.png')
              : require('../../../assets/images/diet/char_9.png')
          }
          buttonText="Add Food"
          onPress={() => router.push('/client/sampleTemplate')}
          textColor={'#000000'}
          paraTextColor={'#00000081'}
          buttonTextColor={'#28A745'}
          bg1={'#fff'}
          bg2={'#28a74620'}
          border1={'#28a74629'}
          border2={'#297eb32f'}
          charWidth={gender.toLowerCase() === 'male' ? 100 : 120}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderSelectionButtons()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  sectionContainer: {
    flex: 1,
    padding: width * 0.04,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.02,
    marginTop: height * 0.03,
  },
  backButtonText: {
    fontSize: width * 0.04,
    marginLeft: width * 0.02,
    fontWeight: '500',
  },
  selectionButtonsContainer: {
    padding: width * 0.04,
    marginTop: 10,
  },
  selectionButton: {
    marginBottom: height * 0.02,
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonGradient: {
    padding: height * 0.03,
  },
  buttonIconContainer: {
    width: width * 0.1,
    height: width * 0.1,
    borderRadius: width * 0.075,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  buttonTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: height * 0.005,
  },
  buttonSubtitle: {
    fontSize: width * 0.035,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  dateSelector: {
    padding: width * 0.04,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    marginBottom: width * 0.04,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF5757',
  },
  currentTimeText: {
    color: '#666',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 10,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  mostCommon: {
    fontSize: 14,
    color: '#666',
    padding: 10,
    fontWeight: '700',
  },
  foodList: {
    flex: 1,
  },
  noResultsText: {
    textAlign: 'center',
    fontSize: 14,
    width: '75%',
    alignSelf: 'center',
    marginTop: 20,
    color: '#666',
  },
  foodItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedFoodItem: {
    borderColor: '#FF5757',
    backgroundColor: '#E3F2FD',
  },
  foodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  foodTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodItemTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  foodItemSubTitle: {
    fontSize: 11,
  },
  foodItemNutrition: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  nutritionText: {
    fontSize: 14,
    color: '#666',
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 14,
    color: '#666',
  },
  individualQuantityInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    padding: 4,
    width: 50,
    textAlign: 'center',
    marginLeft: 8,
    fontSize: 14,
  },
  inputError: {
    borderColor: 'red',
    borderWidth: 1,
  },
  saveButtonContainer: {
    padding: 15,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: 'white',
    borderRadius: 10,
  },
  saveButton: {
    backgroundColor: '#FF5757',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  templateList: {
    padding: 10,
  },
  templateItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    overflow: 'hidden',
  },
  templateHeader: {
    padding: 15,
  },
  templateTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
  },
  templateMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  templateDetails: {
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 15,
  },
  templateDishItem: {
    marginBottom: 15,
  },
  dishInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  dishName: {
    fontSize: 16,
  },
  dishMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingLeft: 20,
  },
  macroText: {
    fontSize: 14,
    color: '#666',
  },
  vegIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: width * 0.08,
    marginTop: height * 0.06,
  },
  emptyStateTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#333',
    marginTop: height * 0.02,
    marginBottom: height * 0.01,
  },
  emptyStateText: {
    fontSize: width * 0.04,
    color: '#777',
    textAlign: 'center',
  },
});

export default DietSelection;
