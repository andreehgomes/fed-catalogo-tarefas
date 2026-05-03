import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly title = signal('fed-catalogo-tarefas-app');
  protected readonly currentUser = this.authService.currentUser;
  protected readonly userLabel = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return user.displayName ?? user.email ?? 'Usuário';
  });

  protected async signOut(): Promise<void> {
    await this.authService.signOut();
    await this.router.navigateByUrl('/login');
  }
}
