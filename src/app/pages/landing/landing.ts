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

interface FaqItem {
  question: string;
  answer: string;
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

  /** Index of the currently expanded FAQ item; first one open by default. */
  protected readonly openFaq = signal<number | null>(0);

  toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

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

  readonly faqs: FaqItem[] = [
    {
      question: 'What is ForgeForm?',
      answer: 'ForgeForm (@forge-form/angular) is a schema-driven, signal-based forms library for Angular 21+. You describe your form as a plain TypeScript object - fields, validators, hints, layout and conditional visibility - and ForgeForm builds the Angular reactive form, renders the inputs, and returns a typed value on submit. No form markup required.',
    },
    {
      question: 'How is ForgeForm different from Angular Reactive Forms?',
      answer: 'ForgeForm runs on Angular Reactive Forms under the hood, but you never write FormGroup/FormControl or template markup by hand. Instead of wiring controls, validators and error display manually, you declare one FormSchema and the engine builds and renders everything - so you keep full reactive-forms power without the boilerplate.',
    },
    {
      question: "Is ForgeForm the same as Angular's Signal Forms?",
      answer: "No. Angular's Signal Forms is a separate, experimental Angular feature. ForgeForm is an independent library that is signal-based - its form value and validity are exposed as Angular signals - while building on the stable Reactive Forms API, so you can use it in production on Angular 21+ today.",
    },
    {
      question: 'How do I create an Angular form from a TypeScript schema?',
      answer: 'Define a FormSchema object listing your controls (each with a type, controlName and optional validators), then drop <forge-form-angular [schema]="schema" (formSubmit)="onSubmit($event)" /> into your template. Import FormRendererComponent as a standalone component - no NgModule needed.',
    },
    {
      question: 'What field types and validation does ForgeForm support?',
      answer: 'Out of the box it ships text, number, checkbox and select fields, plus built-in required, minLength, maxLength, min and max validators. You can add your own rules with customValidator(), register custom field types, and customize every error message as a string, a function, or a component.',
    },
    {
      question: 'Is ForgeForm free, and which Angular version does it need?',
      answer: 'Yes - ForgeForm is free and open source under the MIT license. It requires Angular 21.2+ (@angular/core, @angular/common, @angular/forms) and RxJS 7.8+ as peer dependencies.',
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
