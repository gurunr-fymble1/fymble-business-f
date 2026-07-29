import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  ScrollView,
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Animated,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import MaskedView from "@react-native-masked-view/masked-view";
import Footer from "../ui/Home/footer";
import MembershipDashboard from "./MembershipDashboard";
import useBackHandler from "../UseBackHandler ";
import { Image } from "expo-image";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AttendanceSystem from "./AttendanceSystem";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ForceUpdateModal from "../ForceUpdateModal";
import { useForceUpdate } from "../../hooks/useForceUpdate";
import { CameraView, useCameraPermissions } from "expo-camera";
import { getToken, saveToken } from "../../utils/auth";
import { showToast } from "../../utils/Toaster";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  scanSessionsQR,
  scanVerifyDailyPassAPI,
  postRewardFeed,
  markAgreementClickedAPI,
} from "../../services/Api";
import * as Linking from "expo-linking";
import HomeSkeleton from "../ui/loaders/homeSkeleton";

const { width, height } = Dimensions.get("window");

const CircularProgress = ({ percentage }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.circularProgressContainer}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
      </View>
      <Svg width="100" height="100" viewBox="0 0 100 100">
        <Circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="#e0e0e0"
          strokeWidth="8"
        />
        <Defs>
          <SvgLinearGradient
            id="progressGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <Stop offset="0%" stopColor="#5B2B9B" />
            <Stop offset="100%" stopColor="#FF3C7B" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          stroke="url(#progressGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90, 50, 50)"
        />
      </Svg>
    </View>
  );
};

