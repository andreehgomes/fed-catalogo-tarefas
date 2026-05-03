import { Injectable, Signal, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  Auth,
  GoogleAuthProvider,
  User,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@angular/fire/auth';

/**
 * Camada de autenticação do app. Expõe o usuário corrente como Signal e os
 * métodos de login/logout. RxJS aparece apenas no `authState` do AngularFire,
 * convertido imediatamente para Signal — em linha com DEC-003.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);

  /**
   * Usuário corrente. `null` enquanto não há ninguém logado;
   * `undefined` apenas durante o frame inicial antes do AngularFire
   * resolver o estado persistido (raro, normalmente já vem `null` ou `User`).
   */
  readonly currentUser: Signal<User | null | undefined> = toSignal(
    authState(this.auth),
    { initialValue: undefined },
  );

  readonly isAuthenticated: Signal<boolean> = computed(() => !!this.currentUser());

  /**
   * Login com e-mail e senha. Lança `FirebaseError` em caso de credencial
   * inválida — o componente chamador deve tratar e mostrar mensagem.
   */
  async signInWithEmail(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Cria conta nova com e-mail e senha. Após criação, o usuário já fica
   * logado automaticamente (comportamento padrão do Firebase Auth).
   */
  async signUpWithEmail(email: string, password: string): Promise<void> {
    await createUserWithEmailAndPassword(this.auth, email, password);
  }

  /**
   * Login via popup do Google. Pode falhar com `auth/popup-closed-by-user`
   * se o usuário fechar o popup — não é erro real, deve ser ignorado pela UI.
   */
  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(this.auth, provider);
  }

  async signOut(): Promise<void> {
    await signOut(this.auth);
  }
}
