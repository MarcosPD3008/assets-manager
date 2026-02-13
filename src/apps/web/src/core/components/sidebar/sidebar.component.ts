import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '@shared/material';

export interface SidebarItem {
  label: string;
  icon: string;
  route: string;
  badge?: number;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  menuItems: SidebarItem[] = [
    { label: 'Inicio', icon: 'dashboard', route: '/home' },
    { label: 'Activos', icon: 'inventory_2', route: '/assets' },
    { label: 'Contactos', icon: 'people', route: '/contacts' },
    { label: 'Asignaciones', icon: 'assignment_ind', route: '/assignments' },
    { label: 'Mantenimientos', icon: 'build', route: '/maintenances' },
    { label: 'Recordatorios', icon: 'notifications', route: '/reminders' },
    { label: 'Calendario', icon: 'calendar_today', route: '/calendar' },
  ];
}
