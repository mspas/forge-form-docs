# @forge-form/angular - User Guide

**Version:** 1.1.1 · **License:** MIT

---

## Table of Contents

1. [What Is Forge Form?](#what-is-forge-form)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concept: Schema-Driven Forms](#core-concept-schema-driven-forms)
5. [Building a Schema](#building-a-schema)
   - [The form](#the-form)
   - [Groups](#groups)
   - [Field types](#field-types)
   - [Layout & sizing options](#layout--sizing-options)
   - [When values update](#when-values-update)
6. [Reading Live Form State](#reading-live-form-state)
7. [Validation](#validation)
   - [Built-in validators](#built-in-validators)
   - [Custom validators](#custom-validators)
   - [Customizing error messages](#customizing-error-messages)
8. [Hints](#hints)
9. [Conditional Visibility](#conditional-visibility)
10. [Custom Field Types](#custom-field-types)
11. [Styling & Theming](#styling--theming)
12. [Full Working Example](#full-working-example)
13. [Known Limitations in 1.1.1](#known-limitations-in-111)

---

## Known Limitations in 1.1.1

Before you build against this guide, a few parts of the API are **declared but not wired up**, and the visibility predicate runs **inverted** relative to its name. Each is verified against the shipped build and explained where it comes up:

- **Custom field types don't work.** You are limited to `text`, `number`, `checkbox`, `select`. See [Custom Field Types](#custom-field-types).
- **App-wide error message overrides don't work.** Set the message on the validator instead. See [Changing defaults app-wide](#changing-defaults-app-wide).
- **`visibility.fn` returning `true` HIDES the field** (not shows it). See [Conditional Visibility](#conditional-visibility).
- **`clearOnHide` does nothing** — hidden fields keep their value and still submit it.
- **`FormSchema.id`** is accepted but never rendered.
- **`labelOrientation` on a group** is ignored; set it per field or form-wide.

Everything else in this guide — validators and their messages, hints, `value()` / `valid()`, `hideSubmitButton`, layout, theming, `updateOn` — behaves as described.

---

## What Is Forge Form?

`@forge-form/angular` lets you build Angular forms by describing them as a plain TypeScript object instead of writing template markup. You declare your fields, groups, validators, hints, error messages, layout, and conditional visibility in one `FormSchema`, drop a single `<forge-form-angular>` tag in your template, and the library renders the form, wires up validation, and hands you a typed value when the user submits.

What this gives you:

- **No form markup to write** - the structure lives in your schema, not your template.
- **Reactive Forms power without the boilerplate** - Angular's reactive forms run under the hood; you never touch `FormGroup`/`FormControl` directly.
- **Standalone** - just import the component. No `NgModule`, no app-wide setup for basic use.
- **Extensible where it counts** - plug in your own error components and hint components. (Custom _field types_ are not usable in 1.1.1 - see [Custom Field Types](#custom-field-types).)

Requires **Angular v21+**.

---

## Installation

```bash
npm install @forge-form/angular
```

The library expects these peer dependencies in your project:

| Peer dependency   | Required version |
| ----------------- | ---------------- |
| `@angular/core`   | `^21.2.0`        |
| `@angular/common` | `^21.2.0`        |
| `@angular/forms`  | `^21.2.0`        |
| `rxjs`            | `^7.8.0`         |

---

## Quick Start

Import `FormRendererComponent`, declare a schema, and render it:

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

That's the whole setup. Import the component, no module or app-level providers needed for basic use. The `(formSubmit)` event fires with the form's value - keyed by each control's `controlName` - only when the form is valid.

---

## Core Concept: Schema-Driven Forms

You describe the entire form as one `FormSchema` object. That single object drives everything:

1. **What fields exist** and the values they collect.
2. **Validation** - which rules apply to each field.
3. **Layout** - rows vs. columns for the form, groups, and individual fields.
4. **Rendering** - each field's `type` decides which input is drawn.
5. **Visibility** - fields can show/hide or enable/disable based on other values.
6. **Hints & errors** - helper text and per-rule error messages per field.

You pass the schema to `<forge-form-angular>` and it handles the rest.

---

## Building a Schema

### The form

The root `FormSchema` is the object you pass to `[schema]`:

```ts
interface FormSchema {
  controls: (GroupFieldSchema | ControlSchema)[]; // your fields and groups
  id?: string; // accepted, but not applied in 1.1.1
  updateOn?: 'change' | 'blur' | 'submit'; // default update strategy
  options?: FormOptions; // layout + theme
}
```

| Property   | What it does                                                                  |
| ---------- | ----------------------------------------------------------------------------- |
| `controls` | **Required.** The ordered list of fields and groups that make up the form.    |
| `id`       | **No effect in 1.1.1.** See the note below.                                   |
| `updateOn` | When values/validation refresh by default - see [below](#when-values-update). |
| `options`  | Form-wide layout and theme - see [layout options](#layout--sizing-options).   |

> **`id` is never applied.** The property exists on the interface, but the rendered `<form>` only ever receives `class`, `formGroup`, and a submit handler — no `id` attribute reaches the DOM. If you need to target the form element (for a label, a test hook, or an external submit button), wrap `<forge-form-angular>` in a container of your own and target that instead.

Form-level `options`:

```ts
interface FormOptions {
  orientation?: 'row' | 'column'; // direction top-level controls flow
  labelOrientation?: 'row' | 'column'; // label beside (row) or above (column) inputs
  theme?: 'none' | 'default'; // 'default' applies the bundled visual theme
  hideSubmitButton?: boolean; // remove the built-in submit button
}
```

**`hideSubmitButton`:** set to `true` when you want to drive submission with your own button instead of the built-in one. The button is removed entirely (not just disabled). Pair this with the [`valid` signal](#reading-live-form-state) to gate your own button.

---

### Groups

A group lays out several fields together in a row or column. Groups are **purely visual** - they don't collect a value of their own, and every field keeps its own top-level `controlName`. Each `controlName` must be unique across the whole form, even inside groups.

```ts
{
  type: 'group',
  options: { orientation: 'row' }, // row | column - the only option a group applies
  controls: [
    { type: 'text', controlName: 'firstName', label: 'First Name', options: { width: '250px' } },
    { type: 'text', controlName: 'lastName',  label: 'Last Name',  options: { width: '250px' } },
  ],
}
```

Groups can be nested inside other groups for more complex layouts.

---

### Field types

Every field shares a common set of properties:

```ts
{
  type: 'text' | 'number' | 'checkbox' | 'select',
  controlName: string,        // unique key; also the key in the submitted value
  label?: string,             // label text shown next to the input
  initialValue?: unknown,     // value the field starts with
  validators?: [...],         // see Validation
  visibility?: {...},         // see Conditional Visibility
  hint?: string | {...},      // see Hints
  updateOn?: 'change' | 'blur' | 'submit', // overrides the form-level setting
  options?: {...},            // see Layout & sizing options
}
```

The available `type` values and what each renders:

#### `text` - single-line text input

```ts
{ type: 'text', controlName: 'firstName', label: 'First name', placeholder: 'Enter your name' }
```

Renders `<input type="text">`. `placeholder` is optional and falls back to the `label` if omitted. Produces a `string` value.

#### `number` - numeric input

```ts
{ type: 'number', controlName: 'age', label: 'Age', placeholder: '0', min: 0, max: 120 }
```

Renders `<input type="number">`. Produces a `number` value.

> The `min` / `max` here only set the HTML attributes for the browser's number controls - **they do not enforce validation**. To actually reject out-of-range values, add the [`min()` / `max()` validators](#built-in-validators).

#### `checkbox` - boolean toggle

```ts
{ type: 'checkbox', controlName: 'acceptTerms', label: 'I accept the terms', updateOn: 'change' }
```

Renders `<input type="checkbox">`. Produces a `true` / `false` value.

> **Tip:** Set `updateOn: 'change'` on checkboxes so they react instantly - checkboxes don't fire a blur the way text inputs do.

#### `select` - dropdown

```ts
{
  type: 'select',
  controlName: 'country',
  label: 'Country',
  placeholder: 'Choose one…',
  items: [
    { label: 'United States', value: 'us' },
    { label: 'Poland',        value: 'pl' },
  ],
}
```

Renders `<select>` with an `<option>` per item. Each item is `{ label, value }` - `label` is shown, `value` is submitted. If you set `placeholder` (or `label`), a disabled placeholder option appears first.

---

### Layout & sizing options

Both groups and individual fields accept layout `options`. Fields additionally accept `width`:

```ts
// On a group
options: {
  orientation?: 'row' | 'column';      // direction children flow
  labelOrientation?: 'row' | 'column'; // accepted by the type, but IGNORED on groups
}

// On a field
options: {
  orientation?: 'row' | 'column';
  labelOrientation?: 'row' | 'column';
  width?: number | string;             // e.g. 250 or '250px'
}
```

`labelOrientation` resolves most-specific-first: a field's own setting wins, then the form's, then the default (`column`).

> **Groups do not participate in that chain.** Setting `labelOrientation` on a group is silently ignored — a group only ever applies its `orientation`. Fields resolve their label placement straight from **field → form → default**, skipping any group they happen to sit in. To give a group's fields a shared label placement, set `labelOrientation` on each field in it (or change the form-level default).

---

### When values update

`updateOn` controls when a field pushes its value and re-runs validation:

| Value      | Updates…                        |
| ---------- | ------------------------------- |
| `'change'` | on every keystroke / change     |
| `'blur'`   | when the field loses focus      |
| `'submit'` | only when the form is submitted |

Set it once at the form level to apply to all fields, or override it on individual fields (handy for making checkboxes `'change'` while text fields stay `'blur'`).

---

## Reading Live Form State

Beyond the `(formSubmit)` event, the component exposes two read-only signals you can read at any time via a template reference variable:

```html
<forge-form-angular #userForm [schema]="schema" (formSubmit)="onSubmit($event)" />

<pre>{{ userForm.value() | json }}</pre>
<span>Valid: {{ userForm.valid() }}</span>
```

| Signal  | What you get                                                          |
| ------- | --------------------------------------------------------------------- |
| `value` | The current form value, updated on every change (`null` until built). |
| `valid` | Whether the form is currently valid (`false` until built).            |

Use these to drive UI outside the form - a live preview, or your own submit button placed elsewhere. Combine `valid` with `options.hideSubmitButton` to fully replace the built-in submit button with your own:

```html
<forge-form-angular #userForm [schema]="schema" (formSubmit)="onSubmit($event)" />
<button [disabled]="!userForm.valid()" (click)="submitFromOutside(userForm.value())">Save</button>
```

---

## Validation

### Built-in validators

Import the helpers and list them in a field's `validators` array:

```ts
import { required, minLength, maxLength, min, max } from '@forge-form/angular';

validators: [required(), minLength({ value: 3 }), maxLength({ value: 100 }), min({ value: 0 }), max({ value: 120 })];
```

| Validator     | Parameters                         | Checks                 |
| ------------- | ---------------------------------- | ---------------------- |
| `required()`  | _(optional `errorMessage`)_        | Field has a value.     |
| `minLength()` | `{ value: number, errorMessage? }` | Minimum string length. |
| `maxLength()` | `{ value: number, errorMessage? }` | Maximum string length. |
| `min()`       | `{ value: number, errorMessage? }` | Minimum numeric value. |
| `max()`       | `{ value: number, errorMessage? }` | Maximum numeric value. |

Every helper accepts an optional `errorMessage` - see [customizing error messages](#customizing-error-messages).

---

### Custom validators

For anything the built-ins don't cover, use `customValidator` with a unique `key` and a standard Angular validator function:

```ts
import { customValidator } from '@forge-form/angular';

customValidator({
  key: 'mustBeEven',
  fn: (control) => {
    const v = Number(control.value);
    return v % 2 === 0 ? null : { mustBeEven: true };
  },
  errorMessage: 'Value must be an even number',
});
```

Return `null` when the value is valid, or an error object when it isn't. The error object's key must match the `key` you passed so the message can be matched and shown.

---

### Customizing error messages

By default each validator shows a sensible built-in message:

| Validator   | Default message                      |
| ----------- | ------------------------------------ |
| `required`  | `This field is required`             |
| `minlength` | `Minimum length is {requiredLength}` |
| `maxlength` | `Maximum length is {requiredLength}` |
| `min`       | `Minimum value is {min}`             |
| `max`       | `Maximum value is {max}`             |

You can override the message on any validator three ways via its `errorMessage` option:

**A plain string:**

```ts
required({ errorMessage: 'This field cannot be empty' });
```

**A function** that builds the message from the validation details:

```ts
minLength({ value: 3, errorMessage: (err) => `Minimum ${err['requiredLength']} characters` });
```

**A custom component**, when you want richer markup:

```ts
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-age-error',
  template: `
    <strong style="color:red">{{ message() }}</strong>
  `,
})
export class AgeErrorComponent {
  message = input.required<string>();
}

// in the schema:
min({
  value: 18,
  errorMessage: {
    component: AgeErrorComponent,
    inputs: (err) => ({ message: `You must be at least ${err['min']}` }),
  },
});
```

The `inputs` function receives the validation details for that error and returns the inputs to pass to your component.

> A message set directly on a validator always wins over any app-wide default.

### Changing defaults app-wide

> **Not supported in 1.1.1.** Providing the exported `ERROR_MESSAGES` token from `app.config.ts` (or from your own component) **has no effect** — you still get the built-in text, e.g. `This field is required`.
>
> **Why:** this is the same injector-shadowing issue described under [Custom Field Types](#custom-field-types). `FormRendererComponent` provides `ERROR_MESSAGES: DEFAULT_ERROR_MESSAGES` in its own component-level `providers`, and `ErrorMessageRegistry` resolves the token from there — so an app-level array is never seen.
>
> **What to do instead:** set the message on the validator itself with `errorMessage`, which is per-schema and works reliably (see [above](#customizing-error-messages)). To apply one message consistently across a codebase, wrap the validator in a small factory and use it everywhere:
>
> ```ts
> // shared/validators.ts
> import { required } from '@forge-form/angular';
> export const requiredField = () => required({ errorMessage: 'This one is mandatory.' });
> ```

---

## Hints

A hint is helper text shown beneath a field **while it has no validation errors**. The simplest form is a string:

```ts
{
  type: 'text',
  controlName: 'email',
  label: 'Email',
  hint: 'We will never share your email address.',
}
```

For dynamic hints (like a character counter), pass a component instead:

```ts
hint: {
  component: CharCounterComponent,
  inputs: { maxLength: 100 }, // your own static inputs
}
```

The library automatically feeds your hint component the current field context - the control, its current value, its errors, and its schema - in addition to any inputs you pass. To get typed access to that context, extend `FormFieldContextComponent`:

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

`FormFieldContextComponent` gives you typed signals for `control`, `controlValue`, `controlErrors`, and `controlSchema`.

---

## Conditional Visibility

Any field can show, hide, enable, or disable itself based on the rest of the form. Add a `visibility` block:

```ts
visibility: {
  fn: (ctx) => boolean,        // true = hidden/disabled, false = visible/enabled
  behavior: 'hide' | 'disable',
  clearOnHide?: boolean,        // not implemented in 1.1.1 - see below
}
```

> **Read `fn` as "should this field be taken away?"** Returning `true` **hides** (or **disables**) the field; returning `false` shows (or enables) it. This is the opposite of what the property name suggests, so write the predicate for the condition under which the field should _disappear_.

Your `fn` receives the current form context:

```ts
fn: (ctx) => {
  ctx.value; // the whole current form value
  ctx.form; // the underlying form, for ctx.form.get('otherField')
  ctx.control; // this field's control
  return /* true to HIDE / DISABLE, false to show / enable */;
};
```

The two behaviors:

| `behavior`  | When `fn` returns `true`…                                 | When `fn` returns `false`… |
| ----------- | --------------------------------------------------------- | -------------------------- |
| `'hide'`    | the field is removed from the page entirely               | the field is rendered      |
| `'disable'` | the field is disabled and left out of the submitted value | the field is enabled       |

> **`clearOnHide` does nothing in 1.1.1.** The option is accepted by the type but never resets the control, for either behavior: the reset only lives on the `'disable'` code path, and the flag reaching that path is always `false`. A field that becomes hidden **keeps its value, and that value is still submitted.** If you need the stale value gone, reset it yourself — for example from the `fn` itself or by reacting to the value that drives the condition.

**Example - hide the gender select until the first name is valid.** Because `fn` returns `true` to hide, the predicate is negated:

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
    // hide WHILE firstName is invalid; shows once it becomes valid
    fn: (ctx) => ctx.form.get('firstName')?.valid !== true,
    behavior: 'hide',
  },
}
```

---

## Custom Field Types

> **Not supported in 1.1.1.** The `RENDERERS` token and the `FieldRenderer` interface are exported, but **registering your own field type from application code does not work.** Providing `RENDERERS` in `app.config.ts` (or in any component of your own) has no effect, and rendering a schema with your custom `type` fails at runtime with:
>
> ```
> Error: No renderer for type: color
> ```
>
> **Why:** `FormRendererComponent` and `GroupRendererComponent` declare the four built-in renderers in their _own_ component-level `providers`, and `RendererRegistry` is provided there too. Angular multi-providers do **not** merge across injectors — the component-level `RENDERERS` array completely replaces anything you provide further up, so the registry only ever sees the four built-ins.
>
> Until this is fixed, the usable field types are the four built-in ones: `text`, `number`, `checkbox`, and `select`. For inputs outside that set, keep the field out of the schema and render it alongside the form yourself.

The extension points that **do** work today are [custom error components](#customizing-error-messages) (per validator, via `errorMessage`) and [custom hint components](#hints) (per field, via `hint`) — both are passed per-schema rather than through DI, which is why they are unaffected.

---

## Styling & Theming

The library ships styles in two layers so you can take just the structure, or structure plus a visual theme.

**Layout only** (flexbox structure, no colors/spacing opinions):

```scss
// styles.scss
@use '@forge-form/angular/styles' as forge;
```

**Layout + the bundled default theme:**

```scss
@use '@forge-form/angular/styles' as forge;
@use '@forge-form/angular/styles/default' as forge-theme;
```

Or via `angular.json`:

```json
"styles": [
  "node_modules/@forge-form/angular/styles/index.scss",
  "node_modules/@forge-form/angular/styles/default.scss"
]
```

To activate the visual theme, set it in the schema:

```ts
options: {
  theme: 'default';
}
```

### Customizing the default theme

The default theme is driven by CSS custom properties, so you can re-skin it without touching library code - just override the variables on the component:

```css
forge-form-angular {
  --forge-color-error: #cc0000;
  --forge-border-radius: 0.5rem;
}
```

The variables you can override:

| Property                 | Default value        | Controls                     |
| ------------------------ | -------------------- | ---------------------------- |
| `--forge-gap-small-xx`   | `2px`                | Field container gap          |
| `--forge-gap-small-x`    | `0.25rem`            | -                            |
| `--forge-gap-small`      | `0.5rem`             | Gap between controls         |
| `--forge-gap-medium`     | `0.75rem`            | Gap between grouped fields   |
| `--forge-border-radius`  | `0.25rem`            | Input / button border radius |
| `--forge-color-label`    | `#202020`            | Label and hint text color    |
| `--forge-color-border`   | `rgba(32,32,32,0.5)` | Input border color           |
| `--forge-color-disabled` | `#b6b6b6`            | Disabled button text/border  |
| `--forge-color-error`    | `#b60000`            | Error message text color     |

### Styling without the default theme

If you skip the default theme and style everything yourself, these are the class names the library puts on each element:

| CSS class                     | Element                                   |
| ----------------------------- | ----------------------------------------- |
| `.forge-form`                 | the `<form>`                              |
| `.forge-form-group`           | a group container                         |
| `.forge-form-field-container` | the wrapper around each field             |
| `.forge-form-field-label`     | the label text                            |
| `.forge-form-input`           | text / number inputs                      |
| `.forge-form-input-error`     | invalid text/number/select (when touched) |
| `.forge-form-checkbox`        | checkbox input                            |
| `.forge-form-checkbox-error`  | invalid checkbox (when dirty)             |
| `.forge-form-select`          | select dropdown                           |
| `.forge-form-hint`            | hint text                                 |
| `.forge-form-error`           | error message text                        |
| `.forge-form-button`          | the submit button                         |

Orientation modifiers (`--row` / `--column`) are added to `.forge-form`, `.forge-form-group`, and `.forge-form-field-container` based on the relevant `orientation` / `labelOrientation` options. The error classes are added automatically when a field is invalid, so you can style error states even without the default theme.

---

## Full Working Example

This puts the major features together: a group, validators with custom messages, a custom hint component, a custom error component, and conditional visibility.

```ts
// app.component.ts
import { Component, ChangeDetectionStrategy, input, computed } from '@angular/core';
import { FormRendererComponent, FormSchema, FormFieldContextComponent, required, minLength, maxLength, min, customValidator } from '@forge-form/angular';

// --- Custom hint component (character counter) ---
@Component({
  selector: 'app-char-counter',
  template: `
    {{ current() }} / {{ maxLength() }} characters
  `,
})
export class CharCounterComponent extends FormFieldContextComponent {
  maxLength = input<number>(0);
  current = computed(() => (this.controlValue() as string)?.length ?? 0);
}

// --- Custom error component ---
@Component({
  selector: 'app-age-error',
  template: `
    <strong style="color:red">{{ message() }}</strong>
  `,
})
export class AgeErrorComponent {
  message = input.required<string>();
}

// --- Main form ---
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
      // First + last name side by side
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
            hint: { component: CharCounterComponent, inputs: { maxLength: 50 } },
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

      // Number with a custom error component
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

      // Checkbox with a custom validator
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

      // Select - only shown once both names are valid.
      // NOTE: `fn` returns true to HIDE, so the condition is negated.
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
          fn: (ctx) => !(ctx.form.get('firstName')?.valid === true && ctx.form.get('lastName')?.valid === true),
          behavior: 'hide',
          // clearOnHide is omitted: it has no effect in 1.1.1
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

_User guide for @forge-form/angular 1.1.1. Author: Marcin Spasiński_
