import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.Landing),
    title: 'forge-form — Schema-driven forms for Angular 21+',
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs/docs').then((m) => m.Docs),
    title: 'Documentation — forge-form',
  },
  { path: '**', redirectTo: '' },
];
