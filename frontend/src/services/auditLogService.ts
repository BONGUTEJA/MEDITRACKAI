import axios from "axios";
import { API_URL } from "./medtrackService";

const api = axios.create({ baseURL: API_URL });

export type AuditLogItem = {
  id: number;
  user_id?: number;
  user_name: string;
  user_role: string;
  action: string;
  resource?: string;
  details?: string;
  ip_address?: string;
  timestamp?: string;
};

export type AuditLogListResponse = {
  total_count: number;
  logs: AuditLogItem[];
};

export const getAuditLogs = async (params?: { user_name?: string; action?: string; limit?: number }): Promise<AuditLogListResponse> =>
  (await api.get<AuditLogListResponse>("/audit-logs/", { params })).data;

export const getSecurityEvents = async (limit?: number): Promise<AuditLogListResponse> =>
  (await api.get<AuditLogListResponse>("/audit-logs/security-events", { params: { limit } })).data;

export const logUserAction = async (data: {
  user_name: string;
  user_role: string;
  action: string;
  resource?: string;
  details?: string;
}) => (await api.post<AuditLogItem>("/audit-logs/", data)).data;
