import { User } from "./user.model";

export interface Task {
  id?: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to: number;
  due_date: string;
  report: number;
  status?: 'pending' | 'in_progress' | 'completed';
  created_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskCreateRequest {
  title: string;
  description: string;
  priority: string;
  assigned_to: number;
  due_date: string;
  report: number;
}

export interface TaskResponse {
  id: number;
  title: string;
  description: string;
  priority: string;
  assigned_to: User;
  due_date: string;
  report: Report;
  status: string;
  created_by: User;
  created_at: string;
  updated_at: string;
}