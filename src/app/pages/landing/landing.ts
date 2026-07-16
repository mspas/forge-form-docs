import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FormRendererComponent,
  FormSchema,
  minLength,
  required,
} from '@forge-form/angular';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { CodeBlock } from '../../shared/code-block/code-block';
import { NPM_INSTALL } from '../../shared/site';
import { SeoService } from '../../shared/seo.service';

/** A single cell in the feature grid; `wide` cells span two columns. */
interface Feature {
  eyebrow: string;
  title: string;
  body: string;
  wide?: boolean;
  code?: string;
  mono?: string[];
}

/** A step in the "three lines to a working form" list. */
interface QuickStep {
  n: string;
  text: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-landing',
  imports: [RouterLink, Header, Footer, CodeBlock, FormRendererComponent],
  templateUrl: './landing.html',
  styleUrl: './landing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  readonly install = NPM_INSTALL;

  protected readonly copied = signal(false);

  /** Index of the currently expanded FAQ item; first one open by default. */
  protected readonly openFaq = signal<number | null>(0);

  constructor() {
    inject(SeoService).update({
      title: 'ForgeForm - Schema-based forms library for Angular 21+',
      description:
        'ForgeForm turns a plain TypeScript schema into a fully-wired Angular form - FormGroup, signals, validation, hints, error messages and conditional fields. No boilerplate.',
      path: '',
    });
  }

  /** The live form rendered in the hero card - mirrors `heroSchemaCode`. */
  readonly heroSchema: FormSchema = {
    options: { orientation: 'column', theme: 'default' },
    controls: [
      {
        type: 'text',
        controlName: 'projectName',
        label: 'Project name',
        placeholder: 'my-app',
        validators: [required(), minLength({ value: 3 })],
      },
      {
        type: 'select',
        controlName: 'framework',
        label: 'Framework',
        placeholder: 'Choose…',
        items: [
          { label: 'Angular standalone', value: 'ng' },
          { label: 'Nx workspace', value: 'nx' },
        ],
      },
      {
        type: 'checkbox',
        controlName: 'ssr',
        label: 'Enable SSR',
        updateOn: 'change',
        options: { labelOrientation: 'row' },
      },
    ],
  };

  readonly heroSchemaCode = `const schema: FormSchema = {
  controls: [
    { type: 'text', controlName: 'projectName',
      label: 'Project name', placeholder: 'my-app',
      validators: [required(), minLength({ value: 3 })] },
    { type: 'select', controlName: 'framework',
      label: 'Framework', items: [/* … */] },
    { type: 'checkbox', controlName: 'ssr',
      label: 'Enable SSR', updateOn: 'change' },
  ],
};`;

  readonly heroMeta = [
    'Standalone',
    'Customizable',
    'Reactive Forms generator',
  ];

  readonly validatorsCode = `validators: [
  required(),
  minLength({ value: 3, errorMessage: 'Too short' }),
  min({ value: 18,
    errorMessage: (err) => \`Must be at least \${err['min']}\` }),
]`;

  readonly features: Feature[] = [
    {
      wide: true,
      eyebrow: 'Validation',
      title: 'Built-in rules, custom messages, your own validators.',
      body: 'required(), minLength(), min() - or a custom validator fn with a matching error key. Every message can be the built-in default, a string, a function, or a component.',
      code: this.validatorsCode,
    },
    {
      eyebrow: 'State',
      title: 'Live signals',
      body: 'Form value and validity are exposed as signals - read them in templates, computeds and effects to drive a preview or your own submit button. No subscriptions.',
      mono: ['form.value()', 'form.valid()'],
    },
    {
      eyebrow: 'Visibility',
      title: 'Conditional fields',
      body: 'Show, hide, enable or disable any field from the rest of the form.',
    },
    {
      eyebrow: 'Extend',
      title: 'Your own components, inside the form',
      body: 'Render your own components as hints or error messages. Hint components are handed the live control, value, errors and schema - extend FormFieldContextComponent for typed access.',
    },
    {
      eyebrow: 'Theming',
      title: 'CSS-variable theme',
      body: 'Take just the flexbox structure, or the bundled theme, then re-skin it by overriding a handful of CSS variables. Nothing is locked in.',
    },
  ];

  readonly steps: QuickStep[] = [
    { n: '01', text: 'Install the package plus its Angular peer deps (v21+).' },
    {
      n: '02',
      text: 'Import FormRendererComponent and the validators you need.',
    },
    { n: '03', text: 'Render <forge-form-angular> and read the submit event.' },
  ];

  readonly quickStartCode = `import { FormRendererComponent, FormSchema,
         required, minLength } from '@forge-form/angular';

@Component({
  selector: 'app-user-form',
  imports: [FormRendererComponent],
  template: \`<forge-form-angular
    [schema]="schema"
    (formSubmit)="onSubmit($event)" />\`,
})
export class UserFormComponent {
  schema: FormSchema = {
    updateOn: 'blur',
    options: { orientation: 'column', theme: 'default' },
    controls: [
      { type: 'text', controlName: 'firstName',
        label: 'First name',
        validators: [required(), minLength({ value: 3 })] },
      { type: 'number', controlName: 'age',
        label: 'Age', validators: [required()] },
    ],
  };
  onSubmit(value: unknown) { console.log(value); }
}`;

  readonly faqs: FaqItem[] = [
    {
      question: 'What is ForgeForm?',
      answer:
        'ForgeForm (@forge-form/angular) is a schema-driven, signal-based forms library for Angular 21+. You describe your form as a plain TypeScript object - fields, validators, hints, layout and conditional visibility - and ForgeForm builds the Angular reactive form, renders the inputs, and returns a typed value on submit. No form markup required.',
    },
    {
      question: 'How is ForgeForm different from Angular Reactive Forms?',
      answer:
        'ForgeForm runs on Angular Reactive Forms under the hood, but you never write FormGroup/FormControl or template markup by hand. Instead of wiring controls, validators and error display manually, you declare one FormSchema and the engine builds and renders everything - so you keep full reactive-forms power without the boilerplate.',
    },
    {
      question: "Is ForgeForm the same as Angular's Signal Forms?",
      answer:
        "No. Angular's Signal Forms is a separate, experimental Angular feature. ForgeForm is an independent library that is signal-based - its form value and validity are exposed as Angular signals - while building on the stable Reactive Forms API, so you can use it in production on Angular 21+ today.",
    },
    {
      question: 'How do I create an Angular form from a TypeScript schema?',
      answer:
        'Define a FormSchema object listing your controls (each with a type, controlName and optional validators), then drop <forge-form-angular [schema]="schema" (formSubmit)="onSubmit($event)" /> into your template. Import FormRendererComponent as a standalone component - no NgModule needed.',
    },
    {
      question: 'What field types and validation does ForgeForm support?',
      answer:
        'Out of the box it ships text, number, checkbox and select fields, plus built-in required, minLength, maxLength, min and max validators. You can add your own rules with customValidator(), set any error message as a string, a function or a component, and add hints as text or your own component.',
    },
    {
      question: 'Is ForgeForm free, and which Angular version does it need?',
      answer:
        'Yes - ForgeForm is free and open source under the MIT license. It requires Angular 21.2+ (@angular/core, @angular/common, @angular/forms) and RxJS 7.8+ as peer dependencies.',
    },
  ];

  toggleFaq(index: number): void {
    this.openFaq.update((current) => (current === index ? null : index));
  }

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
