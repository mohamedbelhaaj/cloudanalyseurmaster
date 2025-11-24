import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { analystGuard, adminGuard } from './core/guards/auth.guard';
import { NotFoundComponent } from '@shared/layout/not-found/not-found.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },

  // {
  //   path: 'login',
  //   loadComponent: () =>
  //     import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  // },
  {
    path: 'dashboard',
    canActivate: [analystGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./features/components/reports-table/reports-table.component').then(
        (m) => m.ReportsTableComponent
      ),
  },
  {
    path: 'reports/:id',
    loadComponent: () =>
      import('./features/components/report-detail/report-detail.component').then(
        (m) => m.ReportDetailComponent
      ),
  },
  {
    path: 'sendtoadmin',
    loadComponent: () =>
      import('./features/components/send-to-admin/send-to-admin.component').then(
        (m) => m.SendToAdminComponent
      ),
  },

  {
    path: 'task',
    loadComponent: () =>
      import('./features/components/task-table/task-table.component').then(m => m.TaskTableComponent
      ),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/components/create-task/create-task.component').then(m => m.CreateTaskComponent
      ),
  },

  {
    path: 'mitigations',
    loadComponent: () =>
      import('./features/components/migrations-table/migrations-table.component').then(
        m => m.MigrationsTableComponent
      ),
  },
  {
    path: 'analyze',
    loadComponent: () =>
      import('./features/analyze/analyze.component').then(m => m.AnalyzeComponent),
  },
  {
    path: 'awsconf',
    loadComponent: () =>
      import('./features/components/aws-configuration/aws-configuration.component').then(m => m.AwsConfigurationComponent
      ),
  },
  {path:'awsstatus',
    loadComponent:()=>import('./features/components/aws-status/aws-status.component').then(m=>m.AwsStatusComponent)
  },
  {
    path: 'dashboardadmin',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./features/admin/dashboard-admin/dashboard-admin.component').then(
        m => m.DashboardAdminComponent
      ),
  },
  {
    path: '**',
    component : NotFoundComponent
  },
];
