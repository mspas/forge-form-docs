# @forge-form/angular — Complete Library Reference

> **Purpose of this document:** This is the authoritative technical reference for the `@forge-form/angular` library, prepared as a source document for building user-facing documentation. It covers every public API, all schema models, all DI tokens, styling hooks, and extension points, with annotated code examples throughout.

---

## Table of Contents

1. [What Is This Library?](#what-is-this-library)
2. [Installation & Peer Dependencies](#installation--peer-dependencies)
3. [Quick Start](#quick-start)
4. [Core Concept: Schema-Driven Forms](#core-concept-schema-driven-forms)
5. [Schema Reference](#schema-reference)
   - [FormSchema](#formschema)
   - [GroupFieldSchema](#groupfieldschema)
   - [ControlSchema variants](#controlschema-variants)
   - [FormOptions / ElementFormOptions / FormFieldOptions](#formoptions--elementformoptions--formfieldoptions)
   - [UpdateOn](#updateon)
6. [Validators](#validators)
   - [Built-in validator helpers](#built-in-validator-helpers)
   - [Custom validators](#custom-validators)
   - [Error messages on validators](#error-messages-on-validators)
7. [Error Messages System](#error-messages-system)
   - [Default error messages](#default-error-messages)
   - [Overriding error messages globally](#overriding-error-messages-globally)
   - [Custom error components](#custom-error-components)
8. [Hint Messages System](#hint-messages-system)
   - [String hints](#string-hints)
   - [Custom hint components](#custom-hint-components)
9. [Conditional Visibility](#conditional-visibility)
10. [Custom Field Renderers](#custom-field-renderers)
11. [Styling](#styling)
    - [Layout SCSS](#layout-scss)
    - [Default theme](#default-theme)
    - [CSS custom properties](#css-custom-properties)
    - [CSS class reference](#css-class-reference)
12. [DI Tokens Reference](#di-tokens-reference)
13. [Public API Surface (exports)](#public-api-surface-exports)
14. [Architecture Overview](#architecture-overview)
15. [Full Working Example](#full-working-example)

---

## What Is This Library?

`@forge-form/angular` is a **schema-driven, signal-based reactive form engine** for Angular (v21+). You declare your entire form—fields, groups, validators, hints, error messages, layout, and conditional visibility—as a plain TypeScript object (`FormSchema`). The engine builds the underlying Angular `FormGroup`, renders the controls, wires validation, and emits a strongly-typed value on submit.

Key design decisions:

- **Schema-first** — No template code needed for the form structure.
- **Signal-based** — Internal state uses Angular signals with `OnPush` change detection throughout.
- **Reactive Forms under the hood** — Angular's `FormGroup` / `FormControl` are used internally; they are not exposed to consumer templates.
- **Standalone components** — No `NgModule` required anywhere in the library.
- **Extensible** — Custom field renderers, custom error components, custom hint components, injectable DI tokens.

---

## Installation & Peer Dependencies

```bash
npm install @forge-form/angular
```

| Peer dependency   | Required version |
| ----------------- | ---------------- |
| `@angular/core`   | `^21.2.0`        |
| `@angular/common` | `^21.2.0`        |
| `@angular/forms`  | `^21.2.0`        |
| `rxjs`            | `^7.8.0`         |

---

## Quick Start

```ts
// user-form.component.ts
import { Component } from '@angular/core';
import { FormRendererComponent, FormSchema, required, minLength } from '@forge-form/angular';

interface UserModel {
  firstName: string;
  age: number;
}

@Component({
  selector: 'app-user-form',
  imports: [FormRendererComponent],
  template: `
    <forge-form-angular [schema]="schema" (formSubmit)="onSubmit($event)" />
  `,
})
export class UserFormComponent {
  schema: FormSchema = {
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
        validators: [required()],
      },
    ],
  };

  onSubmit(value: UserModel) {
    console.log('Submitted', value);
  }
}
```

**Important:** You do **not** need to provide `FormRendererComponent` with any module. Import it directly as a standalone component. No additional `providers` are required at the application level for basic usage.

---

## Core Concept: Schema-Driven Forms

The entire form is described by a `FormSchema` object. This object drives:

1. **Control creation** — the engine creates `FormControl` instances for each field.
2. **Validation** — validators are attached to controls at build time.
3. **Layout** — orientation (`row`/`column`) for forms, groups, and individual fields.
4. **Rendering** — each control's `type` maps to a renderer component via a registry.
5. **Visibility** — each control can declare a visibility function that shows/hides or enables/disables it reactively.
6. **Hints & Errors** — each control can declare a hint and/or per-validator error messages.

The `FormSchema` is consumed by `<forge-form-angular>` which handles everything internally.

---

## Schema Reference

### `FormSchema`

The root object passed to `[schema]`.

```ts
interface FormSchema {
  controls: (GroupFieldSchema | ControlSchema)[];
  id?: string;
  updateOn?: UpdateOn; // 'change' | 'blur' | 'submit'
  options?: FormOptions;
}
```

| Property   | Type                                    | Required | Description                                                              |
| ---------- | --------------------------------------- | -------- | ------------------------------------------------------------------------ |
| `controls` | `(GroupFieldSchema \| ControlSchema)[]` | Yes      | Ordered list of top-level fields and/or groups.                          |
| `id`       | `string`                                | No       | Optional HTML `id` for the `<form>` element.                             |
| `updateOn` | `'change' \| 'blur' \| 'submit'`        | No       | Default update strategy for all controls. Can be overridden per-control. |
| `options`  | `FormOptions`                           | No       | Layout orientation and visual theme for the whole form.                  |

---

### `GroupFieldSchema`

Groups nest one or more controls (or sub-groups) in a row or column layout without adding a `FormControl` themselves.

```ts
interface GroupFieldSchema extends BaseElementSchema {
  type: 'group';
  controls: (GroupFieldSchema | ControlSchema)[];
  options?: ElementFormOptions; // orientation, labelOrientation
}
```

> **Note:** Groups are purely visual containers. All controls inside a group share the same flat `FormGroup` at the root level—there are no nested `FormGroup` instances. The `controlName` of each control inside a group must still be unique across the entire form.

**Example — side-by-side first/last name:**

```ts
{
  type: 'group',
  options: { orientation: 'row' },
  controls: [
    { type: 'text', controlName: 'firstName', label: 'First Name', options: { width: '250px' } },
    { type: 'text', controlName: 'lastName',  label: 'Last Name',  options: { width: '250px' } },
  ],
}
```

---

### `ControlSchema` variants

`ControlSchema` is a discriminated union:

```ts
type ControlSchema = TextControlSchema | NumberControlSchema | CheckboxControlSchema | SelectControlSchema;
```

All variants extend `BaseControlSchema`:

```ts
interface BaseControlSchema extends BaseElementSchema {
  controlName: string; // Unique key; used as FormControl name
  options?: FormFieldOptions; // width, orientation, labelOrientation
  initialValue?: unknown; // Initial value for the FormControl
  validators?: ValidatorSchema[];
  visibility?: VisibilitySchema;
  updateOn?: UpdateOn; // Overrides schema-level updateOn
  hint?: HintMessage; // string | HintComponentDef
}
```

#### `TextControlSchema` — `type: 'text'`

```ts
interface TextControlSchema extends BaseControlSchema {
  type: 'text';
  placeholder?: string;
}
```

Renders as `<input type="text">`.

| Property      | Description                                          |
| ------------- | ---------------------------------------------------- |
| `placeholder` | Input placeholder. Falls back to `label` if omitted. |

---

#### `NumberControlSchema` — `type: 'number'`

```ts
interface NumberControlSchema extends BaseControlSchema {
  type: 'number';
  placeholder?: string;
  min?: number; // Sets the HTML min attribute (visual only)
  max?: number; // Sets the HTML max attribute (visual only)
}
```

Renders as `<input type="number">`.

> **Note:** `min` / `max` on the schema set the HTML `min`/`max` attributes for browser UX. To enforce them as validation rules use `min()` / `max()` validators in the `validators` array.

---

#### `CheckboxControlSchema` — `type: 'checkbox'`

```ts
interface CheckboxControlSchema extends BaseControlSchema {
  type: 'checkbox';
}
```

Renders as `<input type="checkbox">`. The control value is `true` / `false`.

> **Tip:** Use `updateOn: 'change'` on a checkbox to ensure instant reactivity since checkboxes do not blur naturally.

---

#### `SelectControlSchema` — `type: 'select'`

```ts
interface SelectControlSchema extends BaseControlSchema {
  type: 'select';
  items: SelectOption[];
  placeholder?: string;
}

interface SelectOption {
  label: string; // Display text
  value: string; // Submitted value
}
```

Renders as `<select>` with `<option>` elements. If `placeholder` or `label` is set, a disabled placeholder option is rendered first.

---

### `FormOptions` / `ElementFormOptions` / `FormFieldOptions`

```ts
// Used in FormSchema.options
interface FormOptions {
  orientation?: 'row' | 'column'; // Layout direction of top-level controls
  labelOrientation?: 'row' | 'column'; // Label position relative to input
  theme?: 'none' | 'default'; // Visual theme; 'default' applies CSS variables
}

// Used in GroupFieldSchema.options
type ElementFormOptions = {
  orientation?: 'row' | 'column';
  labelOrientation?: 'row' | 'column';
};

// Used in BaseControlSchema.options
interface FormFieldOptions {
  orientation?: 'row' | 'column';
  labelOrientation?: 'row' | 'column';
  width?: number | string; // Sets inline width of the field container
}
```

**Precedence for `labelOrientation`:** field-level `options.labelOrientation` > form-level `options.labelOrientation` > default (`'column'`).

---

### `UpdateOn`

```ts
const UPDATE_ON = {
  change: 'change',
  blur: 'blur',
  submit: 'submit',
} as const;

type UpdateOn = 'change' | 'blur' | 'submit';
```

Can be set at the `FormSchema` level (applies to all controls) or overridden per individual control.

---

## Validators

### Built-in validator helpers

All helpers are imported from `@forge-form/angular` and return a `ValidatorSchema`.

```ts
import { required, minLength, maxLength, min, max, customValidator } from '@forge-form/angular';
```

| Helper              | Parameters                                              | Description                   |
| ------------------- | ------------------------------------------------------- | ----------------------------- |
| `required()`        | `credentials?` (only `errorMessage`)                    | Field is required.            |
| `minLength()`       | `{ value: number, errorMessage? }`                      | Minimum string length.        |
| `maxLength()`       | `{ value: number, errorMessage? }`                      | Maximum string length.        |
| `min()`             | `{ value: number, errorMessage? }`                      | Minimum numeric value.        |
| `max()`             | `{ value: number, errorMessage? }`                      | Maximum numeric value.        |
| `customValidator()` | `{ key: string, fn: ValidatorFunction, errorMessage? }` | Custom Angular `ValidatorFn`. |

**Example:**

```ts
validators: [required(), minLength({ value: 3, errorMessage: 'Too short' }), maxLength({ value: 100 }), min({ value: 0, errorMessage: 'Must be positive' }), max({ value: 120 })];
```

---

### Custom validators

Use `customValidator` with a unique `key` string and a standard Angular `ValidatorFn`:

```ts
customValidator({
  key: 'mustBeEven',
  fn: (control) => {
    const v = Number(control.value);
    return v % 2 === 0 ? null : { mustBeEven: true };
  },
  errorMessage: 'Value must be an even number',
});
```

The `key` is used to match the error key returned by the validator function. The same `key` must appear in the `ValidationErrors` object returned by `fn` for the error message to be displayed.

---

### Error messages on validators

Each validator helper accepts an optional `errorMessage` parameter of type `ErrorMessageContent`:

```ts
type ErrorMessageContent =
  | string // Static string
  | ((error: ValidationErrors) => string) // Function receiving the error object
  | ErrorComponentDef; // Custom component

interface ErrorComponentDef {
  component: Type<unknown>;
  inputs?: (data: unknown) => Record<string, unknown>;
}
```

**String:**

```ts
required({ errorMessage: 'This field cannot be empty' });
```

**Function** (receives the Angular `ValidationErrors` value for that key):

```ts
minLength({ value: 3, errorMessage: (err) => `Minimum ${err['requiredLength']} characters` });
```

**Custom component:**

```ts
min({
  value: 18,
  errorMessage: {
    component: AgeErrorComponent,
    inputs: () => ({ message: 'You must be at least 18' }),
  },
});
```

> **Priority:** A `errorMessage` on the validator itself takes precedence over any globally registered error message for that type.

---

## Error Messages System

### Default error messages

The engine ships with built-in messages for all standard validator types:

| Validator type | Default message                        |
| -------------- | -------------------------------------- |
| `required`     | `'This field is required'`             |
| `minlength`    | `'Minimum length is {requiredLength}'` |
| `maxlength`    | `'Maximum length is {requiredLength}'` |
| `min`          | `'Minimum value is {min}'`             |
| `max`          | `'Maximum value is {max}'`             |

If no message is found anywhere, a fallback `'Invalid field'` string is used.

---

### Overriding error messages globally

Provide `ERROR_MESSAGES` (a multi-provider token) in your application or component providers:

```ts
import { ERROR_MESSAGES, DEFAULT_ERROR_MESSAGES } from '@forge-form/angular';

// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    // Override a specific message
    {
      provide: ERROR_MESSAGES,
      useValue: [{ type: 'required', message: 'Required!' }],
      multi: true,
    },
  ],
};
```

> **Note:** `DEFAULT_ERROR_MESSAGES` is an `ErrorMessage[]` array that the `FormRendererComponent` already provides internally. You can re-export and merge it if needed.

To override the ultimate fallback string, provide `DEFAULT_ERROR_FALLBACK`:

```ts
import { DEFAULT_ERROR_FALLBACK } from '@forge-form/angular';

{ provide: DEFAULT_ERROR_FALLBACK, useValue: 'Invalid', multi: true }
```

---

### Custom error components

An error component is any Angular component. It receives whatever `inputs` the `ErrorComponentDef.inputs` function returns. No base class is required.

```ts
// my-error.component.ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-my-error',
  template: `
    <strong>{{ message() }}</strong>
  `,
})
export class MyErrorComponent {
  message = input.required<string>();
}
```

Reference from a validator:

```ts
validators: [
  min({
    value: 18,
    errorMessage: {
      component: MyErrorComponent,
      inputs: (err) => ({ message: `Must be at least ${err['min']}` }),
    },
  }),
];
```

The `inputs` function receives the raw `ValidationErrors` value for that error key and must return a `Record<string, unknown>`.

---

## Hint Messages System

Hints are displayed beneath the input when there are **no validation errors** on the control.

### String hints

```ts
{
  type: 'text',
  controlName: 'email',
  label: 'Email',
  hint: 'We will never share your email address.',
}
```

Renders as `<span class="forge-form-hint">`.

---

### Custom hint components

Provide a `HintComponentDef`:

```ts
interface HintComponentDef {
  component: Type<unknown>;
  inputs?: Record<string, unknown>; // Static inputs merged with context inputs
}
```

```ts
hint: {
  component: CharCounterComponent,
  inputs: { maxLength: 100 },
}
```

The engine **automatically merges** the following context inputs into custom hint components (in addition to any `inputs` you provide):

| Input           | Type                       | Description                          |
| --------------- | -------------------------- | ------------------------------------ |
| `control`       | `AbstractControl`          | The Angular form control instance.   |
| `controlValue`  | `unknown`                  | The current value of the control.    |
| `controlErrors` | `ValidationErrors \| null` | Current validation errors (if any).  |
| `controlSchema` | `ControlSchema`            | The schema definition of this field. |

To get full TypeScript support for these context inputs, extend `FormFieldContextComponent`:

```ts
import { Component, computed, input } from '@angular/core';
import { FormFieldContextComponent } from '@forge-form/angular';

@Component({
  selector: 'app-char-counter',
  template: `
    {{ currentLength() }} / {{ maxLength() }}
  `,
})
export class CharCounterComponent extends FormFieldContextComponent {
  maxLength = input<number>();
  currentLength = computed(() => (this.controlValue() as string | undefined)?.length ?? 0);
}
```

`FormFieldContextComponent` exposes these typed `input()` signals:

| Signal          | Type                       |
| --------------- | -------------------------- |
| `control`       | `AbstractControl<T>`       |
| `controlValue`  | `T`                        |
| `controlErrors` | `ValidationErrors \| null` |
| `controlSchema` | `unknown`                  |

> **Note:** `FormFieldContextComponent` is an abstract `@Directive`. It does **not** add a selector or template—it is purely a base class for typed input signals.

---

## Conditional Visibility

Each control can declare a `visibility` property:

```ts
interface VisibilitySchema {
  fn: VisibilityFunction; // Returns true = visible/enabled, false = hidden/disabled
  behavior: VisibilityBehavior; // 'hide' | 'disable'
  clearOnHide?: boolean; // Reset the control value when hidden/disabled
}

type VisibilityFunction = (context: VisibilityContext) => boolean;

interface VisibilityContext {
  value: unknown; // Current form value
  form: FormGroup; // The root FormGroup
  control: AbstractControl; // This control's AbstractControl
}
```

### Behavior modes

| Behavior    | Effect when `fn` returns `false`                                    |
| ----------- | ------------------------------------------------------------------- |
| `'hide'`    | The field container is removed from the DOM (`@if` block).          |
| `'disable'` | The `FormControl` is disabled (excluded from form value on submit). |

### `clearOnHide`

When `clearOnHide: true`, the control's value is reset to `null` when `fn` returns `false`. This prevents stale hidden values from being submitted.

**Example — show a field only when another is valid:**

```ts
{
  type: 'select',
  controlName: 'gender',
  label: 'Gender',
  items: [
    { value: 'female', label: 'Female' },
    { value: 'male',   label: 'Male'   },
  ],
  visibility: {
    fn: (ctx) => ctx.form.get('firstName')?.valid === true,
    behavior: 'hide',
    clearOnHide: true,
  },
}
```

---

## Custom Field Renderers

You can replace the built-in renderer for any `type` or add entirely new types.

### The `FieldRenderer` interface

Custom renderer components must implement `FieldRenderer<TSchema>`:

```ts
interface FieldRenderer<TSchema = unknown> {
  control: FormControl;
  controlSchema: TSchema;
}
```

Both properties are passed as Angular component `@Input()` bindings by the engine.

### Registering a custom renderer

Provide the `RENDERERS` multi-token (typically in your component's `providers` or `ApplicationConfig`):

```ts
import { RENDERERS } from '@forge-form/angular';
import { MyCustomRendererComponent } from './my-custom-renderer.component';

providers: [
  {
    provide: RENDERERS,
    useValue: { type: 'my-custom-type', component: MyCustomRendererComponent },
    multi: true,
  },
];
```

The `type` string must match the `type` property on the control schema. Once registered, the engine will use your component wherever a control with that type is encountered.

### Example — custom color-picker renderer

```ts
// color-picker-renderer.component.ts
import { Component, Input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FieldRenderer } from '@forge-form/angular';

@Component({
  selector: 'app-color-picker-renderer',
  template: `
    <input type="color" [formControl]="control" />
  `,
  imports: [ReactiveFormsModule],
})
export class ColorPickerRendererComponent implements FieldRenderer {
  @Input() control!: FormControl;
  @Input() controlSchema!: unknown;
}
```

```ts
// Register it
providers: [
  {
    provide: RENDERERS,
    useValue: { type: 'color', component: ColorPickerRendererComponent },
    multi: true,
  },
]

// Use it in schema
{ type: 'color', controlName: 'brandColor', label: 'Brand Color' }
```

---

## Styling

### Layout SCSS

Import to get the flexbox layout classes (no visual styling, just structure):

```scss
// styles.scss
@use '@forge-form/angular/styles' as forge;
```

Or in `angular.json`:

```json
"styles": ["node_modules/@forge-form/angular/styles/index.scss"]
```

### Default theme

Import the default visual theme additionally:

```scss
@use '@forge-form/angular/styles' as forge;
@use '@forge-form/angular/styles/default' as forge-theme;
```

Or in `angular.json`:

```json
"styles": [
  "node_modules/@forge-form/angular/styles/index.scss",
  "node_modules/@forge-form/angular/styles/default.scss"
]
```

Then set `theme: 'default'` in `FormSchema.options`:

```ts
options: {
  theme: 'default';
}
```

This adds the `.forge-theme-default` class to the `<form>` element.

---

### CSS custom properties

The default theme exposes these CSS custom properties (scoped to `.forge-theme-default`):

| Property                 | Default value        | Used for                     |
| ------------------------ | -------------------- | ---------------------------- |
| `--forge-gap-small-xx`   | `2px`                | Field container gap          |
| `--forge-gap-small-x`    | `0.25rem`            | —                            |
| `--forge-gap-small`      | `0.5rem`             | Form gap between controls    |
| `--forge-gap-medium`     | `0.75rem`            | Group gap between fields     |
| `--forge-border-radius`  | `0.25rem`            | Input / button border radius |
| `--forge-color-label`    | `#202020`            | Label and hint text color    |
| `--forge-color-border`   | `rgba(32,32,32,0.5)` | Input border color           |
| `--forge-color-disabled` | `#b6b6b6`            | Disabled button text/border  |
| `--forge-color-error`    | `#b60000`            | Error message text color     |

Override any variable to customize the theme without touching the library code:

```css
forge-form-angular {
  --forge-color-error: #cc0000;
  --forge-border-radius: 0.5rem;
}
```

---

### CSS class reference

| CSS class                             | Element                        | Notes                                    |
| ------------------------------------- | ------------------------------ | ---------------------------------------- |
| `.forge-form`                         | `<form>`                       | Root form element                        |
| `.forge-form--row`                    | `<form>`                       | When `options.orientation = 'row'`       |
| `.forge-form--column`                 | `<form>`                       | When `options.orientation = 'column'`    |
| `.forge-theme-default`                | `<form>`                       | Added when `options.theme = 'default'`   |
| `.forge-form-group`                   | Group container `<div>`        |                                          |
| `.forge-form-group--row`              | Group container `<div>`        | When group `options.orientation = 'row'` |
| `.forge-form-group--column`           | Group container `<div>`        |                                          |
| `.forge-form-field-container`         | Per-field wrapper `<div>`      |                                          |
| `.forge-form-field-container--row`    | Per-field wrapper `<div>`      | When `labelOrientation = 'row'`          |
| `.forge-form-field-container--column` | Per-field wrapper `<div>`      | When `labelOrientation = 'column'`       |
| `.forge-form-field-label`             | `<span>` for the label text    |                                          |
| `.forge-form-input`                   | `<input type="text/number">`   |                                          |
| `.forge-form-checkbox`                | `<input type="checkbox">`      |                                          |
| `.forge-form-select`                  | `<select>`                     |                                          |
| `.forge-form-hint`                    | `<span>` for string hints      |                                          |
| `.forge-form-error`                   | `<span>` for string error msgs |                                          |
| `.forge-form-button`                  | Submit `<button>`              | Disabled when form is invalid            |

---

## DI Tokens Reference

| Token                    | Type             | Multi | Description                                                                                |
| ------------------------ | ---------------- | ----- | ------------------------------------------------------------------------------------------ |
| `FORM_OPTIONS`           | `FormOptions`    | No    | Inject global form options. Used by `FormFieldComponent` to inherit layout defaults.       |
| `RENDERERS`              | `RendererDef[]`  | Yes   | Register custom field renderer components.                                                 |
| `ERROR_MESSAGES`         | `ErrorMessage[]` | Yes   | Register or override global error messages. Each entry is `{ type, message }`.             |
| `DEFAULT_ERROR_FALLBACK` | `string`         | Yes   | The catch-all error message when no specific message is found. Default: `'Invalid field'`. |

---

## Public API Surface (exports)

Everything exported from `@forge-form/angular`:

### Components & Directives

| Export                      | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `FormRendererComponent`     | Main entry component. `[schema]` input, `(formSubmit)` output. |
| `FormFieldContextComponent` | Abstract base class for custom hint/error components.          |

### Schema models (types)

| Export                  | Description                                 |
| ----------------------- | ------------------------------------------- |
| `FormSchema`            | Root schema object                          |
| `GroupFieldSchema`      | Group container schema                      |
| `ControlSchema`         | Union of all control schema types           |
| `BaseElementSchema`     | Base with `type` and `label`                |
| `BaseControlSchema`     | Base with `controlName`, `validators`, etc. |
| `TextControlSchema`     | Schema for `type: 'text'`                   |
| `NumberControlSchema`   | Schema for `type: 'number'`                 |
| `CheckboxControlSchema` | Schema for `type: 'checkbox'`               |
| `SelectControlSchema`   | Schema for `type: 'select'`                 |
| `SelectOption`          | `{ label: string, value: string }`          |
| `FieldRenderer`         | Interface for custom renderer components    |

### Options models (types + constants)

| Export                | Description                                     |
| --------------------- | ----------------------------------------------- |
| `FormOptions`         | Form-level options type                         |
| `ElementFormOptions`  | Group-level options type                        |
| `FormFieldOptions`    | Field-level options type                        |
| `OrientationOption`   | `'row' \| 'column'`                             |
| `ThemeOption`         | `'none' \| 'default'`                           |
| `ORIENTATION_OPTIONS` | `{ row: 'row', column: 'column' }` constant     |
| `THEMES`              | `{ none: 'none', default: 'default' }` constant |

### Update-on

| Export      | Description                         |
| ----------- | ----------------------------------- |
| `UPDATE_ON` | `{ change, blur, submit }` constant |
| `UpdateOn`  | `'change' \| 'blur' \| 'submit'`    |

### Visibility

| Export                 | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `VisibilitySchema`     | Visibility config type (`fn`, `behavior`, etc.) |
| `VisibilityFunction`   | `(ctx: VisibilityContext) => boolean`           |
| `VisibilityBehavior`   | `'hide' \| 'disable'`                           |
| `VisibilityContext`    | `{ value, form, control }` passed to `fn`       |
| `VISIBILITY_BEHAVIORS` | `{ hide: 'hide', disable: 'disable' }` constant |

### Validators

| Export                     | Description                                                     |
| -------------------------- | --------------------------------------------------------------- |
| `required()`               | Required validator helper                                       |
| `minLength()`              | Min-length validator helper                                     |
| `maxLength()`              | Max-length validator helper                                     |
| `min()`                    | Min-value validator helper                                      |
| `max()`                    | Max-value validator helper                                      |
| `customValidator()`        | Custom `ValidatorFn` helper                                     |
| `ValidatorCredentials`     | Input type for all validator helpers                            |
| `ValidatorSchema`          | Union of all validator schema types                             |
| `ValidatorType`            | `'required' \| 'minlength' \| ...`                              |
| `ValidatorFunction`        | Angular `ValidatorFn` alias                                     |
| `BaseValidatorSchema`      | Base with `type` and `errorMessage`                             |
| `RequiredValidatorSchema`  | —                                                               |
| `MinLengthValidatorSchema` | Has `value: number`                                             |
| `MaxLengthValidatorSchema` | Has `value: number`                                             |
| `MinValidatorSchema`       | Has `value: number`                                             |
| `MaxValidatorSchema`       | Has `value: number`                                             |
| `CustomValidatorSchema`    | Has `key: string`, `fn: ValidatorFunction`                      |
| `VALIDATOR_TYPES`          | `{ required, minlength, maxlength, min, max, custom }` constant |

### Error messages

| Export                   | Description                                               |
| ------------------------ | --------------------------------------------------------- |
| `ERROR_MESSAGES`         | DI token (multi)                                          |
| `DEFAULT_ERROR_FALLBACK` | DI token (multi, string)                                  |
| `DEFAULT_ERROR_MESSAGES` | Built-in `ErrorMessage[]` array                           |
| `ErrorMessage`           | `{ type: ValidatorType, message: ErrorMessageContent }`   |
| `ErrorMessageContent`    | `string \| ((err) => string) \| ErrorComponentDef`        |
| `ErrorComponentDef`      | `{ component: Type<unknown>, inputs?: (data) => Record }` |

### Hint messages

| Export             | Description                                                             |
| ------------------ | ----------------------------------------------------------------------- |
| `HINT_TYPES`       | `{ text: 'text', custom: 'custom' }` constant                           |
| `HintMessage`      | `string \| HintComponentDef`                                            |
| `HintComponentDef` | `{ component: Type<unknown>, inputs?: Record<string, unknown> }`        |
| `HintContext`      | `{ control, value, errors }` (internal, not used by consumers directly) |
| `HintType`         | `'text' \| 'custom'`                                                    |

### DI tokens & registries

| Export             | Description                                           |
| ------------------ | ----------------------------------------------------- |
| `FORM_OPTIONS`     | DI token for injecting `FormOptions`                  |
| `RENDERERS`        | DI token (multi) for registering renderers            |
| `RendererRegistry` | Injectable service for renderer lookup (internal use) |
| `RendererDef`      | `{ type: string, component: Type<FieldRenderer> }`    |

---

## Architecture Overview

```
FormRendererComponent  ← consumer places this tag
  │  inputs: [schema]
  │  outputs: (formSubmit)
  │
  ├─ FormService         (per-component injectable)
  │    buildForm() via FormBuilderService
  │    applyVisibility()
  │    form signal (FormGroup | null)
  │    value signal (TModel | null)
  │
  ├─ FormBuilderService  (per-component injectable)
  │    Converts FormSchema → FormGroup
  │    Attaches Angular validators
  │
  ├─ RendererRegistry    (per-component injectable)
  │    Maps type string → component class
  │    Populated via RENDERERS multi-token
  │
  ├─ For each control in schema.controls:
  │    ├─ GroupRendererComponent  (if type === 'group')
  │    │    └─ Recurses with same FormGroup
  │    │
  │    └─ FormFieldComponent      (all other types)
  │         ├─ Resolves renderer component via RendererRegistry
  │         ├─ Computes labelOrientation (field > form > default)
  │         ├─ Computes visibilityResolved (calls visibility.fn reactively)
  │         ├─ Applies visibility behavior (hide DOM | disable control)
  │         ├─ NgComponentOutlet → renders the field renderer
  │         ├─ HintRendererComponent
  │         │    └─ HintMessageService
  │         └─ ErrorRendererComponent
  │              └─ ErrorMessageService
  │                   └─ ErrorMessageRegistry
```

---

## Full Working Example

This example demonstrates all major features: groups, validators with custom messages, hints with custom components, a custom component error, and conditional visibility.

```ts
// app.component.ts
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormRendererComponent, FormSchema, FormFieldContextComponent, required, minLength, maxLength, min, customValidator } from '@forge-form/angular';
import { Component as NgComponent, input, computed } from '@angular/core';

// --- Custom hint component ---
@NgComponent({
  selector: 'app-char-counter',
  template: `{{ current() }} / {{ maxLength() }} characters`,
})
export class CharCounterComponent extends FormFieldContextComponent {
  maxLength = input<number>(0);
  current = computed(() => (this.controlValue() as string)?.length ?? 0);
}

// --- Custom error component ---
@NgComponent({
  selector: 'app-age-error',
  template: `<strong style="color:red">{{ message() }}</strong>`,
})
export class AgeErrorComponent {
  message = input.required<string>();
}

// --- Main form component ---
@Component({
  selector: 'app-root',
  imports: [FormRendererComponent],
  template: `
    <forge-form-angular [schema]="schema" (formSubmit)="onSubmit($event)" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  schema: FormSchema = {
    updateOn: 'blur',
    options: {
      orientation: 'column',
      labelOrientation: 'column',
      theme: 'default',
    },
    controls: [
      // Group — first + last name side by side
      {
        type: 'group',
        options: { orientation: 'row' },
        controls: [
          {
            type: 'text',
            controlName: 'firstName',
            label: 'First Name',
            placeholder: 'Enter first name',
            updateOn: 'change',
            validators: [required(), minLength({ value: 3, errorMessage: 'Too short (min 3)' }), maxLength({ value: 50 })],
            hint: {
              component: CharCounterComponent,
              inputs: { maxLength: 50 },
            },
            options: { width: '200px' },
          },
          {
            type: 'text',
            controlName: 'lastName',
            label: 'Last Name',
            placeholder: 'Enter last name',
            validators: [required(), minLength({ value: 2 })],
            hint: 'Your family name as it appears on official documents.',
            options: { width: '200px' },
          },
        ],
      },

      // Number field with custom error component
      {
        type: 'number',
        controlName: 'age',
        label: 'Age',
        min: 0,
        max: 120,
        validators: [
          required(),
          min({
            value: 18,
            errorMessage: {
              component: AgeErrorComponent,
              inputs: () => ({ message: 'You must be 18 or older.' }),
            },
          }),
        ],
        options: { width: '120px' },
      },

      // Checkbox with custom validator
      {
        type: 'checkbox',
        controlName: 'acceptTerms',
        label: 'I accept the Terms and Conditions',
        updateOn: 'change',
        validators: [
          customValidator({
            key: 'mustAccept',
            fn: (ctrl) => (ctrl.value === true ? null : { mustAccept: true }),
            errorMessage: 'You must accept the terms and conditions.',
          }),
        ],
        options: { labelOrientation: 'row' },
      },

      // Select — only visible when first AND last name are valid
      {
        type: 'select',
        controlName: 'gender',
        label: 'Gender',
        placeholder: 'Select one…',
        items: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'other', label: 'Other' },
        ],
        visibility: {
          fn: (ctx) => ctx.form.get('firstName')?.valid === true && ctx.form.get('lastName')?.valid === true,
          behavior: 'hide',
          clearOnHide: true,
        },
        options: { width: '200px' },
      },
    ],
  };

  onSubmit(value: unknown) {
    console.log('Form value:', value);
  }
}
```

```scss
/* styles.scss */
@use '@forge-form/angular/styles' as forge;
@use '@forge-form/angular/styles/default' as forge-default;
```

---

_End of reference document. Version: 1.0.0 (2026-06-15)_
