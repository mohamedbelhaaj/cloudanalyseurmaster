export interface SendToAdminRequest {
  assigned_to_id: string;
  message?: string;
}

export interface SendToAdminResponse {
  id: string;
  message: string;
  assigned_to_id: string;
  previous_assigned_to?: string;
  updated_at: string;
  status?: string;
}