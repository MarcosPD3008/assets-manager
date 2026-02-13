import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '@shared/material';

import { ThemeService } from '@core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent {
  title = 'Assets Manager';
  @Output() toggleSidebarEvent = new EventEmitter<void>();

  constructor(public themeService: ThemeService) {}

  toggleSidebar(): void {
    this.toggleSidebarEvent.emit();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
