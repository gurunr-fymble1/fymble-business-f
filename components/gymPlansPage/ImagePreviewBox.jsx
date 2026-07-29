import React, { useState } from 'react';
import { View, Image, TouchableOpacity, StyleSheet, Text, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ImageWithFallback from '../../utils/ImagewithFallback';

const ImagePreviewBox = ({
  image,
  index,
  onRemove,
  onReplace,
  onAddImage,
  isPlaceholder,
  isSelected,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    onRemove();
    setShowDeleteModal(false);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  if (isPlaceholder) {
    return (
      <TouchableOpacity style={styles.container} onPress={onAddImage}>
        <View style={styles.placeholderBox}>
          <Ionicons name="add" size={24} color="#999" />
          <Text style={styles.addText}>Add</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.container, isSelected && styles.selectedContainer]}>
      <ImageWithFallback
        source={image.source}
        style={styles.image}
        resizeMode="cover"
        fallbackText="Unable to load image"
      />
      <View style={styles.overlay}>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.iconButton} onPress={onReplace}>
            <Ionicons name="reload-outline" size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="white" />
          </TouchableOpacity>
        </View>
        {isSelected && (
          <View style={styles.selectedBadge}>
            <Ionicons name="swap-horizontal" size={18} color="white" />
          </View>
        )}
        <Text style={styles.indexText}>{index + 1}</Text>
      </View>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showDeleteModal}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Delete</Text>
            <Text style={styles.modalText}>Are you sure you want to remove this image?</Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={confirmDelete}
              >
                <Text style={[styles.buttonText, styles.deleteText]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 133,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: '#FF5757',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E5E5E5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
  },
  addText: {
    color: '#999',
    marginTop: 5,
    fontSize: 12,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'space-between',
    padding: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  indexText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  selectedBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#FF5757',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  deleteButton: {
    backgroundColor: '#FFE5E5',
  },
  buttonText: {
    fontWeight: '500',
  },
  deleteText: {
    color: '#FF5757',
  },
});

export default ImagePreviewBox;