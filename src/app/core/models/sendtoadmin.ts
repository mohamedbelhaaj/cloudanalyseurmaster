export interface SendToAdminRequest {
  assigned_to: number;
  message?: string;
}

export interface SendToAdminResponse {
  id: number;
  message: string;
  assigned_to: number;
  previous_assigned_to?: number;
  updated_at: string;
  status?: string;
}
