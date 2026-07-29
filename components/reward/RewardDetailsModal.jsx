import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

const RewardDetailsModal = ({ visible, onClose, reward }) => {
  if (!reward) return null; 
  const DEFAULT_REWARD_IMAGES = {
    'default_rewards': require('../../assets/images/rewards/rewards_img.png'),
    'default_subscription': require('../../assets/images/rewards/subscription.png'),
    'default_bag': require('../../assets/images/rewards/bag.png'),
    'default_bottle': require('../../assets/images/rewards/bottle.png'),
    'default_tshirt': require('../../assets/images/rewards/t-shirt.png'),
  };

  const getImageSource = () => {
    if (reward.image_url && (reward.image_url.startsWith('http') || reward.image_url.startsWith('https'))) {
      return { uri: reward.image_url };
    }

    if (reward.image_url && reward.image_url.startsWith('default_') && DEFAULT_REWARD_IMAGES[reward.image_url]) {
      return DEFAULT_REWARD_IMAGES[reward.image_url];
    }

    return DEFAULT_REWARD_IMAGES['default_rewards'];
  };
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalContentWrapper} onPress={() => { /* Prevent closing */ }}>
            <View style={styles.detailModalContent}>
              <Text style={styles.detailModalTitle}>Reward Details</Text>
              <View style={styles.imageContainer}>
                <Image
                  source={getImageSource()}
                  style={styles.rewardImage}
                />
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons name="close-outline" size={24} color="#000" />
              </TouchableOpacity>

              <View style={styles.detailModalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Points Required:</Text>
                  <Text style={styles.detailValue}>{reward.xp}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reward:</Text>
                  <Text style={styles.detailValue}>{reward.gift}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.modalActionCloseButton}
                onPress={onClose}
              >
                <Text style={styles.modalActionCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContentWrapper: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    overflow: 'hidden',
  },
  detailModalContent: {
    padding: 20,
    paddingTop: 50,
    alignItems: 'center',
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageContainer:{
    width:'100%',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    overflow:'hidden',
    borderRadius:20
  },
  rewardImage: {
    height: 220,
    width: '100%',
    resizeMode:'cover',
    borderRadius: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 5,
  },
  detailModalBody: {
    width: '100%',
    padding: 10,
  },
  detailRow: {
    flexDirection: 'column',
    justifyContent: "flex-start",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    paddingVertical:10
  },
  modalActionCloseButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  modalActionCloseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RewardDetailsModal;