# Escopo do MVP — fed-catalogo-tarefas

## Objetivo

SPA pessoal de gestão de tarefas, multi-device, com sugestão de prioridade
assistida por IA. O usuário cadastra tarefas com título, descrição, prioridade
e status; o sistema persiste no Firebase Firestore e oferece, sob demanda, uma
sugestão de prioridade gerada por uma Cloud Function — que chama a OpenAI quando
há chave configurada e cai num fallback heurístico determinístico caso contrário.

## Requisitos funcionais

| ID      | Requisito                                                                                  |
|---------|--------------------------------------------------------------------------------------------|
| RF-001  | O usuário pode criar uma tarefa com título, descrição e prioridade.                        |
| RF-002  | O usuário pode listar todas as suas tarefas.                                               |
| RF-003  | O usuário pode atualizar título, descrição, prioridade e status de uma tarefa existente.   |
| RF-004  | O usuário pode excluir uma tarefa.                                                         |
| RF-005  | O usuário pode autenticar-se com e-mail/senha via Firebase Auth (Release 2).               |
| RF-006  | Cada tarefa pertence a um único usuário; ninguém vê tarefas de outros (Release 2).         |
| RF-007  | O usuário pode solicitar uma sugestão de prioridade via IA (Release 3).                    |

## Requisitos não-funcionais

| ID       | Requisito                                                                                  |
|----------|--------------------------------------------------------------------------------------------|
| RNF-001  | Frontend Angular ≥ 19 com componentes standalone, Signals para estado e SCSS para estilo.  |
| RNF-002  | Persistência via AngularFire (Firestore) usando a API funcional moderna (`inject`).        |
| RNF-003  | Validação runtime dos modelos com zod, em paralelo aos tipos TypeScript.                   |
| RNF-004  | Performance: TTI < 3 s em rede 3G simulada na página principal de tarefas.                 |
| RNF-005  | Acessibilidade WCAG 2.1 nível AA básico — navegação por teclado, contraste, labels ARIA.   |

## Fora-de-escopo

❌ App mobile nativo (apenas web responsiva)
❌ Compartilhamento de tasks entre usuários
❌ Integração com calendário externo
❌ Notificações push
❌ Multi-idioma (apenas pt-BR)
❌ Modo offline-first com sincronização avançada