const StatCard = ({ title, value, description, icon, color }) => {
  const colorArray = ["#FFFFFF", "#FFFFFF"];

  return (
    <View style={styles.statCard}>
      <View
        style={[
          styles.cardHeader,
          { borderBottomWidth: 1, borderBlockColor: "#eee" },
        ]}
      >
        <LinearGradient
          colors={colorArray}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <MaskedView
            maskElement={
              <Text style={styles.cardTitle}>{title || "Title"}</Text>
            }
          >
            <LinearGradient
              colors={["#1A1A1A", "#1A1A1A"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ justifyContent: "center" }}
            >
              <Text style={[{ opacity: 0 }, styles.cardTitle]}>
                {title || "Title"}
              </Text>
            </LinearGradient>
          </MaskedView>
        </LinearGradient>
      </View>

      <Text style={styles.cardDescription}>{description || ""}</Text>
      <View style={styles.cardBody}>
        <MaskedView
          maskElement={<Text style={styles.cardValue}>{value || 0}</Text>}
        >
          <LinearGradient
            colors={["#5B2B9B", "#FF3C7B"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.cardValue]}>{value || 0}</Text>
          </LinearGradient>
        </MaskedView>
        <View style={styles.iconContainer}>
          {icon ? (
            <Image
              source={icon ? icon : require("../../assets/images/trophy.png")}
              style={styles.cardIcon}
              contentFit="contain"
            />
          ) : null}
        </View>
      </View>
      <View style={styles.navigationIconContainer}>
        <LinearGradient
          colors={["#007AFF", "#FF1493"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.navIconBackground}
        >
          <View style={styles.navIconWrapper}>
            <Image
              source={require("../../assets/images/chevron-right.png")}
              style={styles.navigationIcon}
              contentFit="contain"
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

const MembershipOverview = ({ membersData }) => {
  let memberIcon, peopleIcon, enquiryIcon, trainerIcon;
  const router = useRouter();

  try {
    memberIcon = require("../../assets/images/MEMBERS_F 1.png");
  } catch (err) {
    console.error("Failed to load member icon");
  }

  try {
    peopleIcon = require("../../assets/images/icon people left.png");
  } catch (err) {
    console.error("Failed to load people icon");
  }

  try {
    enquiryIcon = require("../../assets/images/ENQUIRY (1) 1.png");
  } catch (err) {
    console.error("Failed to load enquiry icon");
  }

  try {
    trainerIcon = require("../../assets/images/home/TRAINER.png");
  } catch (err) {
    console.error("Failed to load trainer icon");
  }

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.cardRow}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/owner/client",
              params: {
                is_active: false,
              },
            })
          }
        >
          <StatCard
            title="Total Members"
            value={membersData?.total_members}
            description="Total Clients Paid & Unpaid"
            icon={memberIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/owner/client",
              params: {
                is_active: true,
              },
            })
          }
        >
          <StatCard
            title="Active Members"
            value={membersData?.active_members}
            description="Current Month Total Paid Clients"
            icon={peopleIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardRow}>
        <TouchableOpacity onPress={() => router.push("/owner/trainerform")}>
          <StatCard
            title="Total Trainers"
            value={membersData?.total_trainers}
            description="Total Number of Available Trainers"
            icon={trainerIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push("/owner/addEnquiry")}>
          <StatCard
            title="Active Enquiries"
            value={membersData?.total_pending_enquiries}
            description="Total Number of pending Enquiries"
            icon={enquiryIcon}
            color={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const QuickLinks = ({ router, role }) => {
  const quickLinks = [
    {
      id: 1,
      title: "Add Clients",
      icon: require("../../assets/images/header/icon_1.png"),
      path: "/owner/clientform",
    },
    {
      id: 5,
      title: "Manage Plans",
      icon: require("../../assets/images/ASSAIGNMENT 1.png"),
      path: "/owner/createPlans",
    },
    {
      id: 11,
      title: "Add Enquiries",
      icon: require("../../assets/images/icon people 2.png"),
      path: "/owner/addEnquiry",
    },

    {
      id: 3,
      title: "Receipts",
      icon: require("../../assets/images/RECEPT 1.png"),
      path: "/owner/paidMembersReceiptListPage",
    },
    {
      id: 4,
      title: "Estimates",
      icon: require("../../assets/images/calculator paper.png"),
      path: "/owner/clientEstimatePage",
    },
  ];
  if (role === "trainer") {
    quickLinks.splice(2, 1);
  }

  return (
    <View>
      <LinearGradient
        colors={["rgba(91, 43, 155, 0.1)", "rgba(255, 60, 123, 0.1)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.quickLinksContainer}
      >
        <MaskedView
          maskElement={<Text style={styles.quickLinksTitle}>Quick Links</Text>}
        >
          <LinearGradient
            colors={["#5B2B9B", "#FF3C7B"]}
            start={{ x: 1, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ justifyContent: "center" }}
          >
            <Text style={[{ opacity: 0 }, styles.quickLinksTitle]}>
              Quick Links
            </Text>
          </LinearGradient>
        </MaskedView>
      </LinearGradient>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {quickLinks.map((link) => (
          <TouchableOpacity
            key={link.id}
            style={styles.linkItem}
            onPress={() => router.push(link.path)}
          >
            <View style={styles.iconContainer2}>
              <Image source={link.icon} style={styles.icon2} />
              <Text style={styles.linkTitle}>{link.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const DailyPassCard = ({ onSetPrice, onViewBookings }) => {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.dailyPassCard}>
        <View style={styles.dailyPassContent}>
          <View style={styles.dailyPassTextContainer}>
            <View
              style={{
                flexDirection: "row",
                gap: 6,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../assets/images/dailypass_tag.png")}
                style={styles.dailyPassImage}
                contentFit="contain"
              />
              <Text style={styles.dailyPassTitle}>Daily Pass & Sessions</Text>
            </View>

            <Text style={styles.dailyPassSubtitle}>
              Set Price, Manage Daily Pass & All Session Bookings
            </Text>
          </View>
          {/* <View style={styles.dailyPassImageContainer}>
            <Image
              source={require("../../assets/images/dailypass.png")}
              style={styles.dailyPassImage}
              contentFit="contain"
            />
          </View> */}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={onSetPrice} activeOpacity={0.8}>
            <LinearGradient
              colors={["#FFFFFF", "#FFFFFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dailyPassButtonWhite}
            >
              <Text style={styles.dailyPassButtonTextWhite}>
                Set Price<Text style={{ color: "#FF0000" }}> * </Text>
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={onViewBookings}>
            <LinearGradient
              colors={["#030A15", "#0154A0"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dailyPassButton}
            >
              <Text style={styles.dailyPassButtonText}>View Bookings</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const PostersCarousel = ({ posters, setShowRewardModal }) => {
  const router = useRouter();
  const loopData = React.useMemo(() => {
    if (posters.length <= 1) return posters;
    return [posters[posters.length - 1], ...posters, posters[0]];
  }, [posters]);

  const [activeIndex, setActiveIndex] = useState(1);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(width)).current;
  const isScrolling = useRef(false);
  const autoScrollTimer = useRef(null);
  const transitionTimers = useRef([]);

  useEffect(() => {
    if (posters.length <= 1) return;

    autoScrollTimer.current = setInterval(() => {
      if (!isScrolling.current && flatListRef.current) {
        const nextIndex = activeIndex + 1;
        if (nextIndex < loopData.length) {
          try {
            flatListRef.current.scrollToIndex({
              animated: true,
              index: nextIndex,
            });
          } catch (error) {}
        }
      }
    }, 3000);

    return () => {
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
    };
  }, [activeIndex, posters.length, loopData.length]);

  useEffect(() => {
    if (posters.length <= 1 || loopData.length <= 1) return;

    const listener = scrollX.addListener(({ value }) => {
      const index = Math.round(value / width);

      if (index === loopData.length - 1 && !isScrolling.current) {
        const timer = setTimeout(() => {
          isScrolling.current = true;
          if (flatListRef.current) {
            try {
              flatListRef.current.scrollToIndex({
                animated: false,
                index: 1,
              });
              setActiveIndex(1);
              const innerTimer = setTimeout(() => {
                isScrolling.current = false;
              }, 50);
              transitionTimers.current.push(innerTimer);
            } catch (error) {
              isScrolling.current = false;
            }
          }
        }, 100);
        transitionTimers.current.push(timer);
      } else if (index === 0 && !isScrolling.current) {
        const timer = setTimeout(() => {
          isScrolling.current = true;
          if (flatListRef.current) {
            const targetIndex = loopData.length - 2;
            if (targetIndex >= 0 && targetIndex < loopData.length) {
              try {
                flatListRef.current.scrollToIndex({
                  animated: false,
                  index: targetIndex,
                });
                setActiveIndex(targetIndex);
                const innerTimer = setTimeout(() => {
                  isScrolling.current = false;
                }, 50);
                transitionTimers.current.push(innerTimer);
              } catch (error) {
                isScrolling.current = false;
              }
            }
          }
        }, 100);
        transitionTimers.current.push(timer);
      }
    });

    return () => {
      scrollX.removeListener(listener);
      transitionTimers.current.forEach((timer) => clearTimeout(timer));
      transitionTimers.current = [];
    };
  }, [posters.length, loopData.length]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        if (isScrolling.current || !event?.nativeEvent) return;

        const slideIndex = Math.round(
          event.nativeEvent.contentOffset.x / width,
        );

        if (
          slideIndex !== activeIndex &&
          slideIndex >= 0 &&
          slideIndex < loopData.length
        ) {
          setActiveIndex(slideIndex);
        }
      },
    },
  );

  const onScrollBeginDrag = () => {
    isScrolling.current = true;
  };

  const onScrollEndDrag = () => {
    setTimeout(() => {
      isScrolling.current = false;
    }, 100);
  };

  const renderItem = ({ item }) => {
    // Handle both local images (require()) and remote URLs (strings)
    const imageSource =
      typeof item?.url === "string" ? { uri: item.url } : item?.url;

    return (
      <TouchableOpacity
        onPress={() => {
          if (item.type === "manual") {
            // Manual posters don't navigate anywhere
            return;
          }
          if (item.redirect) {
            setShowRewardModal(true);
          } else if (item.type) {
            if (
              [
                "couplemembership",
                "pt",
                "plans",
                "buddy",
                "dailypass",
                "session",
                "nocostemi",
              ].includes(item.type)
            ) {
              const typeToTabMap = {
                plans: "membership",
                couplemembership: "couple",
                buddy: "buddy",
                pt: "pt",
                dailypass: "membership",
                session: "zumba",
                nocostemi: "membership",
              };
              router.push({
                pathname: "/owner/createPlans",
                params: { tab: typeToTabMap[item.type] },
              });
            } else if (item.type === "clients") {
              router.push("/owner/clientform");
            } else if (item.type === "biometric") {
              router.push("/owner/biometric");
            }
          }
        }}
      >
        <View style={styles.posterSlideOuter}>
          <View style={styles.posterSlide}>
            <Image
              source={imageSource}
              style={styles.posterImage}
              contentFit="cover"
            />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderIndicators = () => {
    if (posters.length <= 1) return null;

    return (
      <View style={styles.posterIndicatorContainer}>
        {posters.map((_, index) => {
          let realActiveIndex = activeIndex - 1;
          if (activeIndex === 0) realActiveIndex = posters.length - 1;
          if (activeIndex === loopData.length - 1) realActiveIndex = 0;

          const isActive = index === realActiveIndex;

          return (
            <View
              key={index}
              style={[
                styles.posterIndicator,
                {
                  width: isActive ? 20 : 10,
                  backgroundColor: isActive ? "#024786" : "#CCCCCC",
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  useEffect(() => {
    let initTimer = null;
    if (posters.length > 1 && loopData.length > 1) {
      initTimer = setTimeout(() => {
        if (flatListRef.current) {
          try {
            flatListRef.current.scrollToIndex({
              animated: false,
              index: 1,
            });
          } catch (error) {}
        }
      }, 100);
    }

    return () => {
      if (initTimer) clearTimeout(initTimer);
      if (autoScrollTimer.current) {
        clearInterval(autoScrollTimer.current);
        autoScrollTimer.current = null;
      }
      transitionTimers.current.forEach((timer) => clearTimeout(timer));
      transitionTimers.current = [];
    };
  }, []);

  return (
    <View style={styles.posterContainer}>
      <FlatList
        ref={flatListRef}
        data={loopData}
        renderItem={renderItem}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEndDrag}
        scrollEventThrottle={16}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.posterFlatlistContent}
        getItemLayout={(data, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      {renderIndicators()}
    </View>
  );
};

const RegistrationCompletionCard = ({
  percentage,
  isExpanded,
  onToggleExpand,
  registrationSteps,
  servicesOld,
}) => {
  const router = useRouter();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState({ title: "", content: "" });

  // Helper function to navigate and store flag for expanded state
  const navigateToRegistrationStep = async (route) => {
    await AsyncStorage.setItem("fromRegistrationStep", "true");
    router.push(route);
  };

  const registrationItems = [
    ...(servicesOld
      ? [
          {
            id: "services",
            title: "Gym Services",
            completed: registrationSteps?.services || false,
            action: () =>
              navigateToRegistrationStep("/owner/(digital)/services"),
            info: {
              title: "Why Gym Services?",
              content:
                "Listing your available services (personal training, group classes, equipment types, etc.) allows Fymble users to find gyms that match their specific fitness needs, leading to better user satisfaction and higher booking rates.",
            },
          },
        ]
      : [
          {
            id: "gym_pic",
            title: "Gym Location",
            completed: registrationSteps?.gym_pic || false,
            action: () =>
              navigateToRegistrationStep("/owner/(digital)/gymlocation"),
            info: {
              title: "Why Gym Location?",
              content:
                "Setting your gym's location with a photo helps us list your gym on the Fymble App's Fitness Studios page. This allows clients to discover your gym, book memberships, daily passes, and sessions, and easily navigate to your location using accurate GPS coordinates.",
            },
          },
        ]),
    {
      id: "operating_hours",
      title: "Operating Hours",
      completed: registrationSteps?.operating_hours || false,
      action: () => navigateToRegistrationStep("/owner/(digital)/hours"),
      info: {
        title: "Why Operating Hours?",
        content:
          "Displaying your gym's operating hours helps Fymble users plan their workouts and choose the most convenient time slots. Accurate timing information improves user experience and booking efficiency.",
      },
    },
    {
      id: "account_details",
      title: "Account Details",
      completed: registrationSteps?.account_details || false,
      action: () => navigateToRegistrationStep("/owner/(digital)/account"),
      info: {
        title: "Why Account Details?",
        content:
          "Fymble Business requires your account details to facilitate seamless payment transfers for bookings made through our platform, including daily gym passes, sessions, and gym memberships. Rest assured, your information is encrypted and securely stored—we never share your details with third parties.",
      },
    },
    {
      id: "onboarding_pics",
      title: "Gym Pictures",
      completed: (() => {
        const pics = registrationSteps?.onboarding_pics;
        if (!pics) return false;

        // Handle both array and object structure
        let uploadedCount = 0;
        if (Array.isArray(pics)) {
          uploadedCount = pics.reduce((count, picObj) => {
            const values = Object.values(picObj);
            return count + values.filter((val) => val === true).length;
          }, 0);
        } else {
          uploadedCount = [
            pics.machinery_1,
            pics.machinery_2,
            pics.treadmill_area,
            pics.cardio_area,
            pics.dumbell_area,
            pics.reception_area,
          ].filter(Boolean).length;
        }

        return uploadedCount >= 3;
      })(),
      action: () => navigateToRegistrationStep("/owner/gympics"),
      info: {
        title: "Why Gym Pictures?",
        content:
          "High-quality images of your gym help Fymble users get a comprehensive view of your facilities, equipment, and ambiance. Professional photos significantly increase user engagement and booking conversion rates.",
      },
    },
    {
      id: "documents",
      title: "Document Upload",
      completed: (() => {
        const docs = registrationSteps?.documents;
        if (!docs) return false;

        // Handle both array and object structure
        if (Array.isArray(docs)) {
          const hasPancard = docs.some((doc) => doc.pancard === true);
          const hasPassbook = docs.some((doc) => doc.passbook === true);
          return hasPancard && hasPassbook;
        } else {
          return docs.pancard && docs.passbook;
        }
      })(),
      action: () => navigateToRegistrationStep("/owner/(digital)/document"),
      info: {
        title: "Why Documents?",
        content:
          "Document verification is essential for validating your account details and facilitating TDS (Tax Deducted at Source) claims as per regulatory requirements. This ensures compliance and smooth financial transactions.",
      },
    },
    {
      id: "agreement",
      title: "Terms & Conditions",
      completed: registrationSteps?.agreement || false,
      action: () => navigateToRegistrationStep("/owner/agreement"),
      info: {
        title: "Why Terms & Conditions?",
        content:
          "Digital partnership Terms & Conditions with Fymble Business covering platform access, payment terms, and service standards.",
      },
    },
  ];

  const handleInfoPress = (info) => {
    setSelectedInfo(info);
    setShowInfoModal(true);
  };

  return (
    <View style={styles.registrationCard}>
      <TouchableOpacity
        style={styles.registrationHeader}
        onPress={onToggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.registrationHeaderLeft}>
          <View style={styles.registrationHeaderText}>
            <Text style={styles.registrationTitle}>
              Complete Your Registration
            </Text>
            <Text style={styles.registrationSubtitle}>
              {percentage}% completed
            </Text>
          </View>
        </View>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={24}
          color="#666"
        />
      </TouchableOpacity>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={["#030A15", "#0154A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBarFill, { width: `${percentage}%` }]}
          />
        </View>
      </View>

      {isExpanded && (
        <View style={styles.registrationItemsContainer}>
          {registrationItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.registrationItem,
                index === registrationItems.length - 1 &&
                  styles.registrationItemLast,
              ]}
            >
              <TouchableOpacity
                style={styles.registrationItemContent}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={styles.registrationItemLeft}>
                  <View
                    style={[
                      styles.registrationCheckbox,
                      item.completed && styles.registrationCheckboxCompleted,
                    ]}
                  >
                    {item.completed && (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.registrationItemText,
                      item.completed && styles.registrationItemTextCompleted,
                    ]}
                  >
                    {item.title}
                  </Text>
                  <TouchableOpacity
                    style={styles.infoIconButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleInfoPress(item.info);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={18}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </View>
          ))}
        </View>
      )}

      {/* Info Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalHeader}>
              <Ionicons name="information-circle" size={28} color="#FF5757" />
              <Text style={styles.infoModalTitle}>{selectedInfo.title}</Text>
            </View>
            <Text style={styles.infoModalContent}>{selectedInfo.content}</Text>
            <TouchableOpacity
              style={styles.infoModalButton}
              onPress={() => setShowInfoModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.infoModalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const OverViewTabs = ({
  attendanceData,
  role,
  membersData,
  invoiceData,
  aboutToExpireList,
  expiredMembersList,
  attendanceChartData,
  onLoadMoreAttendance,
  hasMoreAttendanceData = false,
  isLoadingAttendance = false,
  onRefreshAttendance,
  isRefreshingAttendance = false,
  bdayClients,
  posters,
  registrationSteps,
  prefilledAgreement,
  onAgreementClicked,
  oldGym,
  servicesOld,
  bookingCounts,
  openDailyPassScanner,
}) => {
  const {
    visible: showUpdateModal,
    info: updateInfo,
    handleUpdate,
  } = useForceUpdate();

  const router = useRouter();
  const insets = useSafeAreaInsets();

  // QR Scanner state
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const isScanningRef = useRef(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
  });
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [isRegistrationExpanded, setIsRegistrationExpanded] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Check if user is coming from a registration step page
  useEffect(() => {
    const checkRegistrationNavigation = async () => {
      try {
        const fromRegistrationStep = await AsyncStorage.getItem(
          "fromRegistrationStep",
        );
        if (fromRegistrationStep === "true") {
          setIsRegistrationExpanded(true);
          await AsyncStorage.removeItem("fromRegistrationStep");
        }
      } catch (error) {}
    };
    checkRegistrationNavigation();
  }, []);

  // Auto-open daily pass scanner when navigated from clientform
  const hasOpenedDailyPassScanner = useRef(false);
  useEffect(() => {
    if (
      openDailyPassScanner === "true" &&
      !hasOpenedDailyPassScanner.current
    ) {
      hasOpenedDailyPassScanner.current = true;
      // Small delay to ensure component is fully mounted
      setTimeout(() => {
        handleScanPress();
      }, 500);
    }
  }, [openDailyPassScanner]);

  const attendanceDataToUse = attendanceData || {
    current: 0,
    expected: 0,
    names: [],
  };

  const invoiceDataToUse = invoiceData || { send: [], unsend: [] };

  // Calculate registration completion percentage
  const calculateRegistrationCompletion = () => {
    if (!registrationSteps)
      return { percentage: 40, completedCount: 0, totalCount: 6 };

    const pics = registrationSteps?.onboarding_pics;
    let uploadedPicsCount = 0;

    if (pics) {
      if (Array.isArray(pics)) {
        uploadedPicsCount = pics.reduce((count, picObj) => {
          const values = Object.values(picObj);
          return count + values.filter((val) => val === true).length;
        }, 0);
      } else {
        uploadedPicsCount = [
          pics.machinery_1,
          pics.machinery_2,
          pics.treadmill_area,
          pics.cardio_area,
          pics.dumbell_area,
          pics.reception_area,
        ].filter(Boolean).length;
      }
    }

    // Check documents completion
    const docs = registrationSteps?.documents;
    let docsCompleted = false;
    if (docs) {
      if (Array.isArray(docs)) {
        const hasPancard = docs.some((doc) => doc.pancard === true);
        const hasPassbook = docs.some((doc) => doc.passbook === true);
        docsCompleted = hasPancard && hasPassbook;
      } else {
        docsCompleted = docs.pancard && docs.passbook;
      }
    }

    const steps = [
      registrationSteps.account_details,
      registrationSteps.agreement,
      docsCompleted,
      uploadedPicsCount >= 3,
      registrationSteps.operating_hours,
      servicesOld ? registrationSteps.services : registrationSteps.gym_pic,
    ];

    const completedCount = steps.filter(Boolean).length;
    const basePercentage = 40;
    const stepPercentage = 10;
    const percentage = basePercentage + completedCount * stepPercentage;

    return { percentage, completedCount, totalCount: 6 };
  };

  const {
    percentage: registrationPercentage,
    completedCount,
    totalCount,
  } = calculateRegistrationCompletion();

  // Check if registration is 100% complete and show modal once
  useEffect(() => {
    const checkCompletionModal = async () => {
      if (registrationPercentage === 100) {
        const gymId = await getToken("gym_id");
        const modalShownKey = `registration_complete_shown_${gymId}`;
        const alreadyShown = await AsyncStorage.getItem(modalShownKey);

        if (!alreadyShown) {
          setShowCompletionModal(true);
          await AsyncStorage.setItem(modalShownKey, "true");
        }
      }
    };

    checkCompletionModal();
  }, [registrationPercentage]);

  useBackHandler();

  const handleScanPress = async () => {
    if (!permission) {
      const { granted } = await requestPermission();
      if (!granted) {
        showToast({
          type: "error",
          title: "Camera permission is required to scan QR codes",
        });
        return;
      }
    } else if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        showToast({
          type: "error",
          title: "Camera permission is required to scan QR codes",
        });
        return;
      }
    }
    setIsScannerVisible(true);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (isScanning || isScanningRef.current) return;
    isScanningRef.current = true;
    setIsScanning(true);
    try {
      const gymId = await getToken("gym_id");
      if (!gymId) {
        showToast({
          type: "error",
          title: "Unable to get gym information",
        });
        isScanningRef.current = false;
        setIsScanning(false);
        return;
      }

      // Parse QR code data to determine type
      let qrData;
      let response;

      try {
        qrData = JSON.parse(data);
      } catch (parseError) {
        showToast({
          type: "error",
          title: "Invalid QR Code",
          desc: "Unable to read QR code data. Please try again.",
        });
        isScanningRef.current = false;
        setIsScanning(false);
        setIsScannerVisible(false);
        return;
      }

      // Check if this is a membership QR code
      if (qrData.mode === "membership") {
        setAlertConfig({
          title: "Membership Plan",
          message:
            "This is a Membership Plan QR code, not a Daily Pass or Fitness Class. Please use the Membership Scanner to scan this QR code.",
          showMembershipButton: true,
        });
        setShowAlertModal(true);
        setIsScannerVisible(false);
        isScanningRef.current = false;
        setIsScanning(false);
        return;
      }

      // Handle based on type
      if (qrData.type === "daily_pass") {
        // Daily Pass QR Code
        const payload = {
          day_id: qrData.day_id,
          gym_id: Number(gymId),
        };
        response = await scanVerifyDailyPassAPI(payload);
      } else if (qrData.type === "sessions") {
        // Sessions QR Code
        const payload = {
          checkin_token: qrData.checkin_token,
          gym_id: Number(gymId),
        };
        response = await scanSessionsQR(payload);
      } else {
        showToast({
          type: "error",
          title: "Please Scan a Valid QR Code",
        });
        isScanningRef.current = false;
        setIsScanning(false);
        setIsScannerVisible(false);
        return;
      }

      // Handle different response statuses
      if (response?.status === 409) {
        // Pass is for different date
        setAlertConfig({
          title: "Wrong Date",
          message:
            "This pass is valid for a different date. Please check the pass validity and try again.",
        });
        setShowAlertModal(true);
        setIsScannerVisible(false);
      } else if (response?.status === 403) {
        // Pass is for different gym
        setAlertConfig({
          title: "Different Gym",
          message:
            "This pass was purchased from a different gym. You cannot use this pass at your gym.",
        });
        setShowAlertModal(true);
        setIsScannerVisible(false);
      } else if (response?.already_attended) {
        // Pass already used/expired
        setAlertConfig({
          title: "Pass Already Used",
          message:
            "This pass has already been used and is now expired. Please purchase a new pass.",
        });
        setShowAlertModal(true);
        setIsScannerVisible(false);
      } else if (response?.status === 200 || response?.ok) {
        // Success
        showToast({
          type: "success",
          title: "Check-in Successful",
          desc: response.message || "Client checked in successfully",
        });
        setIsScannerVisible(false);

        // Route based on QR code type
        setTimeout(() => {
          if (response?.session_id) {
            router.push({
              pathname: "/owner/dailyPassSessions",
              params: { preSelectedSession: response.session_id },
            });
          } else {
            router.push("/owner/dailyPassSessions");
          }
        }, 1000);
      } else {
        const errorMessage =
          response?.detail || response?.message || "Scan verification failed";
        showToast({
          type: "error",
          title: "Scan Failed",
          desc: errorMessage,
        });
      }
    } catch (error) {
      console.error("Scan error:", error);
      showToast({
        type: "error",
        title: "Error processing QR code",
        desc: error.message || "Please try again",
      });
    } finally {
      isScanningRef.current = false;
      setIsScanning(false);
      setTimeout(() => {
        setIsScannerVisible(false);
      }, 1000);
    }
  };

  return (
    <>
      <ForceUpdateModal
        visible={showUpdateModal}
        info={updateInfo}
        onUpdate={handleUpdate}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {!oldGym && registrationSteps && registrationPercentage < 100 && (
          <View style={styles.sectionContainer}>
            <RegistrationCompletionCard
              percentage={registrationPercentage}
              isExpanded={isRegistrationExpanded}
              onToggleExpand={() =>
                setIsRegistrationExpanded(!isRegistrationExpanded)
              }
              registrationSteps={registrationSteps}
              servicesOld={servicesOld}
            />
          </View>
        )}

        {bdayClients && bdayClients.length > 0 && (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.birthdayCard}
              onPress={() =>
                router.push({
                  pathname: "/owner/birthdayClientsPage",
                  params: {
                    bdayClients: JSON.stringify(bdayClients),
                  },
                })
              }
            >
              <LinearGradient
                colors={["#FFFFFF", "#FFFFFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.birthdayGradient}
              >
                <View style={styles.birthdayContent}>
                  <View style={styles.birthdayIconContainer}>
                    <Ionicons name="gift" size={32} color="#FF5757" />
                  </View>
                  <View style={styles.birthdayTextContainer}>
                    <Text style={styles.birthdayTitle}>
                      Today's Birthdays 🎉
                    </Text>
                    <Text style={styles.birthdaySubtitle}>
                      {bdayClients.length}{" "}
                      {bdayClients.length === 1 ? "client" : "clients"}{" "}
                      celebrating today
                    </Text>
                  </View>
                  <View style={styles.birthdayArrowContainer}>
                    <Ionicons
                      name="chevron-forward"
                      size={24}
                      color="rgba(0, 0, 0, 0.8)"
                    />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Prefilled Agreement Download Card */}
        {prefilledAgreement?.show && (
          <TouchableOpacity
            style={styles.agreementDownloadCard}
            onPress={onAgreementClicked}
            activeOpacity={0.7}
          >
            <Image
              source={require("../../assets/images/pdf.png")}
              style={styles.agreementPdfIcon}
              contentFit="contain"
            />
            <View style={styles.agreementTextContainer}>
              <Text style={styles.agreementTitle}>
                Gym Onboarding PDF is ready to download
              </Text>
            </View>
            <View style={styles.downloadIconWrapper}>
              <Image
                source={require("../../assets/images/download_circle.png")}
                style={styles.agreementDownloadCircle}
                contentFit="contain"
              />
              <Image
                source={require("../../assets/images/download.png")}
                style={styles.agreementDownloadArrow}
                contentFit="contain"
              />
            </View>
          </TouchableOpacity>
        )}

        {posters && posters.length > 0 && (
          <PostersCarousel
            posters={posters}
            setShowRewardModal={setShowRewardModal}
          />
        )}

        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={handleScanPress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#F3F4F6", "#F3F4F6"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scannerGradient}
            >
              <View style={styles.scannerButtonContent}>
                <View style={styles.scannerIconContainer}>
                  <Ionicons name="qr-code-outline" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.scannerTextContainer}>
                  <Text style={styles.scannerButtonTitle}>
                    Scan Daily Pass & Fitness Class Pass
                  </Text>
                  <Text style={styles.scannerButtonSubtitle}>
                    Quick Client Check-In with QR code
                  </Text>
                </View>
                <View style={{ marginLeft: "auto" }}>
                  <Ionicons name="chevron-forward" size={20} color="#002D60" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionContainer}>
          <TouchableOpacity
            style={styles.scannerButton}
            onPress={() =>
              router.push({
                pathname: "/owner/clientform",
                params: { openScanner: "true" },
              })
            }
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#002D60", "#002D60"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.scannerGradient}
            >
              <View style={styles.scannerButtonContent}>
                <View
                  style={[
                    styles.scannerIconContainer,
                    { backgroundColor: "#FFFFFF" },
                  ]}
                >
                  <Ionicons name="qr-code-outline" size={14} color="#002D60" />
                </View>
                <View style={styles.scannerTextContainer}>
                  <Text
                    style={[styles.scannerButtonTitle, { color: "#FFFFFF" }]}
                  >
                    Scan Membership & PT Bookings
                  </Text>
                  <Text
                    style={[styles.scannerButtonSubtitle, { color: "#FFFFFF" }]}
                  >
                    Quick Client Check-In with QR code
                  </Text>
                </View>
                <View style={{ marginLeft: "auto" }}>
                  <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* View Today's Bookings Header Card */}
        {(bookingCounts?.dailypass > 0 ||
          bookingCounts?.sessions > 0 ||
          bookingCounts?.membership > 0) && (
          <>
            <View style={styles.sectionContainer}>
              <LinearGradient
                colors={["#F5F5F5", "#F5F5F5", "#F5F5F5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.todayBookingsHeaderCard}
              >
                <View style={styles.todayBookingsHeader}>
                  <Ionicons name="calendar-outline" size={20} color="#002D60" />
                  <Text style={styles.todayBookingsTitle}>
                    View Today's Bookings
                  </Text>
                </View>
              </LinearGradient>
            </View>

            {/* Booking Types Row */}
            <View style={styles.sectionContainer}>
              <View style={styles.bookingTypesRow}>
                <TouchableOpacity
                  style={styles.bookingTypeCard}
                  activeOpacity={0.7}
                  onPress={() => router.push("/owner/sessionBookings")}
                >
                  <View style={styles.bookingTypeTextContainer}>
                    <Text style={styles.bookingTypeLabel}>Daily Pass</Text>
                    <Text style={styles.bookingTypeCount}>
                      {bookingCounts?.dailypass || 0} Bookings
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookingTypeCard}
                  activeOpacity={0.7}
                  onPress={() => router.push("/owner/sessionBookings")}
                >
                  <View style={styles.bookingTypeTextContainer}>
                    <Text style={styles.bookingTypeLabel}>Sessions</Text>
                    <Text style={styles.bookingTypeCount}>
                      {bookingCounts?.sessions || 0} Bookings
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.bookingTypeCard}
                  activeOpacity={0.7}
                  onPress={() => router.push("/owner/membershipBookings")}
                >
                  <View style={styles.bookingTypeTextContainer}>
                    <Text style={styles.bookingTypeLabel}>Membership</Text>
                    <Text style={styles.bookingTypeCount}>
                      {bookingCounts?.membership || 0} Bookings
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <MembershipOverview
          membersData={membersData}
          invoiceData={invoiceDataToUse}
        />

        <QuickLinks router={router} role={role} />

        <MembershipDashboard
          aboutToExpireList={aboutToExpireList}
          expiredMembersList={expiredMembersList}
          attendanceChartData={attendanceChartData}
        />

        <Footer />
      </ScrollView>

      {/* QR Scanner Modal */}
      <Modal
        visible={isScannerVisible}
        animationType="slide"
        onRequestClose={() => {
          setIsScannerVisible(false);
          setIsScanning(false);
          isScanningRef.current = false;
        }}
      >
        <View style={styles.scannerContainer}>
          <View style={[styles.scannerHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => {
                setIsScannerVisible(false);
                setIsScanning(false);
                isScanningRef.current = false;
              }}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>
              Scan Daily Pass & Sessions Pass
            </Text>
          </View>

          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={isScanning ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <View style={styles.scannerOverlay}>
              <View style={styles.scannerFrame} />
            </View>
          </View>

          <View style={styles.scannerInstructions}>
            <Ionicons name="information-circle" size={24} color="#007AFF" />
            <Text style={styles.instructionText}>
              Position the QR code within the frame to scan
            </Text>
          </View>

          {isScanning && (
            <View style={styles.scanningIndicator}>
              <HomeSkeleton />
              <Text style={styles.scanningText}>Processing...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* Alert Modal for Different Gym / Wrong Date / Already Used */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAlertModal}
        onRequestClose={() => setShowAlertModal(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContainer}>
            <View style={styles.alertIconContainer}>
              <MaterialCommunityIcons
                name="alert-circle"
                size={60}
                color="#FF3B30"
              />
            </View>

            <Text style={styles.alertTitle}>{alertConfig.title}</Text>

            <Text style={styles.alertMessage}>{alertConfig.message}</Text>

            {alertConfig.showMembershipButton ? (
              <View style={{ width: "100%", gap: 10 }}>
                <TouchableOpacity
                  style={[styles.alertButton, { backgroundColor: "#007BFF" }]}
                  onPress={() => {
                    setShowAlertModal(false);
                    router.push({
                      pathname: "/owner/clientform",
                      params: { openScanner: "true" },
                    });
                  }}
                >
                  <Text style={styles.alertButtonText}>
                    Open Membership Scanner
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.alertButton,
                    {
                      backgroundColor: "#F3F4F6",
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                    },
                  ]}
                  onPress={() => setShowAlertModal(false)}
                >
                  <Text style={[styles.alertButtonText, { color: "#374151" }]}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setShowAlertModal(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Registration Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.completionModalOverlay}>
          <View style={styles.completionModalContainer}>
            <View style={styles.completionIconContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
            </View>
            <Text style={styles.completionTitle}>Thank You!</Text>
            <Text style={styles.completionMessage}>
              Your gym registration is complete. After final checks, your gym
              will go live very soon.
            </Text>
            <TouchableOpacity
              style={styles.completionButton}
              onPress={() => setShowCompletionModal(false)}
            >
              <Text style={styles.completionButtonText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  scrollViewContent: {
    backgroundColor: "#FFFFFF",
    marginTop: width >= 786 ? 25 : Platform.OS === "ios" ? 30 : 20,
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  registrationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    paddingVertical: 8,
  },
  registrationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  registrationHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  registrationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  registrationHeaderText: {
    flex: 1,
  },
  registrationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  registrationSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  registrationItemsContainer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 12,
  },
  registrationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  registrationItemLast: {
    borderBottomWidth: 0,
  },
  registrationItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  registrationCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#DDD",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  registrationCheckboxCompleted: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  registrationItemText: {
    fontSize: 15,
    color: "#333",
  },
  registrationItemTextCompleted: {
    color: "#666",
    textDecorationLine: "line-through",
  },
  registrationItemContent: {
    flex: 1,
  },
  infoIconButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  infoModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  infoModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 12,
    flex: 1,
  },
  infoModalContent: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 20,
  },
  infoModalButton: {
    backgroundColor: "#FF5757",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  infoModalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  rewardsSection: {
    width: width,
    height: width >= 786 ? 180 : 150,
    marginBottom: 20,
  },
  rewardsImage: {
    width: "100%",
    height: "100%",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  attendanceContainer: {
    marginBottom: 16,
  },
  attendanceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 5,
  },
  cardHeaderTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
    width: "100%",
    paddingHorizontal: 15,
    marginTop: -20,
  },
  attendanceLeftSection: {
    width: width >= 786 ? "70%" : "60%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  attendanceRightSection: {
    width: width >= 786 ? "20%" : "33%",
    flexDirection: "row",
    alignItems: "center",
  },
  circularProgressContainer: {
    width: "32%",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },
  progressTextContainer: {
    width: width >= 786 ? 150 : 80,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007AFF",
  },
  attendanceStats: {
    flexDirection: "column",
    marginLeft: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 5,
    borderRadius: 8,
    width: "95%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    backgroundColor: "white",
    paddingVertical: 2,
    paddingHorizontal: 5,
  },
  trophyIcon: {
    width: width >= 786 ? 24 : 15,
    height: width >= 786 ? 24 : 15,
  },
  statLabel: {
    fontSize: width >= 786 ? 16 : 11,
    color: "#666",
    marginRight: 6,
  },
  statValue: {
    fontSize: width >= 786 ? 18 : 14,
    fontWeight: "bold",
    color: "#333",
  },
  comparisonText: {
    fontSize: 12,
    color: "#aaa",
    fontStyle: "italic",
    fontWeight: "500",
  },
  attendanceImage: {
    width: width >= 786 ? 140 : 130,
    height: width >= 786 ? 150 : 120,
  },
  noDataCard: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  noDataText: {
    textAlign: "center",
    color: "#666",
    fontSize: 16,
  },
  noClientLink: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  fullScreenHeader: {
    paddingTop: StatusBar.currentHeight + 10,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: "white",
    transform: [{ rotate: "180deg" }],
  },
  headerTitleContainer: {
    flex: 1,
  },
  fullScreenTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  titleMask: {
    justifyContent: "center",
  },
  attendanceCount: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  fullScreenContent: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  attendanceList: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
    justifyContent: "center",
  },
  attendanceListItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  profileImageContainer: {
    marginRight: 12,
  },
  profileImageGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  defaultProfileContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  defaultProfileText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  nameContainer: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 12,
    color: "#666",
  },
  timeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  timeIconContainer: {
    marginRight: 8,
  },
  timeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timeDetails: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    color: "#666",
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  pendingTime: {
    color: "#999",
    fontStyle: "italic",
  },
  separator: {
    height: 12,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyImage: {
    width: 120,
    height: 120,
    opacity: 0.5,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    borderWidth: Platform.OS === "ios" ? 1 : 0,
    borderColor: "#ddd",
  },
  cardHeader: {
    height: 40,
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    paddingHorizontal: 12,
    justifyContent: "center",
    height: 40,
  },
  cardTitle: {
    color: "white",
    fontSize: width >= 786 ? 18 : 14,
    textAlign: "center",
  },
  cardBody: {
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  cardValue: {
    fontSize: 28,
    fontWeight: 500,
    color: "#333",
  },
  cardDescription: {
    fontSize: width >= 786 ? 16 : 12,
    color: "#777",
    marginTop: 8,
    paddingHorizontal: 15,
  },
  cardIcon: {
    width: width >= 786 ? 80 : 60,
    height: width >= 786 ? 80 : 60,
  },
  quickLinksContainer: {
    marginTop: 16,
    backgroundColor: "#f8f0ff",
    borderRadius: 0,
    padding: 16,
  },
  quickLinksTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  linkItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 110,
  },
  iconContainer2: {
    backgroundColor: "#F5F7FF",
    borderRadius: 12,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 8,
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  icon2: {
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  linkTitle: {
    fontSize: 12,
    textAlign: "center",
    color: "#555",
    marginTop: 4,
  },
  navigationIconContainer: {
    position: "absolute",
    top: 80,
    right: -18,
    alignSelf: "center",
    height: 35,
    width: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  navIconBackground: {
    width: 35,
    height: 35,
    borderRadius: 50,
  },
  navIconWrapper: {
    width: 35,
    height: 35,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  navigationIcon: {
    width: 20,
    height: 20,
  },
  modernHeader: {
    paddingTop: StatusBar.currentHeight + 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modernHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernBackIcon: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  modernHeaderInfo: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  modernStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modernStatBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modernStatNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  modernStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  modernContent: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  modernList: {
    padding: 16,
  },
  modernEmptyList: {
    flex: 1,
    justifyContent: "center",
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  modernProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernAvatarWrapper: {
    marginRight: 12,
  },
  modernAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modernAvatarDefault: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5383b",
  },
  modernNameSection: {
    flex: 1,
  },
  modernMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  modernMemberSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  modernTimeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  modernTimeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 3,
    minWidth: 75,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modernTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTimeTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalise",
    letterSpacing: 0.5,
  },
  modernTimeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  modernPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  modernSeparator: {
    height: 12,
  },
  modernFooterLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  modernLoadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modernEmptyIconText: {
    fontSize: 32,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  modernHeader: {
    paddingTop: StatusBar.currentHeight + 15,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modernHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    paddingBottom: 5,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernBackIcon: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  modernHeaderInfo: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  modernStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modernStatBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modernStatNumber: {
    fontSize: 14,
    fontWeight: "700",
    color: "white",
  },
  modernStatLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "500",
  },
  modernContent: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  modernList: {
    padding: 16,
  },
  modernEmptyList: {
    flex: 1,
    justifyContent: "center",
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  modernProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernAvatarWrapper: {
    marginRight: 12,
  },
  modernAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modernAvatarDefault: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5383b",
  },
  modernNameSection: {
    flex: 1,
  },
  modernMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  modernMemberSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  modernTimeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  modernTimeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 3,
    minWidth: 75,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modernTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTimeTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalise",
    letterSpacing: 0.5,
  },
  modernTimeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  modernPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  modernSeparator: {
    height: 12,
  },
  modernFooterLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  modernLoadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modernEmptyIconText: {
    fontSize: 32,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  modernHeader: {
    paddingBottom: 20,
    paddingHorizontal: 20,
    paddingTop: 50,
    // marginTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modernHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernBackButton: {
    width: 30,
    height: 30,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // elevation: 3,
  },
  modernBackIcon: {
    fontSize: 18,
    color: "white",
    fontWeight: "600",
  },
  modernHeaderInfo: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 8,
  },
  modernStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  modernStatBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  modernStatNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#000000",
  },
  modernStatLabel: {
    fontSize: 10,
    color: "rgba(0, 0, 0, 0.9)",
    fontWeight: "500",
  },
  modernContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  modernList: {
    padding: 16,
  },
  modernEmptyList: {
    flex: 1,
    justifyContent: "center",
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
  modernProfileContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernAvatarWrapper: {
    marginRight: 12,
  },
  modernAvatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  modernAvatarDefault: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  modernAvatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#e5383b",
  },
  modernNameSection: {
    flex: 1,
  },
  modernMemberName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  modernMemberSubtitle: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  modernTimeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  modernTimeCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingHorizontal: 5,
    paddingVertical: 3,
    minWidth: 75,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modernTimeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 4,
  },
  modernStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  modernTimeTitle: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    textTransform: "capitalise",
    letterSpacing: 0.5,
  },
  modernTimeValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  modernPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  modernSeparator: {
    height: 12,
  },
  modernFooterLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  modernLoadingText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  modernEmptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  modernEmptyIcon: {
    width: 80,
    height: 80,
    backgroundColor: "rgba(102, 126, 234, 0.1)",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modernEmptyIconText: {
    fontSize: 32,
  },
  modernEmptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 8,
  },
  modernEmptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
  modernAttendanceItem: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 10,
    flexDirection: "column",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },

  attendanceMainContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  sessionCountText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "500",
    fontStyle: "italic",
  },
  dropdownButton: {
    width: 25,
    height: 25,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    transform: [{ rotate: "0deg" }],
  },
  dropdownArrowExpanded: {
    transform: [{ rotate: "180deg" }],
    color: "#e5383b",
  },
  expandedSessionsContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    width: "100%",
  },
  allSessionsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  sessionNumber: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
    minWidth: 70,
  },
  sessionTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  sessionTimeItem: {
    alignItems: "center",
    minWidth: 60,
  },
  sessionTimeLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
    marginBottom: 2,
  },
  sessionTimeValue: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1E293B",
  },
  sessionPendingText: {
    color: "#94A3B8",
    fontStyle: "italic",
    fontWeight: "500",
  },
  birthdayCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#FF5757",
    // shadowColor: "#000",
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.2,
    // shadowRadius: 8,
    // elevation: 6,
  },
  birthdayGradient: {
    padding: 16,
  },
  birthdayContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  birthdayIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(236, 155, 155, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  birthdayTextContainer: {
    flex: 1,
  },
  birthdayTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 4,
  },
  birthdaySubtitle: {
    fontSize: 14,
    color: "#00000075",
    fontWeight: "500",
  },
  birthdayArrowContainer: {
    marginLeft: 8,
  },
  scannerButton: {
    marginBottom: 10,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 10,
  },
  scannerGradient: {
    borderRadius: 16,
  },
  scannerButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  scannerIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 25,
    backgroundColor: "#002D60",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    overflow: "hidden",
  },
  scannerTextContainer: {
    flex: 1,
  },
  scannerButtonTitle: {
    fontSize: width * 0.036,
    fontWeight: "700",
    color: "#002D60",
    marginBottom: 4,
  },
  scannerButtonSubtitle: {
    fontSize: 12,
    color: "#002D60",
    fontWeight: 400,
  },
  // Today's Bookings Card Styles
  todayBookingsHeaderCard: {
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    padding: 16,
    paddingVertical: 10,
  },
  todayBookingsHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  todayBookingsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#002D60",
    marginLeft: 12,
  },
  bookingTypesRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  bookingTypeCard: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 12,
    paddingVertical: 14,
    paddingHorizontal: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bookingTypeTextContainer: {
    flex: 1,
  },
  bookingTypeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
    marginBottom: 6,
    textAlign: "center",
  },
  bookingTypeCount: {
    fontSize: 12,
    fontWeight: "500",
    color: "#007AFF",
    textAlign: "center",
  },
  // Membership Bookings Card Styles
  membershipBookingsCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#007bff84",
    marginHorizontal: 16,
  },
  membershipBookingsGradient: {
    padding: 16,
  },
  membershipBookingsContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  membershipBookingsIconContainer: {
    marginRight: 16,
  },
  membershipBookingsTextContainer: {
    flex: 1,
  },
  membershipBookingsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  membershipBookingsSubtitle: {
    fontSize: 13,
    color: "#666666",
  },
  membershipBookingsArrowContainer: {
    marginLeft: 8,
  },
  // QR Scanner Modal Styles
  scannerContainer: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scannerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
  },
  closeButton: {
    padding: 8,
    marginRight: 12,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: "#007AFF",
    borderRadius: 12,
    backgroundColor: "transparent",
  },
  scannerInstructions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    gap: 8,
  },
  instructionText: {
    fontSize: 14,
    color: "#FFFFFF",
    textAlign: "center",
  },
  scanningIndicator: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -75 }, { translateY: -75 }],
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 150,
  },
  scanningText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginTop: 12,
  },
  // Alert Modal Styles
  alertModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  alertModalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    width: width * 0.85,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertIconContainer: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButton: {
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
    minWidth: 120,
    alignItems: "center",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  alertButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Reward Modal Styles
  rewardModalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    justifyContent: "center",
  },
  rewardCancelButton: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  rewardCancelButtonText: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
  rewardConfirmButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
    alignItems: "center",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  rewardConfirmButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Carousel Styles
  carouselContainer: {
    marginBottom: 16,
  },
  carouselIndicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    paddingBottom: 0,
  },
  carouselIndicator: {
    height: 6,
    borderRadius: 5,
    marginHorizontal: 4,
  },
  // Daily Pass Card Styles`
  dailyPassCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    // overflow: "hidden",
    // borderWidth: Platform.OS === "ios" ? 1 : 0,
    // borderColor: "#ddd",
    paddingVertical: 10,
  },
  dailyPassContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    // minHeight: 100,
    paddingVertical: 6,
  },
  dailyPassTextContainer: {
    flex: 1,
    paddingRight: 0,
    justifyContent: "center",
  },
  dailyPassTitle: {
    fontSize: width >= 786 ? 15 : 14,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 3,
    lineHeight: 20,
    textAlign: "center",
  },
  dailyPassSubtitle: {
    fontSize: width >= 786 ? 14 : 12,
    color: "#030A15",
    lineHeight: 18,
    marginBottom: 5,
    textAlign: "center",
    paddingVertical: 5,
  },
  dailyPassButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#024786",
    minWidth: 150,
    alignItems: "center",
    // shadowColor: "#000000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.61,
    // shadowRadius: 4,
    // elevation: 5,
  },
  dailyPassButtonWhite: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: "flex-start",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#024786",
    minWidth: 150,
    alignItems: "center",
    // shadowColor: "#000000",
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.61,
    // shadowRadius: 4,
    // elevation: 5,
  },
  dailyPassButtonText: {
    fontSize: width >= 786 ? 14 : 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  dailyPassButtonTextWhite: {
    fontSize: width >= 786 ? 14 : 12,
    fontWeight: "600",
    color: "#024786",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingBottom: 15,
  },
  dailyPassImageContainer: {
    width: width >= 786 ? 180 : 120,
    height: width >= 786 ? 180 : 100,
    justifyContent: "center",
    alignItems: "center",
  },
  dailyPassImage: {
    width: 16,
    height: 16,
  },
  // Posters Carousel Styles
  posterContainer: {
    flex: 1,
    position: "relative",
    overflow: "visible",
    marginVertical: 10,
    height: 150,
    marginBottom: 30,
  },
  posterFlatlistContent: {
    alignItems: "center",
  },
  posterSlideOuter: {
    width: width,
    height: "100%",
    paddingHorizontal: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  posterSlide: {
    width: width - 10,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    // overflow: "hidden",
  },
  posterImage: {
    width: "100%",
    height: "100%",
  },
  posterIndicatorContainer: {
    position: "absolute",
    bottom: -20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  posterIndicator: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FF5757",
    marginHorizontal: 4,
  },
  // Registration Completion Modal Styles
  completionModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  completionModalContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "90%",
    maxWidth: 340,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  completionIconContainer: {
    marginBottom: 20,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  completionMessage: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  completionButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 10,
  },
  completionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Agreement download card styles
  agreementDownloadCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  agreementPdfIcon: {
    width: 28,
    height: 28,
    marginRight: 27,
  },
  agreementTextContainer: {
    flex: 1,
  },
  agreementTitle: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  downloadIconWrapper: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  agreementDownloadCircle: {
    width: 36,
    height: 36,
    position: "absolute",
  },
  agreementDownloadArrow: {
    width: 18,
    height: 18,
  },
});

export default OverViewTabs;
