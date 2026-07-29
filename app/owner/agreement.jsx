import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NewOwnerHeader from "../../components/ui/Header/NewOwnerHeader";
import { showToast } from "../../utils/Toaster";
import { getToken } from "../../utils/auth";
import axiosInstance from "../../services/axiosInstance";
import { getAgreementDetailsAPI } from "../../services/Api";

// Multi-step components
import StepIndicator from "../../components/agreement/StepIndicator";
import SelfieCapture from "../../components/agreement/SelfieCapture";
import OTPInput from "../../components/ui/OTPInput";

const { width } = Dimensions.get("window");

const Agreement = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);
  const checkboxAnimation = useRef(new Animated.Value(0)).current;

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gymId, setGymId] = useState(null);
  const [ownerName, setOwnerName] = useState("");
  const [gymCity, setGymCity] = useState("");
  const [allCompleted, setAllCompleted] = useState(false);
  const [gymName, setGymName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [agreementDate, setAgreementDate] = useState("");

  // Step 1 state
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);

  // Step 3 state
  const [maskedMobile, setMaskedMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // Load gym info and fetch status on mount
  useEffect(() => {
    loadGymInfoAndStatus();
  }, []);

  const loadGymInfoAndStatus = async () => {
    try {
      let gym_id = await getToken("gym_id");
      const name = await getToken("owner_name");
      const city = await getToken("gym_city");

      if (!gym_id) {
        showToast({ type: "error", title: "Gym ID not found" });
        router.back();
        return;
      }

      setGymId(parseInt(gym_id));
      setOwnerName(name || "Gym Owner");
      setGymCity(city || "");

      // Get today's date in format "1st day of January, 2025"
      const today = new Date();
      const day = today.getDate();
      const month = today.toLocaleString("en-US", { month: "long" });
      const year = today.getFullYear();
      const dayWithSuffix =
        day +
        (day === 1 || day === 21 || day === 31
          ? "st"
          : day === 2 || day === 22
            ? "nd"
            : day === 3 || day === 23
              ? "rd"
              : "th");
      setAgreementDate(`${dayWithSuffix} day of ${month}, ${year}`);

      // Fetch gym details from API
      const detailsResponse = await getAgreementDetailsAPI(gym_id);
      if (detailsResponse?.status === 200) {
        setGymName(detailsResponse?.data?.gym_name || "");
        setGstNumber(
          detailsResponse?.data?.gst_number || "___________________",
        );
        setPanNumber(
          detailsResponse?.data?.pan_number || "___________________",
        );
      }

      // Fetch current step status
      const response = await axiosInstance.get(
        `/agreement_acceptance/status/${gym_id}`,
      );
      if (response?.data?.status === 200 && response?.data?.data) {
        const data = response.data.data;

        if (data.all_steps_completed) {
          setAllCompleted(true);
          setCompletedSteps([1, 2, 3]);
          setCurrentStep(4);
        } else {
          const step = data.current_step || 1;
          setCurrentStep(step);

          // Build completed steps array
          const completed = [];
          if (data.steps?.terms_accepted) completed.push(1);
          if (data.steps?.selfie_uploaded) completed.push(2);
          if (data.steps?.otp_verified) completed.push(3);
          setCompletedSteps(completed);
        }
      }
    } catch (error) {
      // Continue with step 1 if status fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  // Step 1: Terms scroll handler
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 50;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;

    if (isCloseToBottom && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
      Animated.spring(checkboxAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  };

  // Step 1: Accept terms
  const handleAcceptTerms = async () => {
    if (!isAccepted) {
      showToast({ type: "error", title: "Please accept the terms" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "/agreement_acceptance/step1/accept-terms",
        {
          gym_id: gymId,
          accepted_by_name: ownerName,
        },
      );

      if (response?.data?.status === 200) {
        showToast({ type: "success", title: "Terms accepted" });
        setCompletedSteps([...completedSteps, 1]);
        setCurrentStep(2);
      } else {
        throw new Error(response?.data?.message || "Failed to accept terms");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.response?.data?.detail || "Failed to accept terms",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Handle selfie capture
  const handleSelfieCapture = async (imageUri) => {
    setIsSubmitting(true);
    try {
      // Get presigned URL
      const presignedRes = await axiosInstance.get(
        `/agreement_acceptance/step2/selfie-presigned?gym_id=${gymId}&extension=jpg`,
      );

      if (presignedRes?.data?.status !== 200) {
        throw new Error("Failed to get upload URL");
      }

      const { upload, cdn_url } = presignedRes.data.data;

      // Upload to S3 with retry
      let uploadSuccess = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!uploadSuccess && retryCount < maxRetries) {
        try {
          // Create fresh FormData for each attempt
          const formData = new FormData();
          Object.keys(upload.fields).forEach((key) => {
            formData.append(key, upload.fields[key]);
          });
          formData.append("file", {
            uri: imageUri,
            type: "image/jpeg",
            name: "selfie.jpg",
          });

          const uploadRes = await fetch(upload.url, {
            method: "POST",
            body: formData,
          });

          if (uploadRes.status === 204 || uploadRes.status === 201) {
            uploadSuccess = true;
          } else {
            throw new Error(`S3 upload failed with status ${uploadRes.status}`);
          }
        } catch (uploadError) {
          retryCount++;

          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          } else {
            throw new Error("Failed to upload selfie after multiple attempts");
          }
        }
      }

      // Confirm upload with retry
      let confirmSuccess = false;
      retryCount = 0;

      while (!confirmSuccess && retryCount < maxRetries) {
        try {
          const confirmRes = await axiosInstance.post(
            "/agreement_acceptance/step2/confirm-selfie",
            {
              gym_id: gymId,
              cdn_url: cdn_url,
            },
          );

          if (confirmRes?.data?.status === 200) {
            confirmSuccess = true;
            showToast({ type: "success", title: "Selfie uploaded" });
            setCompletedSteps([...completedSteps, 2]);
            setCurrentStep(3);
          }
        } catch (confirmError) {
          retryCount++;
          if (retryCount < maxRetries) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          } else {
            throw confirmError;
          }
        }
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.message || "Failed to upload selfie",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Send OTP
  const handleSendOTP = async () => {
    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "/agreement_acceptance/step4/send-otp",
        {
          gym_id: gymId,
        },
      );

      if (response?.data?.status === 200) {
        setMaskedMobile(response?.data?.data?.mobile || "");
        setOtpSent(true);
        showToast({
          type: "success",
          title: "OTP sent to your registered mobile",
        });
      } else {
        throw new Error(response?.data?.message || "Failed to send OTP");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.response?.data?.detail || "Failed to send OTP",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Verify OTP
  const handleVerifyOTP = async (otp) => {
    if (!otp || otp.length !== 6) return;

    setIsSubmitting(true);
    try {
      const response = await axiosInstance.post(
        "/agreement_acceptance/step4/verify-otp",
        {
          gym_id: gymId,
          otp: otp,
        },
      );

      if (response?.data?.status === 200) {
        showToast({
          type: "success",
          title: "Agreement completed successfully!",
        });
        setCompletedSteps([1, 2, 3]);
        setAllCompleted(true);
        setCurrentStep(4);
        // Modal will be shown automatically via allCompleted state
      } else {
        throw new Error(response?.data?.message || "Invalid OTP");
      }
    } catch (error) {
      showToast({
        type: "error",
        title: error?.response?.data?.detail || "Invalid or expired OTP",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkboxScale = checkboxAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const checkboxOpacity = checkboxAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Terms & Conditions"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0154A0" />
          <Text style={styles.loadingText}>Loading Terms & Conditions...</Text>
        </View>
      </View>
    );
  }

  // All completed state - Congratulations Modal
  if (allCompleted) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <NewOwnerHeader
          onBackButtonPress={() => router.back()}
          text="Terms & Conditions"
        />
        <View style={styles.modalOverlay}>
          <View style={styles.congratsModal}>
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <View style={styles.successIconOuter}>
                <Ionicons name="checkmark-circle" size={70} color="#22c55e" />
              </View>
            </View>

            {/* Title */}
            <Text style={styles.congratsTitle}>Congratulations!</Text>
            <Text style={styles.congratsSubtitle}>
              Terms & Conditions Submitted Successfully
            </Text>

            {/* Divider */}
            <View style={styles.modalDivider} />

            {/* Message Content */}
            <View style={styles.messageContainer}>
              <View style={styles.messageRow}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={22}
                  color="#0154A0"
                />
                <Text style={styles.messageText}>
                  Our team will now verify the details provided by you,
                  including your bank account information and business
                  documents.
                </Text>
              </View>

              <View style={styles.messageRow}>
                <Ionicons name="wallet-outline" size={22} color="#0154A0" />
                <Text style={styles.messageText}>
                  If you haven't provided your bank account details yet, please
                  ensure you complete this step to enable seamless payouts.
                </Text>
              </View>

              <View style={styles.messageRow}>
                <Ionicons name="mail-outline" size={22} color="#0154A0" />
                <Text style={styles.messageText}>
                  Once verified, we will officially onboard you as a Fymble
                  Partner and email you the signed copy of this terms and
                  conditions for your records.
                </Text>
              </View>

              <View style={styles.messageRow}>
                <Ionicons name="time-outline" size={22} color="#0154A0" />
                <Text style={styles.messageText}>
                  Verification typically takes 24-48 working hours. We'll notify
                  you once complete.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#030A15", "#0154A0"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    Continue to Dashboard
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              Thank you for choosing Fymble as your fitness partner!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderTermsStep();
      case 2:
        return renderSelfieStep();
      case 3:
        return renderOTPStep();
      default:
        return renderTermsStep();
    }
  };

  // Step 1: Terms
  const renderTermsStep = () => (
    <ScrollView
      ref={scrollViewRef}
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <Text style={styles.mainTitle}>
          FYMBLE TERMS & CONDITIONS FOR Fitness Studio ONBOARDING
        </Text>
        <Text style={styles.dateText}>
          This Fitness Studio Onboarding is executed on this{" "}
          <Text style={styles.bold}>{agreementDate}</Text> ("Effective Date"),
        </Text>
      </View>

      {/* Between Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>BETWEEN</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>NFCTech Fitness Private Limited</Text>,
          operating under the brand name "Fymble Business", a company
          incorporated under the Companies Act, 2013, having its registered
          office at:
        </Text>
        <Text style={styles.paragraph}>
          No. 945, 28th Main Road, Putlanpalya, Jayanagara 9th Block, Jayanagar,
          Bengaluru – 560041, Karnataka, India CIN: U63120KA2025PTC197734, GSTN:
          29AAKCN1522H1ZG (hereinafter referred to as "Fymble", which expression
          shall include its successors and permitted assigns)
        </Text>
        <Text style={styles.andText}>AND</Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>{gymName}</Text>, a fitness center having
          its principal place of business at:
        </Text>
        <Text style={styles.paragraph}>
          GSTN: {gstNumber} | PAN: {panNumber} (hereinafter referred to as the
          "Fitness Studio Partner", which expression shall include its
          successors and permitted assigns)
        </Text>
        <Text style={styles.paragraph}>
          If the Fitness Studio Partner is jointly owned or operated, the
          authorized signatory confirms full authority on behalf of all
          partners.
        </Text>
        <Text style={styles.paragraph}>
          Fymble and the Fitness Studio Partner are hereinafter individually
          referred to as a "Party" and collectively as the "Parties."
        </Text>
      </View>

      {/* Section 1 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          1. PURPOSE OF TERMS & CONDITIONS
        </Text>
        <Text style={styles.paragraph}>
          Fymble operates a digital fitness ecosystem through its mobile and web
          platforms connecting gyms,Fitness Studios, trainers, and users. The
          Fitness Studio Partner agrees to digitally onboard its fitness center
          on the Fymble platform to promote services, acquire customers, and
          enable digital bookings and payments.
        </Text>
      </View>

      {/* Section 2 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. SERVICES PROVIDED BY FYMBLE</Text>

        <Text style={styles.subSectionTitle}>2.1 Fymble Business Platform</Text>
        <Text style={styles.bulletPoint}>
          • Lifetime free access to Fymble Business mobile and web applications.
        </Text>
        <Text style={styles.bulletPoint}>
          • Tools to manage memberships, PT plans, trainers, sessions, pricing,
          users, and payments.
        </Text>

        <Text style={styles.subSectionTitle}>
          2.2 Digital Marketing & Brand Visibility
        </Text>
        <Text style={styles.bulletPoint}>
          • Listing and promotion of the Fitness Studio Partner on Fymble
          platforms.
        </Text>
        <Text style={styles.bulletPoint}>
          • Use of fitness Studio name, logo, and images for online and offline
          promotions.
        </Text>

        <Text style={styles.subSectionTitle}>
          2.3 Membership & Plan Integration
        </Text>
        <Text style={styles.bulletPoint}>
          • Display and booking of Fitness Studio Memberships, PT Plans, Daily
          Passes, and Fitness class bookings via Fymble platforms.
        </Text>

        <Text style={styles.subSectionTitle}>
          2.4 QR Code–Enabled Smart Gym Features
        </Text>
        <Text style={styles.bulletPoint}>
          • Unique QR codes for workout zones, mirrors, and reception areas.
        </Text>
        <Text style={styles.bulletPoint}>
          • Posters with QR codes enabling direct Fymble app downloads and
          feature access.
        </Text>

        <Text style={styles.subSectionTitle}>
          2.5 Personal Training Enablement
        </Text>
        <Text style={styles.bulletPoint}>
          • Listing of trainers, schedules, and PT packages.
        </Text>
        <Text style={styles.bulletPoint}>
          • Direct PT booking through the Fymble App.
        </Text>
      </View>

      {/* Section 3 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. COMMERCIAL & PAYMENT TERMS</Text>

        <Text style={styles.subSectionTitle}>
          3.1 Gym Memberships & PT Plans
        </Text>
        <Text style={styles.paragraph}>
          (Includes Gym Memberships, Personal Training Plans, Couple Plans,
          Buddy Plans & Family Plans)
        </Text>
        <Text style={styles.bulletPoint}>
          • No platform fee is deducted from the Gym Partner's listed price.
        </Text>
        <Text style={styles.bulletPoint}>
          • A 10% platform fee (inclusive of 18% GST) is added on top of the
          gym's price and collected from the user.
        </Text>
        <Text style={styles.bulletPoint}>
          • 100% payment is collected from the user through the Fymble App.
        </Text>
        <Text style={styles.paragraph}>
          From the gym payout, Fymble deducts only:
        </Text>
        <Text style={styles.bulletPoint}>
          • Payment Gateway charges (2% + GST)
        </Text>
        <Text style={styles.bulletPoint}>
          • No-Cost EMI charges (if opted by the gym)
        </Text>
        <Text style={styles.bulletPoint}>
          • TDS @ 2% (paid by Fymble on behalf of the Gym Partner and claimable
          during income tax filing)
        </Text>
        <Text style={styles.bulletPoint}>
          • Settlement is processed within 24 hours of receipt from the Payment
          Gateway.
        </Text>

        <Text style={styles.highlightBox}>
          <Text style={styles.bold}>Membership Bonus & Pause Options</Text>
          {"\n\n"}
          Fitness Studio Partner may enable:{"\n"}• Bonus days or bonus months
          {"\n"}• Membership pause options{"\n\n"}
          Fully configurable via the Fymble Business App or Web Portal. Designed
          to improve conversions, user trust, and long-term retention.
        </Text>

        <Text style={styles.subSectionTitle}>
          3.2 Fymble Daily Pass & Fitness Class Bookings
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Daily Pass:</Text> Users may enter the
          Fitness Studio multiple times in a single day without any limitation.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Fitness Class Booking:</Text> Each session
          is strictly limited to 60 minutes.
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Platform Fee:</Text> Fymble charges 10%
          platform fee (inclusive of 18% GST), over and above the gym's listed
          price.
        </Text>

        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Gym Payout Deductions:</Text>
        </Text>
        <Text style={styles.bulletPoint}>
          • Payment Gateway charges + applicable GST
        </Text>
        <Text style={styles.bulletPoint}>
          • TDS @ 2% (paid by Fymble on behalf of the Gym Partner)
        </Text>
        <Text style={styles.paragraph}>
          <Text style={styles.bold}>Settlement Cycle:</Text> Payments are
          settled weekly, every Monday, to the Gym Partner's registered bank
          account.
        </Text>

        <Text style={styles.subSectionTitle}>3.3 No-Cost EMI Facility</Text>
        <Text style={styles.bulletPoint}>
          • Fymble may enable No-Cost EMI options through partner banks or
          payment gateways.
        </Text>
        <Text style={styles.bulletPoint}>
          • Any interest or subvention cost shall be borne by the Gym Partner.
        </Text>
      </View>

      {/* Section 4 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          4. OBLIGATIONS OF THE Fitness Studio PARTNER
        </Text>
        <Text style={styles.bulletPoint}>
          • Maintain facilities, trainers, and equipment as per industry
          standards.
        </Text>
        <Text style={styles.bulletPoint}>
          • Ensure hygiene, safety, and compliance with applicable laws.
        </Text>
        <Text style={styles.bulletPoint}>
          • Display Fymble QR codes, posters, and branding prominently.
        </Text>
        <Text style={styles.bulletPoint}>
          • Maintain accurate pricing and service information.
        </Text>

        <Text style={styles.warningBox}>
          <Text style={styles.bold}>No Dual Pricing Policy:</Text> Prices for
          offline and Fymble users must remain the same.
        </Text>

        <Text style={styles.subSectionTitle}>
          4.1 GYM HYGIENE, SAFETY & FACILITY STANDARDS
        </Text>
        <Text style={styles.paragraph}>
          To ensure a high-quality and safe fitness experience, the Gym Partner
          agrees to:
        </Text>
        <Text style={styles.bulletPoint}>
          • Maintain clean, hygienic, and odour-free premises at all times.
        </Text>
        <Text style={styles.bulletPoint}>
          • Provide separate, clearly marked toilets for men and women.
        </Text>
        <Text style={styles.bulletPoint}>
          • Ensure toilets are sanitized and maintained throughout operating
          hours.
        </Text>
        <Text style={styles.bulletPoint}>
          • Keep workout areas clean, organized, and clutter-free.
        </Text>
        <Text style={styles.bulletPoint}>
          • Provide good-quality workout mats and yoga mats.
        </Text>
        <Text style={styles.bulletPoint}>
          • Maintain all gym machines and equipment in proper working condition.
        </Text>
        <Text style={styles.bulletPoint}>
          • Immediately repair or replace damaged cables, ropes, pulleys, or
          machines.
        </Text>
        <Text style={styles.bulletPoint}>
          • Ensure adequate spacing between equipment for user safety.
        </Text>
        <Text style={styles.bulletPoint}>
          • Provide at least one qualified trainer or floor assistant during
          operating hours.
        </Text>
        <Text style={styles.bulletPoint}>
          • Assign appropriate trainers (preferably female trainers for female
          members) for PT sessions where applicable.
        </Text>
        <Text style={styles.bulletPoint}>
          • Ensure proper ventilation, lighting, drinking water, and first-aid
          availability.
        </Text>
        <Text style={styles.bulletPoint}>
          • Cooperate with Fymble's digital or physical audits and inspections.
        </Text>

        <Text style={styles.warningBox}>
          Failure to comply may result in temporary suspension, delisting, or
          termination from the Fymble platform.
        </Text>
      </View>

      {/* Section 5 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>5. INTELLECTUAL PROPERTY</Text>
        <Text style={styles.paragraph}>
          All intellectual property related to Fymble software, trademarks, and
          content remains the exclusive property of Fymble.
        </Text>
      </View>

      {/* Section 6 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>6. TERM & TERMINATION</Text>
        <Text style={styles.bulletPoint}>
          • This Terms & Conditions is valid for 1 year from the Effective Date
          and auto-renews annually.
        </Text>
        <Text style={styles.bulletPoint}>
          • Either Party may terminate with 30 days' written notice.
        </Text>
        <Text style={styles.bulletPoint}>
          • Fymble may terminate immediately for fraud, breach, or
          non-compliance.
        </Text>
      </View>

      {/* Section 7 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>7. CONFIDENTIALITY</Text>
        <Text style={styles.paragraph}>
          Both Parties shall maintain strict confidentiality of user data,
          financial information, and business terms.
        </Text>
      </View>

      {/* Section 8 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>8. LIMITATION OF LIABILITY</Text>
        <Text style={styles.paragraph}>
          Fymble shall not be liable for gym operations, service quality,
          trainer conduct, or equipment safety.
        </Text>
      </View>

      {/* Section 9 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>9. GOVERNING LAW & JURISDICTION</Text>
        <Text style={styles.paragraph}>
          This Terms & Conditions shall be governed by Indian Law and subject to
          the exclusive jurisdiction of Bengaluru Courts.
        </Text>
      </View>

      {/* Section 10 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>10. MISCELLANEOUS</Text>
        <Text style={styles.bulletPoint}>
          • This T&C does not create any partnership, joint venture, or
          employment relationship.
        </Text>
        <Text style={styles.bulletPoint}>
          • Amendments must be in writing and digitally or physically signed.
        </Text>
        <Text style={styles.bulletPoint}>
          • Digital acceptance through the Fymble platform shall be valid and
          binding.
        </Text>
      </View>

      {/* Scroll Indicator */}
      {!hasScrolledToEnd && (
        <View style={styles.scrollIndicator}>
          <Ionicons name="chevron-down" size={24} color="#0154A0" />
          <Text style={styles.scrollIndicatorText}>
            Scroll down to read the complete Terms & Conditions
          </Text>
        </View>
      )}

      {/* Acceptance Section */}
      {hasScrolledToEnd && (
        <Animated.View
          style={[
            styles.acceptanceSection,
            {
              opacity: checkboxOpacity,
              transform: [{ scale: checkboxScale }],
            },
          ]}
        >
          <View style={styles.checkboxContainer}>
            <TouchableOpacity
              style={[styles.checkbox, isAccepted && styles.checkboxChecked]}
              onPress={() => setIsAccepted(!isAccepted)}
            >
              {isAccepted && (
                <Ionicons name="checkmark" size={18} color="#FFF" />
              )}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>
              I have read and accept the terms and conditions between NFCTech
              Fitness Private Limited (Fymble) and my Fitness Studio.
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleAcceptTerms}
            disabled={!isAccepted || isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                !isAccepted || isSubmitting
                  ? ["#B0BEC5", "#B0BEC5"]
                  : ["#030A15", "#0154A0"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.acceptButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept & Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // Step 2: Selfie
  const renderSelfieStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>Selfie Verification</Text>
        <Text style={styles.stepDescription}>
          Take a selfie with your face clearly visible. The timestamp will be
          automatically added.
        </Text>
      </View>
      {isSubmitting ? (
        <View style={styles.uploadingContainer}>
          <ActivityIndicator size="large" color="#0154A0" />
          <Text style={styles.uploadingText}>Uploading selfie...</Text>
        </View>
      ) : (
        <SelfieCapture onCapture={handleSelfieCapture} gymCity={gymCity} />
      )}
    </View>
  );

  // Step 3: OTP
  const renderOTPStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.otpContainer}>
        <View style={styles.otpIcon}>
          <Ionicons name="shield-checkmark-outline" size={60} color="#0154A0" />
        </View>
        <Text style={styles.stepTitle}>OTP Verification</Text>
        <Text style={styles.stepDescription}>
          {otpSent
            ? `Enter the 6-digit OTP sent to ${maskedMobile}`
            : "We'll send an OTP to your registered mobile number for final verification."}
        </Text>

        {!otpSent ? (
          <TouchableOpacity
            onPress={handleSendOTP}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                isSubmitting ? ["#4A90C2", "#4A90C2"] : ["#030A15", "#0154A0"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.sendOtpButton}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.sendOtpButtonText}>Send OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <View style={styles.otpInputContainer}>
            <OTPInput
              onComplete={handleVerifyOTP}
              onResendOTP={handleSendOTP}
            />
            {isSubmitting && (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="small" color="#0154A0" />
                <Text style={styles.verifyingText}>Verifying...</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <NewOwnerHeader
        onBackButtonPress={() => router.back()}
        text="Terms & Conditions"
      />

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      {renderStepContent()}
    </View>
  );
};

export default Agreement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  completedContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  completedIcon: {
    marginBottom: 20,
  },
  completedTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#22c55e",
    marginBottom: 12,
  },
  completedText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#0154A0",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  stepContainer: {
    flex: 1,
  },
  stepHeader: {
    padding: 16,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  uploadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  uploadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  otpContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
  },
  otpIcon: {
    marginBottom: 20,
  },
  sendOtpButton: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 24,
  },
  sendOtpButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  otpInputContainer: {
    width: "100%",
    marginTop: 24,
  },
  verifyingContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
    gap: 8,
  },
  verifyingText: {
    color: "#0154A0",
    fontSize: 14,
  },
  headerSection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: "#0154A0",
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#030A15",
    textAlign: "center",
    marginBottom: 12,
  },
  dateText: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#030A15",
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    marginTop: 12,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
    marginBottom: 8,
    textAlign: "justify",
  },
  bold: {
    fontWeight: "bold",
  },
  andText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#030A15",
    textAlign: "center",
    marginVertical: 12,
  },
  bulletPoint: {
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
    marginBottom: 6,
    paddingLeft: 8,
  },
  highlightBox: {
    backgroundColor: "#E3F2FD",
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    fontSize: 13,
    color: "#1565C0",
    lineHeight: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#0154A0",
  },
  warningBox: {
    backgroundColor: "#FFF3E0",
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
    fontSize: 13,
    color: "#E65100",
    lineHeight: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
  },
  scrollIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  scrollIndicatorText: {
    fontSize: 13,
    color: "#0154A0",
    fontWeight: "500",
  },
  acceptanceSection: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#0154A0",
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: "#0154A0",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    color: "#333",
    lineHeight: 20,
  },
  acceptButton: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  // Congratulations Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "#f0f9ff",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  congratsModal: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  successIconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  successIconOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#ecfdf5",
    justifyContent: "center",
    alignItems: "center",
  },
  congratsTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 4,
  },
  congratsSubtitle: {
    fontSize: 15,
    color: "#22c55e",
    textAlign: "center",
    fontWeight: "500",
    marginBottom: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  messageContainer: {
    marginBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
    gap: 12,
  },
  messageText: {
    flex: 1,
    fontSize: 13,
    color: "#4b5563",
    lineHeight: 20,
  },
  modalActions: {
    marginTop: 8,
  },
  primaryButton: {
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  footerNote: {
    fontSize: 12,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 16,
    fontStyle: "italic",
  },
});
