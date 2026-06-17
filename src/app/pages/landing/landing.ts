import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../../shared/logo/logo';
import { Playground } from './playground/playground';
import { GITHUB_URL, NPM_INSTALL } from '../../shared/site';

interface FeatureCard {
  label: string;
  title: string;
  body: string;
  variant: 'teal' | 'dark' | 'cream';
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Logo, Playground],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  readonly githubUrl = GITHUB_URL;
  readonly install = NPM_INSTALL;

  protected readonly copied = signal(false);

  readonly compat = [
    { label: 'Angular 21+', accent: true },
    { label: 'Standalone', accent: false },
    { label: 'Signal-based', accent: true },
    { label: 'OnPush', accent: false },
    { label: 'Reactive Forms under the hood', accent: false },
    { label: 'SSR-safe', accent: false },
  ];

  readonly features: FeatureCard[] = [
    {
      label: '01 / CONFIG-DRIVEN',
      title: 'Object in, data out.',
      body: 'Declare controls as data. The engine builds the FormGroup and renders every input for you.',
      variant: 'teal',
    },
    {
      label: '02 / SIGNAL-REACTIVE',
      title: 'Reads like a signal.',
      body: 'Form value and validity are signals. Read them in templates, computeds and effects. No subscriptions, no Zone.js.',
      variant: 'dark',
    },
    {
      label: '03 / VALIDATION',
      title: 'Rules that render.',
      body: 'required, minLength, pattern, custom — with messages placed automatically or replaced by your components.',
      variant: 'cream',
    },
    {
      label: '04 / FLEXIBILITY',
      title: 'Fields that react.',
      body: 'Visibility, validators, errors, hints dictated by your rules.',
      variant: 'dark',
    },
  ];

  async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.install);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  }
}
