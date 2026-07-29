import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
} from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as XLSX from 'xlsx';
import {
  DataTable,
  Searchbar,
  Badge,
  Button,
  Divider,
  Modal,
  Portal,
} from 'react-native-paper';
import * as FileSystem from 'expo-file-system';

const ImportResultModal = ({
  visible,
  onDismiss,
  importResult,
  onDownloadCorrupted,
}) => (
  <Portal>
    <Modal
      visible={visible}
      onDismiss={onDismiss}
      contentContainerStyle={styles.modalContainer}
    >
      <Animatable.View animation="fadeIn" style={styles.modalContent}>
        <MaterialCommunityIcons
          name={
            importResult?.corrupted_rows?.length > 0
              ? 'alert-circle-outline'
              : 'check-circle-outline'
          }
          size={60}
          color={
            importResult?.corrupted_rows?.length > 0 ? '#F59E0B' : '#10B981'
          }
          style={styles.modalIcon}
        />

        <Text style={styles.modalTitle}>Import Complete</Text>

        <Text style={styles.modalText}>
          Successfully imported {importResult?.imported_count || 0} clients.
        </Text>

        {importResult?.corrupted_rows?.length > 0 ? (
          <>
            <Text style={styles.corruptedText}>
              {importResult.corrupted_rows.length} records had errors and could
              not be imported.
            </Text>

            <TouchableOpacity
              style={styles.downloadButton}
              onPress={onDownloadCorrupted}
            >
              <FontAwesome5 name="file-download" size={16} color="#FFFFFF" />
              <Text style={styles.downloadButtonText}>
                Download Error Report
              </Text>
            </TouchableOpacity>
          </>
        ) : null}

        <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      </Animatable.View>
    </Modal>
  </Portal>
);

export default ImportResultModal;

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalContent: {
    alignItems: 'center',
    width: '100%',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1F2937',
  },
  modalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
    color: '#4B5563',
  },
  corruptedText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 8,
    color: '#F59E0B',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  closeButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  closeButtonText: {
    color: '#4B5563',
    fontWeight: '600',
  },
});
