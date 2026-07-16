import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * forge-form brand mark. The body paths inherit the surrounding text color via
 * `currentColor`; the two accent bars track `--accent`, so a palette change
 * carries here automatically. public/favicon.svg is the same artwork but must
 * hardcode its colours - a linked icon file gets no page CSS - so it needs
 * updating by hand whenever the accent moves.
 */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="width()"
      [attr.height]="height()"
      viewBox="0 0 290 175"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="display:block"
      role="img"
      aria-label="forge-form logo"
    >
      <path
        d="M188.12 0H157.4C153.865 0 151 2.86538 151 6.4V167.68C151 171.215 153.865 174.08 157.4 174.08H188.12C191.655 174.08 194.52 171.215 194.52 167.68V6.4C194.52 2.86538 191.655 0 188.12 0Z"
        fill="currentColor"
      />
      <path d="M151 0H289.24L245.72 46.08H151V0Z" fill="currentColor" />
      <path
        d="M101.12 0H131.84C135.375 0 138.24 2.86538 138.24 6.4V167.68C138.24 171.215 135.375 174.08 131.84 174.08H101.12C97.5854 174.08 94.72 171.215 94.72 167.68V6.4C94.72 2.86538 97.5854 0 101.12 0Z"
        fill="currentColor"
      />
      <path
        d="M138.24 0H6.19888e-06L43.52 46.08H138.24V0Z"
        fill="currentColor"
      />
      <path d="M145 74H242L208.878 108H145V74Z" fill="var(--accent)" />
      <path d="M145 74H48L81.122 108H145V74Z" fill="var(--accent)" />
    </svg>
  `,
})
export class Logo {
  readonly width = input(34);
  readonly height = input(21);
}
