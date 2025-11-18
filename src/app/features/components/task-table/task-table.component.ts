import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TaskService} from '../../../core/services/task.service'
import { Task } from '../../../core/models/task.model'

@Component({
  selector: 'app-task-table',
  imports: [CommonModule,RouterModule ],
  templateUrl: './task-table.component.html',
  styleUrls: ['./task-table.component.scss']
})
export class TaskTableComponent  implements OnInit{

tasks: Task[] = [];
  username = localStorage.getItem('username') ?? 'User';
  role = localStorage.getItem('role') ?? 'analyst';

  constructor(private TaskService: TaskService) {}

  ngOnInit(): void {
   

   
  }}