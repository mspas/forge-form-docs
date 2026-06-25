import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';
import { GithubIcon } from '../github-icon/github-icon';
import { NpmIcon } from '../npm-icon/npm-icon';
import { DocsContentService } from '../../pages/docs/docs-content.service';
import { GITHUB_URL, NPM_URL, NPM_INSTALL } from '../site';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Logo, GithubIcon, NpmIcon],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly content = inject(DocsContentService);

  readonly githubUrl = GITHUB_URL;
  readonly npmUrl = NPM_URL;
  readonly install = NPM_INSTALL;

  /** Version + license, sourced from user-guide.md (undefined until loaded). */
  protected readonly meta = toSignal(this.content.meta());

  protected readonly copied = signal(false);

  async copyInstall(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.install);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch {
      /* clipboard unavailable - no-op */
    }
  }
}
