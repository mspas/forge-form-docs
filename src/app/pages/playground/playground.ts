import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormRendererComponent, FormSchema } from '@forge-form/angular';
import { Subscription } from 'rxjs';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { SeoService } from '../../shared/seo.service';

const DEFAULT_JSON = JSON.stringify(
  {
    updateOn: 'blur',
    options: { orientation: 'column', theme: 'default' },
    controls: [
      {
        type: 'text',
        controlName: 'firstName',
        label: 'First name',
        placeholder: 'Enter your first name',
        validators: [{ type: 'required' }, { type: 'minlength', value: 3 }],
      },
      {
        type: 'number',
        controlName: 'age',
        label: 'Age',
        placeholder: '0',
        validators: [{ type: 'required' }],
      },
      {
        type: 'checkbox',
        controlName: 'employed',
        label: 'Currently employed?',
        updateOn: 'change',
        options: { labelOrientation: 'row' },
      },
      {
        type: 'select',
        controlName: 'plan',
        label: 'Plan',
        placeholder: 'Pick a plan',
        items: [
          { label: 'Free', value: 'free' },
          { label: 'Pro', value: 'pro' },
          { label: 'Enterprise', value: 'enterprise' },
        ],
      },
    ],
  },
  null,
  2,
);

@Component({
  selector: 'app-playground',
  imports: [RouterLink, Header, Footer, FormRendererComponent],
  templateUrl: './playground.html',
  styleUrl: './playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playground {
  protected readonly jsonSource = signal(DEFAULT_JSON);
  protected readonly parseError = signal<string | null>(null);
  protected readonly schema = signal<FormSchema>(JSON.parse(DEFAULT_JSON) as FormSchema);
  protected readonly value = signal<Record<string, unknown>>({});
  protected readonly valid = signal(false);
  protected readonly submitted = signal(false);

  private readonly renderer = viewChild(FormRendererComponent);
  private sub?: Subscription;

  constructor() {
    inject(SeoService).update({
      title: 'ForgeForm Playground - Edit a FormSchema, see the form live',
      description:
        'Interactive ForgeForm playground: edit a FormSchema as JSON and watch the Angular form re-render live, with validation state and the typed form value updating as you type.',
      path: 'playground',
    });

    effect((onCleanup) => {
      const form = this.renderer()?.formSignal();
      this.sub?.unsubscribe();
      if (!form) return;
      this.value.set(form.value);
      this.valid.set(form.valid);
      this.sub = form.valueChanges.subscribe(() => {
        this.value.set(form.value);
        this.valid.set(form.valid);
      });
      onCleanup(() => this.sub?.unsubscribe());
    });
  }

  protected onSourceChange(raw: string): void {
    this.jsonSource.set(raw);
    this.submitted.set(false);
    try {
      const parsed = JSON.parse(raw) as FormSchema;
      this.schema.set(parsed);
      this.parseError.set(null);
    } catch (e) {
      this.parseError.set(e instanceof Error ? e.message : String(e));
    }
  }

  protected onSubmit(): void {
    this.submitted.set(true);
  }

  protected reset(): void {
    this.submitted.set(false);
    this.value.set({});
    this.parseError.set(null);
    this.jsonSource.set(DEFAULT_JSON);
    this.schema.set(JSON.parse(DEFAULT_JSON) as FormSchema);
  }

  protected get valueJson(): string {
    const v = this.value();
    if (!v || Object.keys(v).length === 0) return '{}';
    return JSON.stringify(v);
  }

  /** Top-level control count of the last successfully parsed schema. */
  protected get controlCount(): number {
    const controls = this.schema().controls;
    return Array.isArray(controls) ? controls.length : 0;
  }
}
