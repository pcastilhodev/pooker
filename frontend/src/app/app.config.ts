import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import {provideRouter, withRouterConfig} from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from '../security/http-interceptor';

// @ts-ignore
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
        routes,
        withRouterConfig(
            {
              onSameUrlNavigation: 'reload',
              paramsInheritanceStrategy: 'always'
            },
        )
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
