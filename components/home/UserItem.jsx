import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { dateUtils } from '../../utils/date';

const UserItem = ({
  item,
  index,
  styles,
  setParticularInvoiceData,
  SetShowInvoice,
  showInvoice,
  handleOpenAboutToExpireModal,
  handleUpdateDiscount,
  activePlanId,
  setActivePlanId,
}) => {
  const [editableDiscount, setEditableDiscount] = useState('');

  const backgroundColor = index % 2 === 0 ? '#e8e8e8c7' : '#ffffff';

  const isEditing = activePlanId === item.plan_id;

  const currentDiscount =
    item.discount !== undefined && item.discount !== null
      ? String(item.discount)
      : '0';

  return (
    <View
      key={item?.client_id}
      style={[styles.userContainer, { backgroundColor }]}
    >
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={styles.userName}>{item?.client_name}</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoItem}>
            <Icon
              name="calendar"
              size={14}
              color="#777"
              style={styles.infoIcon}
            />
            <Text style={styles.userField}>
              Due: {dateUtils.formatToDateOnly(item?.due_date)}
            </Text>
          </View>

          <View style={styles.infoItem}>
            <Icon name="phone" size={14} color="#777" style={styles.infoIcon} />
            <Text style={styles.userField}>{item.client_contact}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="cash"
              size={14}
              color="#777"
              style={styles.infoIcon}
            />
            <Text style={styles.userField}>Fee: {item.fees}</Text>
          </View>

          <View style={styles.infoItem}>
            <Ionicons
              name="chatbox-ellipses-outline"
              size={14}
              color="#777"
              style={styles.infoIcon}
            />
            <Text style={styles.userField}>
              Description: {item.plan_description}
            </Text>
          </View>
        </View>

        {/* Discount */}
        <View style={styles.infoRow}>
          <Text style={styles.fieldLabel}>Discount: </Text>
          {isEditing ? (
            <TextInput
              style={styles.discountInput}
              keyboardType="numeric"
              value={editableDiscount}
              onChangeText={(text) => setEditableDiscount(text)}
              // autoFocus={true}
            />
          ) : (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{currentDiscount}%</Text>
            </View>
          )}
        </View>
      </View>

      {/*------------------- Right side icons ------------------------ */}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => {
            setParticularInvoiceData(item);
            SetShowInvoice(!showInvoice);
            handleOpenAboutToExpireModal();
          }}
        >
          <Icon name="book-open" size={18} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Icon name="share-2" size={18} color="#FF6B6B" />
        </TouchableOpacity>

        {isEditing ? (
          // Show save button when editing
          <TouchableOpacity
            style={[styles.actionButton, styles.activeActionButton]}
            onPress={() => {
              handleUpdateDiscount({
                expiry_id: item.expiry_id,
                gym_id: item.gym_id,
                discount: editableDiscount,
              });
              setActivePlanId(null);
            }}
          >
            <Icon name="check" size={18} color="#fff" />
          </TouchableOpacity>
        ) : (
          // Show edit button when not editing
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Set the editable discount value explicitly from the current discount
              // Set it first before activating edit mode
              setEditableDiscount(currentDiscount);
              setTimeout(() => {
                setActivePlanId(item.plan_id);
              }, 10);
            }}
          >
            <Icon name="edit-3" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default UserItem;
