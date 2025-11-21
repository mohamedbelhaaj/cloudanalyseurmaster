// Backend expects "admin_id" not "assigned_to_id"
export interface SendToAdminRequest {
  admin_id: string;  // Backend expects admin_id as number
  message?: string;
}

export interface SendToAdminResponse {
  id: string;
  message: string;
  admin_id?: number;
  assigned_to?: number;
  assigned_to_id?: number;
  previous_assigned_to?: number | string;
  updated_at: string;
  status?: string;
  detail?: string;
}