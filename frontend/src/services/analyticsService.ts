import axios from "axios";
import { API_URL } from "./medtrackService";

const api = axios.create({ baseURL: API_URL });

export type AnalyticsSummary = {
  total_patients: number;
  total_doctors: number;
  total_appointments: number;
  today_appointments: number;
  total_consultations: number;
  total_prescriptions: number;
  completed_appointments: number;
  cancelled_appointments: number;
  pending_appointments: number;
};

export type DemographicsData = {
  total_patients: number;
  age_distribution: {
    "0-18": number;
    "19-40": number;
    "41-60": number;
    "60+": number;
  };
  gender_distribution: {
    Male: number;
    Female: number;
    Other: number;
  };
};

export type VisitTrendsData = {
  visit_trends: {
    Monday: number;
    Tuesday: number;
    Wednesday: number;
    Thursday: number;
    Friday: number;
    Saturday: number;
    Sunday: number;
  };
};

export type DoctorWorkloadItem = {
  doctor_id: number;
  doctor_name: string;
  specialization: string;
  consultations_count: number;
  appointments_count: number;
};

export type DoctorWorkloadData = {
  doctor_workload: DoctorWorkloadItem[];
};

export const getAnalyticsSummary = async (days?: number): Promise<AnalyticsSummary> =>
  (await api.get<AnalyticsSummary>("/analytics/summary", { params: days ? { days } : {} })).data;

export const getDemographics = async (days?: number): Promise<DemographicsData> =>
  (await api.get<DemographicsData>("/analytics/demographics", { params: days ? { days } : {} })).data;

export const getVisitTrends = async (days?: number): Promise<VisitTrendsData> =>
  (await api.get<VisitTrendsData>("/analytics/visit-trends", { params: days ? { days } : {} })).data;

export const getDoctorWorkload = async (days?: number): Promise<DoctorWorkloadData> =>
  (await api.get<DoctorWorkloadData>("/analytics/doctor-workload", { params: days ? { days } : {} })).data;

export const getCsvExportUrl = (days?: number) =>
  `${API_URL}/analytics/export/csv${days ? `?days=${days}` : ""}`;
