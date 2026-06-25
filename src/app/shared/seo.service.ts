import { DOCUMENT, inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { SITE_URL } from './site';

export interface SeoData {
  /** Document title (also used for og:title / twitter:title). */
  title: string;
  /** Meta description (also used for og/twitter description). */
  description: string;
  /** Route path, e.g. '' for home or 'docs'. Used for canonical + og:url. */
  path: string;
  /** Absolute or root-relative social image. Defaults to the site og-image. */
  image?: string;
}

/**
 * Sets per-route SEO tags: title, description, canonical link, and Open Graph
 * + Twitter Card metadata. Runs during static prerender (so the tags are baked
 * into each route's HTML) and on client navigation.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  update({ title, description, path, image }: SeoData): void {
    const url = `${SITE_URL}/${path}`.replace(/\/$/, '') || SITE_URL;
    const img = this.absolute(image ?? '/og-image.png');

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });

    // Open Graph
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'ForgeForm' });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:image', content: img });

    // Twitter
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: img });

    this.setCanonical(url);
  }

  private absolute(path: string): string {
    return path.startsWith('http') ? path : `${SITE_URL}${path}`;
  }

  /** Upserts the single <link rel="canonical"> in <head>. */
  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
