import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import DashboardScreen from "../screens/DashboardScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PatientRegistrationScreen from "../screens/PatientRegistrationScreen";
import PatientProfilesScreen from "../screens/PatientProfilesScreen";
import PatientMedicalProfileScreen from "../screens/PatientMedicalProfileScreen";
import AppointmentBookingScreen from "../screens/AppointmentBookingScreen";
import ConsultationScreen from "../screens/ConsultationScreen";
import PatientDashboardScreen from "../screens/PatientDashboardScreen";
import PatientSignupScreen from "../screens/PatientSignupScreen";
import DoctorDirectoryScreen from "../screens/DoctorDirectoryScreen";
import AnalyticsScreen from "../screens/AnalyticsScreen";
import AuditLogsScreen from "../screens/AuditLogsScreen";

export type RootStackParamList = {
  Landing?: undefined;
  MainApp?: undefined;
  Login: undefined;
  Register: undefined;
  Dashboard: undefined;
  Profile: undefined;
  PatientRegistration: undefined;
  PatientProfiles: undefined;
  PatientMedicalProfile: { patientId: string };
  AppointmentBooking: { patientId?: number } | undefined;
  Consultation: { appointmentId?: number; patientId?: number | string } | undefined;
  PatientDashboard: undefined;
  PatientSignup: undefined;
  DoctorDirectory: undefined;
  Analytics: undefined;
  AuditLogs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="PatientSignup" component={PatientSignupScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="PatientDashboard" component={PatientDashboardScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PatientRegistration" component={PatientRegistrationScreen} />
        <Stack.Screen name="PatientProfiles" component={PatientProfilesScreen} />
        <Stack.Screen name="PatientMedicalProfile" component={PatientMedicalProfileScreen} />
        <Stack.Screen name="AppointmentBooking" component={AppointmentBookingScreen} />
        <Stack.Screen name="Consultation" component={ConsultationScreen} />
        <Stack.Screen name="DoctorDirectory" component={DoctorDirectoryScreen} />
        <Stack.Screen name="Analytics" component={AnalyticsScreen} />
        <Stack.Screen name="AuditLogs" component={AuditLogsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}


