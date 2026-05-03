/**
 * Configuração do projeto Firebase consumida pelo `provideFirebaseApp`.
 *
 * ⚠️  REPLACE com seus valores reais antes do deploy.
 *
 * Os valores abaixo são placeholders seguros para uso APENAS contra os
 * Firebase Emulators locais. Eles não apontam para nenhum projeto real:
 * o `projectId` `fed-catalogo-tarefas-local` é usado pelo emulator em modo
 * `singleProjectMode`. Para Hosting/produção, copie o snippet exibido em
 *   Firebase Console → ⚙️ Configurações do projeto → Seus apps → Config
 * e substitua TODOS os campos abaixo.
 */
export const firebaseConfig = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'fed-catalogo-tarefas-local',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
} as const;
