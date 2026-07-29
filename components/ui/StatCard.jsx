import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const StatCard = ({ icon, title, value, color, style, onPress }) => (
  <TouchableOpacity onPress={onPress} style={[styles.statCard, style]}>
    <View
      style={[
        styles.cardIconContainer,
        { backgroundColor: color ? `${color}10` : 'rgba(74, 144, 226, 0.1)' },
      ]}
    >
      {icon}
    </View>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.cardValue}>{value}</Text>
  </TouchableOpacity>
);

export default StatCard;

const styles = StyleSheet.create({
  statCard: {
    width: width * 0.4,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: width * 0.04,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardIconContainer: {
    width: width * 0.15,
    height: width * 0.15,
    borderRadius: width * 0.08,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: height * 0.01,
  },
  cardTitle: {
    fontSize: width * 0.035,
    color: '#FF5757',
    marginBottom: height * 0.005,
  },
  cardValue: {
    fontSize: width * 0.045,
    fontWeight: '700',
    color: '#333',
  },
});
