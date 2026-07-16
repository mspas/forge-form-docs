import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import hljs from 'highlight.js/lib/core';
import typescript from 'highlight.js/lib/languages/typescript';
import xml from 'highlight.js/lib/languages/xml';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import scss from 'highlight.js/lib/languages/scss';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('scss', scss);

/** Highlights a code string with highlight.js, themed via global .hljs rules. */
@Component({
  selector: 'app-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<pre><code class="hljs" [innerHTML]="html()"></code></pre>`,
  styles: [
    `
      :host {
        display: block;
      }
      pre {
        margin: 0;
        overflow: auto;
      }
      code {
        font: 13px/1.65 var(--font-mono);
      }
    `,
  ],
})
export class CodeBlock {
  private readonly sanitizer = inject(DomSanitizer);

  readonly code = input.required<string>();
  readonly language = input<string>('typescript');

  protected readonly html = computed<SafeHtml>(() => {
    const lang = this.language();
    const value = hljs.getLanguage(lang)
      ? hljs.highlight(this.code(), { language: lang }).value
      : hljs.highlightAuto(this.code()).value;
    return this.sanitizer.bypassSecurityTrustHtml(value);
  });
}
