export interface TaskCreateRequest {
  title: string;
  description: string;
  priority: string;
  assigned_to_id: number;
  report_id: string;  // Changed from number to string
  due_date: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  priority: string;
  status: string;
  report: {
    id: string;  // Changed from number to string
    input_value: string;
  };
  assigned_to: {
    id: number;
    username: string;
    email: string;
  };
  created_by: {
    id: number;
    username: string;
  };
  due_date: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}