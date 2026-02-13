import { Component, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NavbarComponent, SidebarComponent } from '@core/components';
import { MaterialModule } from '@shared/material';
import { MatSidenav } from '@angular/material/sidenav';

@Component({
  imports: [RouterModule, NavbarComponent, SidebarComponent, MaterialModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  toggleSidebar(): void {
    if (this.sidenav) {
      this.sidenav.toggle();
    }
  }
}
