import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';
import { ToastService } from './core/services/toast.service';
import { ContextMenuService } from './core/services/context-menu.service';
import { LayoutService } from './core/services/layout.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideAnimations(),
    ToastService,
    ContextMenuService,
    LayoutService,
  ],
};