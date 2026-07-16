import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing').then((m) => m.Landing),
    // Title (+ description/OG/canonical) is set by SeoService in each page so
    // all SEO metadata lives in one place; the router must not override it.
  },
  {
    path: 'docs',
    loadComponent: () => import('./pages/docs/docs').then((m) => m.Docs),
  },
  {
    path: 'playground',
    loadComponent: () =>
      import('./pages/playground/playground').then((m) => m.Playground),
  },
  { path: '**', redirectTo: '' },
];
