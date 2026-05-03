/**
 * Configuração do projeto Firebase consumida pelo `provideFirebaseApp`.
 *
 * IMPORTANTE — esta config é PÚBLICA por design.
 * O Firebase Web SDK precisa destes valores em runtime no navegador, então
 * eles ficam visíveis no bundle de qualquer visitante do app — independente
 * de estarem no Git ou em variáveis de ambiente. A documentação oficial do
 * Firebase confirma isso:
 *   https://firebase.google.com/docs/projects/api-keys
 *
 * A segurança real do app NÃO está em esconder esses valores; está em três
 * camadas que vivem fora deste arquivo:
 *
 *   1. Restrição de domínio HTTP referrer no Google Cloud Console
 *      (limita QUEM pode usar a apiKey).
 *   2. Firestore Security Rules autenticadas (Release 2: limita O QUE cada
 *      usuário pode ler/escrever).
 *   3. Firebase App Check com reCAPTCHA (Release 2/3: garante que as
 *      chamadas vêm do SEU app, não de terceiros).
 *
 * Antes do primeiro deploy, complete o checklist de segurança em
 * `README.md` → seção "Segurança". Veja também `docs/decisoes.md` → DEC-004.
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyCr23-4aisnawG8S9rNqdE-9YGLDnFDrGA',
  authDomain: 'fed-catalogo-tarefas.firebaseapp.com',
  projectId: 'fed-catalogo-tarefas',
  storageBucket: 'fed-catalogo-tarefas.firebasestorage.app',
  messagingSenderId: '533044022153',
  appId: '1:533044022153:web:b72dbfbf6d849e11efaf58',
  measurementId: 'G-4HC3S1K8FT',
} as const;
