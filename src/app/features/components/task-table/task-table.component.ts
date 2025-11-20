import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService } from '../../../core/services/task.service';
import { Task } from '../../../core/models/task.model';
import { User } from '@core/models/user.model';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-task-table',
  standalone: true,
  imports: [CommonModule, RouterModule,ReactiveFormsModule],
  templateUrl: './task-table.component.html',
  styleUrls: ['./task-table.component.scss']
})
export class TaskTableComponent implements OnInit {

  tasks: Task[] = [];
  selectedTask?: Task;
  loading = false;
  error: string | null = null;

  constructor(private taskService: TaskService) {}

  ngOnInit() {
    this.fetchTasks();
  }

  fetchTasks() {
    this.loading = true;
    this.error = null;
    this.taskService.getTasks().subscribe({
      next: (data: any) => {
        this.tasks = Array.isArray(data) ? data : data?.results ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des tâches';
        this.loading = false;
      }
    });
  }

  viewTask(task: Task) {
    this.selectedTask = task;
  }

  closeTaskDetails() {
    this.selectedTask = undefined;
  }
userDisplay(value: any): string {
  // 'any' utilisé ici car Angular n’infère pas les unions complexes en template strict :
  return value && typeof value === 'object' && 'username' in value
    ? value.username
    : '(non assigné)';
}
}