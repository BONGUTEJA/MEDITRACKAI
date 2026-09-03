import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  ReactNode,
} from "react";
import { User } from "../types/auth";
import { Patient } from "../services/medtrackService";

type UserType = "staff" | "patient" | null;

type AuthContextType = {
  user: User | null;
  patientUser: Patient | null;
  userType: UserType;
  login: (userData: User) => void;
  loginStaff: (userData: User) => void;
  loginPatient: (patientData: Patient) => void;
  updateUser: (userData: User) => void;
  updatePatient: (patientData: Patient) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [patientUser, setPatientUser] = useState<Patient | null>(null);
  const [userType, setUserType] = useState<UserType>(null);

  const loginStaff = useCallback((userData: User) => {
    setUser(userData);
    setPatientUser(null);
    setUserType("staff");
  }, []);

  const loginPatient = useCallback((patientData: Patient) => {
    setPatientUser(patientData);
    setUser(null);
    setUserType("patient");
  }, []);

  const login = loginStaff; // Backwards compatible

  const updateUser = useCallback((userData: User) => setUser(userData), []);
  const updatePatient = useCallback(
    (patientData: Patient) => setPatientUser(patientData),
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    setPatientUser(null);
    setUserType(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      patientUser,
      userType,
      login,
      loginStaff,
      loginPatient,
      updateUser,
      updatePatient,
      logout,
    }),
    [
      user,
      patientUser,
      userType,
      login,
      loginStaff,
      loginPatient,
      updateUser,
      updatePatient,
      logout,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
