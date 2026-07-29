
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons'; // or 'react-native-vector-icons' if you're not using Expo
import { Badge } from 'react-native-paper'; // Make sure you have this installed
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Octicons from '@expo/vector-icons/Octicons';

const ClientRow = ({ client, index }) => (
  <Animatable.View
    animation="fadeIn"
    delay={index * 100}
    style={[styles.clientRow, index % 2 === 0 ? styles.evenRow : styles.oddRow]}
  >
    <View style={{ flex: 0.6 }}>
      <Text>{index + 1}</Text>
    </View>

    <View style={styles.clientInfo}>
      <View style={styles.nameContainer}>
        <Text style={styles.clientName}>{client.name}</Text>
      </View>
      {/* <Text style={styles.clientDetail}>{client.email}</Text> */}
    </View>

    <View style={styles.clientContact}>
      <Text style={styles.clientDetail}>{client.contact}</Text>
      {/* <Text style={styles.clientDetail}>{client.email}</Text> */}
      {/* <Text style={styles.clientAddress} numberOfLines={1}>
        {client.location}
      </Text> */}
    </View>

    <View style={styles.clientStatus}>
      <Badge
        style={{
          backgroundColor: client.status !== 'active' ? '#10B981' : '#fe8888',
          marginRight: 10,
          paddingHorizontal: 10,
          //   paddingVertical: 5,
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 400,
        }}
      >
        {client.status !== 'active' ? 'Active' : 'Inactive'}
      </Badge>
      {/* <TouchableOpacity style={styles.moreButton}>
        <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
      </TouchableOpacity> */}
      {/* <MaterialIcons
        name="verified"
        size={24}
        color={client.status === 'active' ? '#10B981' : '#9CA3AF'}
      /> */}
    </View>
  </Animatable.View>
);

export default ClientRow;

const styles = StyleSheet.create({
  clientRow: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F9FAFB',
  },
  clientInfo: {
    flex: 2,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedIcon: {
    marginRight: 8,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clientDetail: {
    fontSize: 14,
    color: '#6B7280',
  },
  clientContact: {
    flex: 2,
    justifyContent: 'center',
  },
  clientAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    width: '95%',
  },
  clientStatus: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  moreButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
});
