import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  darkMode = signal<boolean>(false);

  constructor() {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const storedTheme = localStorage.getItem('theme');

    if (storedTheme) {
      this.darkMode.set(storedTheme === 'dark');
    } else {
      this.darkMode.set(prefersDark);
    }

    this.applyTheme(this.darkMode());
  }

  toggleTheme(): void {
    this.darkMode.update((current) => !current);
    const isDark = this.darkMode();
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    this.applyTheme(isDark);
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }
}
