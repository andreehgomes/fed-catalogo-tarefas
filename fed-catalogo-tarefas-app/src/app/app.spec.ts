import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { of } from 'rxjs';

import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    const authStub = {
      currentUser: null,
      onAuthStateChanged: (cb: (user: null) => void) => {
        cb(null);
        return () => undefined;
      },
      // Implementação mínima para o `authState` do AngularFire não quebrar.
      onIdTokenChanged: () => () => undefined,
    } as unknown as Auth;

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authStub },
        { provide: 'authState', useValue: of(null) },
      ],
    }).compileComponents();
  });

  it('cria o componente raiz', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('renderiza o título do projeto no header', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('fed-catalogo-tarefas');
  });
});
