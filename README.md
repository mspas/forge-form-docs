# forge-form docs site

Marketing landing page + full documentation for the
[`@forge-form/angular`](https://github.com/mspas/forge-form) library, built with
**Angular 21** (standalone, zoneless, signal-based).

The landing page recreates the "Landing 01 — Technical" design handoff and embeds
a **live playground powered by the real `@forge-form/angular` engine** — not a
mock. The docs page renders the library's complete technical reference.

## Run it

```bash
npm install      # already done if you cloned with node_modules
npm start        # dev server at http://localhost:4200
npm run build    # production build → dist/
```

## Routes

| Path    | Page    | Description                                              |
| ------- | ------- | ------------------------------------------------------- |
| `/`     | Landing | Expressive hero, "four powers" card grid, live playground, teal CTA. |
| `/docs` | Docs    | Full library reference with a scroll-spy TOC sidebar.   |

## Project layout

```
src/
  styles.scss                 # design tokens + dark form theme + markdown styles
  app/
    shared/                   # logo, header, footer, code-block, site constants
    pages/
      landing/                # landing page + playground (uses <forge-form-angular>)
      docs/                   # docs page + docs-content.service (markdown pipeline)
public/
  docs/library-reference.md   # ← the documentation source content
vendor/
  forge-form-angular-*.tgz    # packaged build of the local library (see below)
```

## How the documentation content is stored & retrieved

The complete library reference lives as a single Markdown file at
**`public/docs/library-reference.md`** (it ships verbatim as a static asset).

At runtime, `DocsContentService` (`src/app/pages/docs/docs-content.service.ts`):

1. fetches the Markdown over `HttpClient`,
2. renders it to HTML with **marked**,
3. post-processes the HTML with `DOMParser` to
   - add GitHub-style `id` slugs to every heading and build the table of contents,
   - syntax-highlight every fenced code block with **highlight.js**,
4. caches the result with `shareReplay(1)`.

The `Docs` component renders that HTML, builds the sidebar from the generated TOC,
and uses an `IntersectionObserver` for scroll-spy. To update the docs, just edit
the Markdown file — no code changes required.

## How the live playground uses the real library

`@forge-form/angular` is consumed as a **packaged tarball** under `vendor/`
(installed via `file:vendor/forge-form-angular-1.0.0.tgz`). It is packed from the
library's `dist/` output so it resolves the app's own `@angular/core` (a direct
symlink to the sibling project pulled in a second Angular copy and broke
signal-input type brands).

To refresh the library after rebuilding it:

```bash
npm pack ../forge-form/dist/forge-form-angular --pack-destination ./vendor
npm install ./vendor/forge-form-angular-1.0.0.tgz
```

The playground (`src/app/pages/landing/playground/`) renders a real
`<forge-form-angular [schema]="…">`, mirrors its live `FormGroup` value into a
signal for the readout, and themes the library's `.forge-form-*` classes dark via
`.pf-host` in `styles.scss`.
