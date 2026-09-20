import { Routes } from '@angular/router';

export const routes: Routes = [
    { path: '', pathMatch: 'full', redirectTo: 'workspace' },
    {
        path: 'workspace',
        loadComponent: () => import('./app').then(m => m.AppComponent),
    },
    { path: '**', redirectTo: 'workspace' },
];