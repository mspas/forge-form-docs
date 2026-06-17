import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { marked } from 'marked';
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
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('scss', scss);

export interface TocEntry {
  id: string;
  text: string;
  level: number; // 2 or 3
}

export interface RenderedDoc {
  html: string;
  toc: TocEntry[];
}

/** GitHub-flavoured heading slug (matches the anchors used across the site). */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s/g, '-');
}

@Injectable({ providedIn: 'root' })
export class DocsContentService {
  private readonly http = inject(HttpClient);

  private readonly doc$: Observable<RenderedDoc> = this.http
    .get('docs/library-reference.md', { responseType: 'text' })
    .pipe(
      map((md) => this.render(md)),
      shareReplay(1),
    );

  load(): Observable<RenderedDoc> {
    return this.doc$;
  }

  private render(markdown: string): RenderedDoc {
    const rawHtml = marked.parse(markdown, { async: false }) as string;

    const docEl = new DOMParser().parseFromString(rawHtml, 'text/html');
    const toc: TocEntry[] = [];
    const used = new Set<string>();

    // Heading ids + table of contents (h2 / h3).
    docEl
      .querySelectorAll('h1, h2, h3, h4')
      .forEach((h) => {
        const text = (h.textContent ?? '').trim();
        let id = slugify(text) || 'section';
        let n = 1;
        while (used.has(id)) id = `${slugify(text)}-${n++}`;
        used.add(id);
        h.id = id;

        const level = Number(h.tagName.substring(1));
        if (level === 2 || level === 3) toc.push({ id, text, level });
      });

    // Syntax-highlight fenced code blocks.
    docEl.querySelectorAll('pre code').forEach((code) => {
      const cls = code.className || '';
      const match = /language-([\w-]+)/.exec(cls);
      const lang = match?.[1];
      const source = code.textContent ?? '';
      try {
        const out =
          lang && hljs.getLanguage(lang)
            ? hljs.highlight(source, { language: lang }).value
            : hljs.highlightAuto(source).value;
        code.innerHTML = out;
      } catch {
        /* leave as-is on failure */
      }
      code.classList.add('hljs');
    });

    return { html: docEl.body.innerHTML, toc };
  }
}
