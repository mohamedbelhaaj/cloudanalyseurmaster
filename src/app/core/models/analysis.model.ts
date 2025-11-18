export interface AnalysisInput {
  input_value?: string;
  file?: File;
  engine_choice: 'vt' | 'otx';
}

export interface AnalysisResult {
  id: number;
  analyst: object;
  input_type: 'ip' | 'domain' | 'url' | 'hash' | 'file';
  input_value: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  threat_score: number;
  status: string;
  engine_used: string;
  created_at: string;
}