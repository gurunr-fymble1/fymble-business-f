import { useEffect, useState } from 'react';
// import QRCode from 'react-native-qrcode-svg';
import { View, Text } from 'react-native';

export default function UpiQRCode({
  upi_id = '817842879223@ybl',
  account_holdername = 'alone',
}) {
  const [qr, setQr] = useState('');

  // const upiId = '817842879223@ybl';
  // const name = 'alone';
  // const amount = '100.00';
  const upiURL = `upi://pay?pa=${upi_id}&pn=Your%20${account_holdername}&cu=INR`;

  useEffect(() => {
    if (upiURL) {
      setQr(upiURL);
    }
  }, [upiURL]);

  return (
    <View style={{ marginTop: 0 }}>
      {/* {qr && <QRCode value={qr} size={100} />} */}
    </View>
  );
}

// let obj = {
//   client_data: None,
//   owner_data: '<models.GymOwner object at 0x000001E166776E90>',
//   gym_data: {
//     gym_id: 1,
//     name: 'AK Fitness',
//     location: 'Erode',
//     subscription_start_date: None,
//     subscription_end_date: datetime.date(2024, 12, 23),
//     total_members: 6,
//     access_count: 0,
//     gyms_count: 2,
//     account_number: None,
//     account_holdername: None,
//     account_ifsccode: None,
//     account_branch: None,
//     account_id: None,
//     upi_id: None,
//   },
// };
