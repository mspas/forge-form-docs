import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Header } from '../../shared/header/header';
import { GithubIcon } from '../../shared/github-icon/github-icon';
import { Playground } from './playground/playground';
import { GITHUB_URL, NPM_INSTALL } from '../../shared/site';
import { SeoService } from '../../shared/seo.service';

interface FeatureCard {
  label: string;
  title: string;
  body: string;
  variant: 'teal' | 'dark' | 'cream';
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Header, Playground, GithubIcon],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  readonly githubUrl = GITHUB_URL;
  readonly install = NPM_INSTALL;

  protected readonly copied = signal(false);

  constructor() {
    inject(SeoService).update({
      title: 'ForgeForm - Schema-based forms library for Angular 21+',
      description:
        'ForgeForm turns a plain TypeScript schema into a fully-wired Angular form - FormGroup, signals, validation, hints, error messages and conditional fields. No boilerplate.',
      path: '',
    });
  }

  readonly compat = [
    { label: 'Angular 21+', accent: true },
    { label: 'Schema-driven', accent: true },
    { label: 'Standalone', accent: false },
    { label: 'Signal-based', accent: true },
    { label: 'Reactive Forms', accent: false },
  ];

  readonly features: FeatureCard[] = [
    {
      label: '01. SCHEMA-DRIVEN',
      title: 'JSON in, form out.',
      body: 'Declare your controls as a TypeScript schema. The engine builds the whole Angular Reactive Form for you.',
      variant: 'teal',
    },
    {
      label: '02. SIGNAL-REACTIVE',
      title: 'Reads like a signal.',
      body: 'Form value and validity are signals. Read them in templates, computeds and effects. No subscriptions.',
      variant: 'dark',
    },
    {
      label: '03. BUILT-IN TOOLS',
      title: 'Utilities ready to use.',
      body: 'Schema-driven validation, with error messages placed automatically. Conditional field visibility. Hints. Themes.',
      variant: 'cream',
    },
    {
      label: '04. CUSTOMIZATION',
      title: 'Plug in your components.',
      body: 'Pass in your own components as errors or hints. Style the form as you wish. No irritating overrides.',
      variant: 'dark',
    },
  ];

  async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.install);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      /* clipboard unavailable - no-op */
    }
  }
}
