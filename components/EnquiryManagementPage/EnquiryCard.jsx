import React, { useState } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  Linking,
} from 'react-native';
import StatusUpdateModal from './StatusUpdateModal';
import { Ionicons } from '@expo/vector-icons';

function EnquiryCard({ enquiry, updateEnquiryStatus }) {
  const [showOptions, setShowOptions] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setShowOptions(false);
    setShowStatusModal(true);
  };

  const handleStatusUpdate = (reason) => {
    updateEnquiryStatus(enquiry.enquiry_id, selectedAction, reason);
    setShowStatusModal(false);
    setSelectedAction(null);
  };

  const getBadgeStyle = () => {
    switch (enquiry.status) {
      case 'Pending':
        return styles.statusPending;
      case 'Follow Up':
        return styles.statusFollowUp;
      case 'Joined':
        return styles.statusJoined;
      case 'Rejected':
        return styles.statusRejected;
      default:
        return styles.statusPending;
    }
  };

  return (
    <View style={styles.card}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          // backgroundColor: 'pink',
        }}
      >
        <Text style={styles.cardTitle}>{enquiry.name}</Text>

        <View>
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={() => setShowOptions(!showOptions)}
          >
            <Text style={styles.optionsButtonText}>⋮</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showOptions && (
        <View style={styles.optionsMenu}>
          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleActionSelect('Follow Up')}
          >
            <Text style={styles.optionText}>Follow Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleActionSelect('Joined')}
          >
            <Text style={styles.optionText}>Joined</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionItem}
            onPress={() => handleActionSelect('Rejected')}
          >
            <Text style={styles.optionText}>Rejected</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={styles.mainContentRow}>
          <View style={styles.infoContainer}>
            {enquiry.contact ? (
              <View style={styles.infoRow}>
                <TouchableOpacity
                  style={styles.infoButton}
                  onPress={() =>
                    Linking.openURL(`tel:${'+91'}${enquiry.contact}`)
                  }
                >
                  <View style={styles.iconWrapper}>
                    <Ionicons name="call" size={14} color="#007AFF" />
                  </View>
                  <Text style={styles.infoText}>{enquiry.contact}</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {enquiry.email ? (
              <View style={styles.infoRow}>
                <View style={styles.infoButton}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="mail" size={14} color="#007AFF" />
                  </View>
                  <Text style={styles.infoText} numberOfLines={1}>
                    {enquiry.email}
                  </Text>
                </View>
              </View>
            ) : null}

            {enquiry.convenientTime ? (
              <View style={styles.infoRow}>
                <View style={styles.infoButton}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="time-outline" size={14} color="#007AFF" />
                  </View>
                  <Text style={styles.infoText}>{enquiry.convenientTime}</Text>
                </View>
              </View>
            ) : null}

            {enquiry.message ? (
              <View style={styles.infoRow}>
                <View style={styles.infoButton}>
                  <View style={styles.iconWrapper}>
                    <Ionicons name="chatbox-outline" size={14} color="#007AFF" />
                  </View>
                  <Text style={styles.infoText} numberOfLines={2}>
                    {enquiry.message}
                  </Text>
                </View>
              </View>
            ) : null}
          </View>

          <View style={[styles.statusBadge, getBadgeStyle()]}>
            <Text style={styles.statusText}>{enquiry.status}</Text>
          </View>
        </View>

        {enquiry.statusReason ? (
          <View style={styles.noteContainer}>
            {/* <Text style={styles.noteLabel}> */}
            <Ionicons name="calendar-outline" size={14} color="#007AFF" />
            <Text style={styles.noteText}>{enquiry.statusReason}</Text>
            {/* </Text> */}
          </View>
        ) : null}
      </View>

      <StatusUpdateModal
        visible={showStatusModal}
        action={selectedAction}
        onClose={() => setShowStatusModal(false)}
        onSubmit={handleStatusUpdate}
      />
    </View>
  );
}

export default EnquiryCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  cardContent: {
    marginTop: 8,
  },
  mainContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  infoContainer: {
    flex: 1,
    paddingRight: 10,
  },
  infoRow: {
    marginBottom: 6,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4A4A4A',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#FF834E',
  },
  statusFollowUp: {
    backgroundColor: '#34C759',
  },
  statusJoined: {
    backgroundColor: '#34C759',
  },
  statusRejected: {
    backgroundColor: '#FF3B30',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
  },
  optionsButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 5,
    zIndex: 1,
  },
  optionsButtonText: {
    fontSize: 20,
    color: '#7f8c8d',
  },
  optionsMenu: {
    position: 'absolute',
    top: 35,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
    width: 130,
    overflow: 'hidden',
  },
  optionItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  noteContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noteText: {
    fontSize: 12,
    color: '#6A6A6A',
    paddingLeft: 8,
    flex: 1,
  },
});
