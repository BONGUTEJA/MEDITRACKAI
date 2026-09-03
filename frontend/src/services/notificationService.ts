import axios from "axios";
import { API_URL } from "./medtrackService";

const api = axios.create({ baseURL: API_URL });

export type NotificationItem = {
  id: number;
  patient_id?: number;
  title: string;
  message: string;
  notification_type: "appointment" | "medication" | "clinical" | "system";
  priority: "high" | "medium" | "low";
  dosage_time?: string;
  medicine_name?: string;
  is_read: boolean;
  created_at?: string;
};

export type NotificationListResponse = {
  unread_count: number;
  total_count: number;
  notifications: NotificationItem[];
};

export const getPatientNotifications = async (patientId: number): Promise<NotificationListResponse> =>
  (await api.get<NotificationListResponse>(`/notifications/patient/${patientId}`)).data;

export const getStaffNotifications = async (): Promise<NotificationListResponse> =>
  (await api.get<NotificationListResponse>("/notifications/staff/")).data;

export const markNotificationRead = async (notificationId: number): Promise<NotificationItem> =>
  (await api.put<NotificationItem>(`/notifications/${notificationId}/read`)).data;

export const markAllPatientNotificationsRead = async (patientId: number) =>
  (await api.put(`/notifications/patient/${patientId}/read-all`)).data;

export const syncPatientReminders = async (patientId: number): Promise<NotificationListResponse> =>
  (await api.post<NotificationListResponse>(`/notifications/sync-reminders/${patientId}`)).data;
