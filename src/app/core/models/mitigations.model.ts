export interface MitigationAction {
  id?: string;
  report?: string;
  action_type: string;
  target_value: string;
  aws_resource_id?: string;
  aws_region: string;
  status?: string;
  initiated_by?: number;
  description: string;
  error_message?: string;
  created_at?: string;
  completed_at?: string;
  execute_now?: boolean;
}

export interface MitigationActionResponse extends MitigationAction {
  // Ajoute d’autres champs du backend si besoin
}
