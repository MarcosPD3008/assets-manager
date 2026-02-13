import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  ErrorHandler,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { appRoutes } from './app.routes';
import { errorInterceptor, GlobalErrorHandler } from '@libs/frontend-common';
import { provideHttpCache } from '@libs/frontend/api-client';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpCache({ storage: environment.cacheStorage }),
    provideHttpClient(
      withInterceptors([errorInterceptor])
    ),
    provideAnimations(),
    provideToastr({
      timeOut: 5000,
      positionClass: 'toast-top-right',
      preventDuplicates: true,
      closeButton: true,
      progressBar: true,
    }),
    {
      provide: ErrorHandler,
      useClass: GlobalErrorHandler,
    },
  ],
};
