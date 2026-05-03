import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FirebaseError } from '@angular/fire/app';

import { AuthService } from '../../services/auth.service';

type Mode = 'sign-in' | 'sign-up';

interface FormState {
  email: string;
  password: string;
}

const EMPTY_FORM: FormState = { email: '', password: '' };

const FRIENDLY_AUTH_ERRORS: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'E-mail em formato inválido.',
  'auth/missing-password': 'Informe a senha.',
  'auth/weak-password': 'A senha precisa ter ao menos 6 caracteres.',
  'auth/email-already-in-use': 'Este e-mail já está cadastrado — tente entrar.',
  'auth/user-not-found': 'Conta não encontrada. Cadastre-se primeiro.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/too-many-requests': 'Muitas tentativas. Tente novamente em alguns minutos.',
  'auth/operation-not-allowed':
    'Provedor de login desabilitado no Firebase Console. Habilite-o em Authentication → Sign-in method.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/popup-blocked':
    'O navegador bloqueou o popup do Google. Permita popups para este site e tente novamente.',
};

/**
 * Tela de autenticação. Modo `sign-in` por padrão; usuário pode alternar
 * para `sign-up` para criar uma conta nova com e-mail/senha. Botão extra
 * faz login via Google (popup).
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly mode = signal<Mode>('sign-in');
  protected readonly form = signal<FormState>({ ...EMPTY_FORM });
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected readonly title = computed(() =>
    this.mode() === 'sign-in' ? 'Entrar' : 'Criar conta',
  );
  protected readonly submitLabel = computed(() =>
    this.mode() === 'sign-in' ? 'Entrar' : 'Cadastrar',
  );
  protected readonly toggleLabel = computed(() =>
    this.mode() === 'sign-in'
      ? 'Não tem conta? Cadastre-se.'
      : 'Já tem conta? Entrar.',
  );

  protected toggleMode(): void {
    this.errorMessage.set(null);
    this.mode.update((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
  }

  protected updateField<K extends keyof FormState>(field: K, value: FormState[K]): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  protected async submit(): Promise<void> {
    if (this.busy()) return;
    const { email, password } = this.form();
    if (!email.trim() || !password) {
      this.errorMessage.set('Informe e-mail e senha.');
      return;
    }

    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      if (this.mode() === 'sign-in') {
        await this.authService.signInWithEmail(email.trim(), password);
      } else {
        await this.authService.signUpWithEmail(email.trim(), password);
      }
      await this.redirectAfterLogin();
    } catch (error) {
      this.errorMessage.set(this.translateError(error));
    } finally {
      this.busy.set(false);
    }
  }

  protected async signInWithGoogle(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.errorMessage.set(null);
    try {
      await this.authService.signInWithGoogle();
      await this.redirectAfterLogin();
    } catch (error) {
      const friendly = this.translateError(error);
      // popup fechado pelo usuário não é erro — silencia.
      if (friendly) {
        this.errorMessage.set(friendly);
      }
    } finally {
      this.busy.set(false);
    }
  }

  private async redirectAfterLogin(): Promise<void> {
    const redirect = this.route.snapshot.queryParamMap.get('redirect') ?? '/';
    await this.router.navigateByUrl(redirect);
  }

  private translateError(error: unknown): string {
    if (error instanceof FirebaseError) {
      const friendly = FRIENDLY_AUTH_ERRORS[error.code];
      if (friendly !== undefined) {
        return friendly;
      }
      return `Falha no login (${error.code}).`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Falha desconhecida no login.';
  }
}
