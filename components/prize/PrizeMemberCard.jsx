import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';

const PrizeMemberCard = ({ member, onCardClick, onButtonClick }) => {

  return (
    <TouchableOpacity style={styles.card} onPress={onCardClick}>
      <View style={styles.cardHeader}>
        {
          member.image_url?
          <Image
            source={member.image_url? {uri:member.image_url}: ""}
            style={styles.profileImage}
            contentFit="cover"
          />:
          <View style={styles.avatarRound}>
            <Text style={styles.avatarText}>{member.client_name.charAt(0)}</Text>
          </View>
        }
        <View style={styles.headerText}>
          <Text style={styles.memberName}>{member.client_name}</Text>
          <Text style={styles.memberId}>ID: {member.gym_client_id}</Text>
        </View>
      </View>

      <View style={styles.prizeInfo}>
        <View style={styles.giftIconContainer}>
          <Image
            source={require('../../assets/images/prize/gift_icon.png')}
            style={[
              styles.giftIcon,
              { marginLeft: member.gift.length > 20 ? 25 : 0 },
            ]}
            contentFit="cover"
          />
        </View>
        <View style={styles.scrollContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEnabled={member.gift.length > 15}
            contentContainerStyle={styles.scrollContent}
          >
            <Text
              style={[
                styles.prizeText,
                member.gift.length > 20 && { paddingRight: 20 }, 
              ]}
              numberOfLines={1}
            >
              {member.gift}
            </Text>
          </ScrollView>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.dateContainer}>
          <Text style={styles.clockIcon}>⏱</Text>
          <Text style={styles.dateText}>{member.given_date? member.given_date.split("T")[0] : member.achieved_date.split("T")[0]}</Text>
        </View>
        <Text style={styles.xpText}>XP:{member.xp}</Text>
      </View>

      {member.is_given ? (
        <TouchableOpacity style={styles.givePrizeButton} onPress={onButtonClick}>
          <Text style={styles.buttonText}>Given</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.givePrizeButton} onPress={onButtonClick}>
          <Text style={styles.buttonText}>Give Prize</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default PrizeMemberCard;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 8,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImage: {
    width: 35,
    height: 35,
    borderRadius: 20,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  memberId: {
    fontSize: 10,
    color: '#666',
  },
  prizeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  giftIconContainer: {
    marginRight: 8,
    // marginLeft: 8,
  },
  giftIcon: {
    width: 16,
    height: 16,
  },
  prizeText: {
    fontSize: 14,
    color: '#0085FF',
    fontWeight: 'bold',
    textAlign: 'center',
  },

  avatarRound:{
    width:30,
    height:30,
    borderRadius:50,
    borderWidth:2,
    borderColor:'#0085FF',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    marginRight:10,
  },

  avatarText:{
    color:'#0085FF',
    fontWeight:'600'
  },

  detailsContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  clockIcon: {
    fontSize: 14,
    marginRight: 6,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  xpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  givePrizeButton: {
    backgroundColor: '#f2f2f2',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#333',
    fontWeight: '500',
    fontSize: 12,
  },
});
