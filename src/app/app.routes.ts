import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.Landing),
    title: 'ForgeForm - Schema-based forms for Angular 21+',
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs/docs').then((m) => m.Docs),
    title: 'ForgeForm - Documentation',
  },
  { path: '**', redirectTo: '' },
];
