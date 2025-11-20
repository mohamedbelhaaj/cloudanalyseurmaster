import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';

export const routes: Routes = [
  { path: '', redirectTo: 'user-login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
 {path:'dashboard',
  loadComponent:()=>import('./features/dashboard/dashboard.component').then(m=>m.DashboardComponent)
 },
   {
    path: 'reports',
    loadComponent: () => import('./features/components/reports-table/reports-table.component').then(m => m.ReportsTableComponent),
  },
  {
    path: 'reports/:id',
    loadComponent:()=>import('./features/components/report-detail/report-detail.component').then(m=>m.ReportDetailComponent),
  },
  {path:'sendtoadmin' , loadComponent:()=>import('./features/components/send-to-admin/send-to-admin.component').then(m=>m.SendToAdminComponent)},
  
  {
  path: 'task',
  loadComponent: () => import('./features/components/task-table/task-table.component').then(m => m.TaskTableComponent)
},
{
  path: 'tasks',
  loadComponent: () => import('./features/components/create-task/create-task.component').then(m => m.CreateTaskComponent)
},

{
path:'mitigations', 
loadComponent: ()=> import('./features/components/migrations-table/migrations-table.component').then(m => m.MigrationsTableComponent)

},
    {
  path: 'analyze',
  loadComponent: () => import('./features/analyze/analyze.component').then(m=>m.AnalyzeComponent)
},
  {
    path: '**',
    redirectTo: 'dashboard'
  },
];