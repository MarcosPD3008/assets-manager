import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full',
  },
  {
    path: 'home',
    loadComponent: () =>
      import('../features/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'assets',
    children: [
        {
            path: '',
            loadComponent: () =>
                import('../features/assets/assets-data/assets-data.component').then((m) => m.AssetsDataComponent),
        },
        {
            path: 'new',
            loadComponent: () =>
                import('../features/assets/asset-form/asset-form.component').then((m) => m.AssetFormComponent),
        },
        {
            path: 'view/:id',
            loadComponent: () =>
                import('../features/assets/asset-form/asset-form.component').then((m) => m.AssetFormComponent),
        },
        {
            path: ':id',
            loadComponent: () =>
                import('../features/assets/asset-form/asset-form.component').then((m) => m.AssetFormComponent),
        },
    ]
  },
  {
    path: 'assignments',
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            '../features/assignments/assignments-data/assignments-data.component'
          ).then((m) => m.AssignmentsDataComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('../features/assignments/assignment-form/assignment-form.component').then(
            (m) => m.AssignmentFormComponent
          ),
      },
      {
        path: 'view/:id',
        loadComponent: () =>
          import('../features/assignments/assignment-form/assignment-form.component').then(
            (m) => m.AssignmentFormComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('../features/assignments/assignment-form/assignment-form.component').then(
            (m) => m.AssignmentFormComponent
          ),
      },
    ],
  },
  {
    path: 'reminders',
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            '../features/reminders/reminders-data/reminders-data.component'
          ).then((m) => m.RemindersDataComponent),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('../features/reminders/reminder-form/reminder-form.component').then((m) => m.ReminderFormComponent),
      },
      {
        path: 'view/:id',
        loadComponent: () =>
          import('../features/reminders/reminder-form/reminder-form.component').then((m) => m.ReminderFormComponent),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('../features/reminders/reminder-form/reminder-form.component').then((m) => m.ReminderFormComponent),
      },
    ]
  },
  {
    path: 'contacts',
    children: [
        {
            path: '',
            loadComponent: () =>
                import('../features/contacts/contacts-data/contacts-data.component').then((m) => m.ContactsDataComponent),
        },
        {
            path: 'new',
            loadComponent: () =>
                import('../features/contacts/contact-form/contact-form.component').then((m) => m.ContactFormComponent),
        },
        {
            path: 'view/:id',
            loadComponent: () =>
                import('../features/contacts/contact-form/contact-form.component').then((m) => m.ContactFormComponent),
        },
        {
            path: ':id',
            loadComponent: () =>
                import('../features/contacts/contact-form/contact-form.component').then((m) => m.ContactFormComponent),
        },
    ]
  },
  {
    path: 'maintenances',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../features/maintenances/maintenances-data/maintenances-data.component').then(
            (m) => m.MaintenancesDataComponent
          ),
      },
      {
        path: 'new',
        loadComponent: () =>
          import('../features/maintenances/maintenance-form/maintenance-form.component').then(
            (m) => m.MaintenanceFormComponent
          ),
      },
      {
        path: 'view/:id',
        loadComponent: () =>
          import('../features/maintenances/maintenance-form/maintenance-form.component').then(
            (m) => m.MaintenanceFormComponent
          ),
      },
      {
        path: ':id',
        loadComponent: () =>
          import('../features/maintenances/maintenance-form/maintenance-form.component').then(
            (m) => m.MaintenanceFormComponent
          ),
      },
    ],
  },
  {
    path: 'calendar',
    loadComponent: () =>
      import('../features/calendar/calendar.component').then(
        (m) => m.CalendarComponent
      ),
  },
];
