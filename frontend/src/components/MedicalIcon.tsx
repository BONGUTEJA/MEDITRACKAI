import React from "react";
import { Image, ImageSourcePropType, ImageStyle, StyleProp, StyleSheet, View, ViewStyle } from "react-native";

export type MedicalIconName =
  | "patients"
  | "consultation"
  | "doctor"
  | "register"
  | "records"
  | "calendar"
  | "prescription"
  | "analytics"
  | "security"
  | "logout"
  | "bell"
  | "phone"
  | "email"
  | "trash"
  | "refresh"
  | "download"
  | "check"
  | "close"
  | "hospital"
  | "user"
  | "patient"
  | "male"
  | "female"
  | "clock"
  | "shield"
  | "vitals"
  | "pills"
  | "heart"
  | "search"
  | "edit"
  | "document";

export type MedicalIconVariant = "icon" | "illustration";

interface MedicalIconProps {
  name: MedicalIconName;
  size?: number;
  color?: string;
  variant?: MedicalIconVariant;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}

export const PNG_ICONS: Record<string, ImageSourcePropType> = {
  hospital: require("../../assets/icons/hospital.png"),
  doctor: require("../../assets/icons/doctor.png"),
  user: require("../../assets/icons/user.png"),
  patient: require("../../assets/icons/patient.png"),
  patients: require("../../assets/icons/patients.png"),
  consultation: require("../../assets/icons/consultation.png"),
  register: require("../../assets/icons/register.png"),
  records: require("../../assets/icons/records.png"),
  document: require("../../assets/icons/document.png"),
  calendar: require("../../assets/icons/calendar.png"),
  pills: require("../../assets/icons/pills.png"),
  prescription: require("../../assets/icons/prescription.png"),
  analytics: require("../../assets/icons/analytics.png"),
  security: require("../../assets/icons/security.png"),
  shield: require("../../assets/icons/shield.png"),
  clock: require("../../assets/icons/clock.png"),
  bell: require("../../assets/icons/bell.png"),
  phone: require("../../assets/icons/phone.png"),
  email: require("../../assets/icons/email.png"),
  trash: require("../../assets/icons/trash.png"),
  vitals: require("../../assets/icons/vitals.png"),
  heart: require("../../assets/icons/heart.png"),
  check: require("../../assets/icons/check.png"),
  close: require("../../assets/icons/close.png"),
  logout: require("../../assets/icons/logout.png"),
  male: require("../../assets/icons/male.png"),
  female: require("../../assets/icons/female.png"),
  search: require("../../assets/icons/search.png"),
  edit: require("../../assets/icons/edit.png"),
  refresh: require("../../assets/icons/refresh.png"),
  download: require("../../assets/icons/download.png"),
};

export default function MedicalIcon({
  name,
  size = 20,
  style,
  imageStyle,
}: MedicalIconProps) {
  const iconSource = PNG_ICONS[name] || PNG_ICONS.document;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Image
        source={iconSource}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
});
