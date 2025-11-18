import { User } from './user.model';

export interface Report {
  id: number;
  analyst: User;
  assigned_to: User;
  input_type: string;
  input_value: string;
  file_name?: string;
  engine_used: string;
  vt_data: any;
  otx_data: any;
  ipinfo_data: any;
  severity: string;
  threat_score: number;
  status: string;
  notes: string;
  created_at: string;
  reviewed_at?: string;
}

export interface ReportDetail extends Report {
  tasks?: Task[];
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  assigned_to: User;
  due_date: string;
  created_at: string;
}

export interface UpdateStatusRequest {
  status: string;
  notes?: string;
}

export interface ReviewReportRequest {
  action: 'approve' | 'false_positive';
}

// Types pour les données VirusTotal
export interface VTData {
  positives?: number;
  total?: number;
  scans?: { [key: string]: VTScanResult };
  scan_date?: string;
  permalink?: string;
}

export interface VTScanResult {
  detected: boolean;
  result: string | null;
}

// Types pour les données OTX
export interface OTXData {
  pulse_count?: number;
  pulses?: OTXPulse[];
  validation?: any[];
}

export interface OTXPulse {
  name: string;
  description: string;
  created: string;
  modified: string;
  tags: string[];
}

// Types pour les données IPInfo
export interface IPInfoData {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  loc?: string;
  org?: string;
  postal?: string;
  timezone?: string;
}