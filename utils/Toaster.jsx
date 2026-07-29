import Toast from "react-native-toast-message";

export const showToast = ({
  type = "success", // success, error, info
  title = "",
  desc = "",
  visibilityTime = "2500",
}) => {
  Toast.show({
    type,
    text1: title,
    text2: desc,
    visibilityTime,
  });
};
