import {
  ChangeDetectionStrategy,
  Component,
  effect,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormRendererComponent,
  FormSchema,
  minLength,
  required,
} from '@forge-form/angular';
import { Subscription } from 'rxjs';
import { CodeBlock } from '../../../shared/code-block/code-block';

/** The TypeScript source shown in the left pane — kept in sync with `buildSchema()`. */
const SCHEMA_SOURCE = `// describe it once
schema: FormSchema = {
  updateOn: 'blur',
  options: { orientation: 'column', theme: 'default' },
  controls: [
    { type: 'text', controlName: 'firstName',
      label: 'First name',
      validators: [required(), minLength({ value: 3 })] },
    { type: 'number', controlName: 'age',
      label: 'Age', validators: [required()] },
    { type: 'checkbox', controlName: 'employed',
      label: 'Currently employed?', updateOn: 'change' },
    { type: 'text', controlName: 'company',
      label: 'Company',
      visibility: { fn: c => !c.value.employed,
        behavior: 'hide', clearOnHide: true } },
  ],
};

// then, in the template
<forge-form-angular [schema]="schema"
  (formSubmit)="onSubmit($event)" />`;

@Component({
  selector: 'app-playground',
  imports: [FormRendererComponent, CodeBlock],
  templateUrl: './playground.html',
  styleUrl: './playground.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Playground {
  protected readonly source = SCHEMA_SOURCE;

  protected readonly schema = signal<FormSchema>(this.buildSchema());
  protected readonly value = signal<Record<string, unknown>>({});
  protected readonly submitted = signal(false);

  private readonly renderer = viewChild(FormRendererComponent);
  private sub?: Subscription;

  constructor() {
    // Mirror the real FormGroup's live value into a signal for the readout.
    effect((onCleanup) => {
      const form = this.renderer()?.formSignal();
      this.sub?.unsubscribe();
      if (!form) return;
      this.value.set(form.value);
      this.sub = form.valueChanges.subscribe(() => this.value.set(form.value));
      onCleanup(() => this.sub?.unsubscribe());
    });
  }

  protected onSubmit(): void {
    this.submitted.set(true);
  }

  protected reset(): void {
    this.submitted.set(false);
    this.value.set({});
    this.schema.set(this.buildSchema()); // fresh schema → engine rebuilds the form
  }

  protected get valueJson(): string {
    const v = this.value() ?? {};
    const parts: string[] = [];
    if ('firstName' in v) parts.push(`firstName: "${v['firstName'] ?? ''}"`);
    if ('age' in v) {
      const age = v['age'];
      parts.push(`age: ${age === '' || age == null ? 'null' : Number(age)}`);
    }
    if ('employed' in v) parts.push(`employed: ${!!v['employed']}`);
    if (v['employed'] && 'company' in v)
      parts.push(`company: "${v['company'] ?? ''}"`);
    return `{ ${parts.join(', ')} }`;
  }

  private buildSchema(): FormSchema {
    return {
      updateOn: 'blur',
      options: { orientation: 'column', theme: 'default' },
      controls: [
        {
          type: 'text',
          controlName: 'firstName',
          label: 'First name',
          placeholder: 'Enter your first name',
          validators: [required(), minLength({ value: 3 })],
        },
        {
          type: 'number',
          controlName: 'age',
          label: 'Age',
          placeholder: '0',
          validators: [required()],
        },
        {
          type: 'checkbox',
          controlName: 'employed',
          label: 'Currently employed?',
          updateOn: 'change',
          options: { labelOrientation: 'row' },
        },
        {
          type: 'text',
          controlName: 'company',
          label: 'Company',
          placeholder: 'Where do you work?',
          visibility: {
            // real-engine semantics: fn truthy ⇒ hide. Hide while NOT employed.
            fn: (c) => !(c.value as { employed?: boolean })?.employed,
            behavior: 'hide',
            clearOnHide: true,
          },
        },
      ],
    };
  }
}
