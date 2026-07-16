import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';
import { DocsContentService } from '../../pages/docs/docs-content.service';
import { GITHUB_URL, NPM_URL } from '../site';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, Logo],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  readonly githubUrl = GITHUB_URL;
  readonly npmUrl = NPM_URL;

  /** Version, sourced from user-guide.md (undefined until loaded). */
  protected readonly meta = toSignal(inject(DocsContentService).meta());
}
