import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Header } from '../../shared/header/header';
import { Footer } from '../../shared/footer/footer';
import { DocsContentService, TocEntry } from './docs-content.service';

@Component({
  selector: 'app-docs',
  imports: [Header, Footer],
  templateUrl: './docs.html',
  styleUrl: './docs.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Docs {
  private readonly content = inject(DocsContentService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  private readonly contentRef =
    viewChild<ElementRef<HTMLElement>>('docBody');

  private readonly rendered = toSignal(this.content.load());

  protected readonly safeHtml = signal<SafeHtml | null>(null);
  protected readonly toc = signal<TocEntry[]>([]);
  protected readonly activeId = signal<string>('');
  protected readonly menuOpen = signal(false);

  private observer?: IntersectionObserver;
  private wired = false;

  constructor() {
    effect(() => {
      const doc = this.rendered();
      if (!doc) return;
      this.safeHtml.set(this.sanitizer.bypassSecurityTrustHtml(doc.html));
      this.toc.set(doc.toc);
      if (doc.toc.length) this.activeId.set(doc.toc[0].id);
    });

    // Once the content is in the DOM, wire up scroll-spy + initial fragment.
    afterNextRender(() => this.tryWire());
    effect(() => {
      this.safeHtml();
      if (!this.wired) queueMicrotask(() => this.tryWire());
    });

    this.destroyRef.onDestroy(() => this.observer?.disconnect());
  }

  private tryWire(): void {
    const host = this.contentRef()?.nativeElement;
    if (!host || this.wired) return;
    const headings = Array.from(
      host.querySelectorAll<HTMLElement>('h2[id], h3[id]'),
    );
    if (!headings.length) return;
    this.wired = true;

    this.observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) this.activeId.set(visible[0].target.id);
      },
      { rootMargin: '-84px 0px -70% 0px', threshold: 0 },
    );
    headings.forEach((h) => this.observer!.observe(h));

    // Honour an incoming #fragment (e.g. links from the landing page).
    const frag = decodeURIComponent(location.hash.replace('#', ''));
    if (frag) {
      const target = host.querySelector<HTMLElement>(`#${CSS.escape(frag)}`);
      if (target) {
        this.activeId.set(frag);
        queueMicrotask(() =>
          target.scrollIntoView({ behavior: 'auto', block: 'start' }),
        );
      }
    }
  }

  protected goTo(entry: TocEntry, event: Event): void {
    event.preventDefault();
    this.menuOpen.set(false);
    const host = this.contentRef()?.nativeElement;
    const target = host?.querySelector<HTMLElement>(`#${CSS.escape(entry.id)}`);
    if (target) {
      this.activeId.set(entry.id);
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', `#${entry.id}`);
    }
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }
}
