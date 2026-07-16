import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Logo } from '../logo/logo';
import { GithubIcon } from '../github-icon/github-icon';
import { NpmIcon } from '../npm-icon/npm-icon';
import { GITHUB_URL, NPM_URL } from '../site';

@Component({
  selector: 'app-header',
  imports: [RouterLink, Logo, GithubIcon, NpmIcon],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  readonly githubUrl = GITHUB_URL;
  readonly npmUrl = NPM_URL;
}
