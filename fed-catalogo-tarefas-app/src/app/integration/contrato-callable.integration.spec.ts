import { Timestamp } from '@angular/fire/firestore';
import { ZodError, z } from 'zod';

import { TaskOutSchema, TaskPriority, TaskStatus } from '../models/task';
import { FakeAuth, FakeFirestore } from './fakes/firestore.fake';
import { IntegrationTaskService } from './harness/integration-task-service';

/**
 * Casos CI-24 a CI-27 — testes de contrato da Cloud Function
 * `suggestpriority`, gerados pelo prompt Tipo D (P-109). Ver
 * `docs/pos-ia/forum-testes-integracao/prompts/04-contrato-api.md`.
 *
 * ## O ponto central
 *
 * `httpsCallable<I, O>` é genérico de **TypeScript apenas**: não há validação
 * em runtime. O `PrioritySuggestionService` faz `return result.data`, um cast
 * sem verificação. Então qualquer divergência de contrato atravessa a
 * fronteira F4 em silêncio e estoura **em outro lugar** — tipicamente no
 * `TaskOutSchema.parse` do `mapSnapshot`, numa operação diferente.
 *
 * ## Escopo honesto: de onde a divergência pode vir
 *
 * Conferindo o código do servidor (`functions/src/suggest-priority/`), a
 * hipótese original do prompt Tipo D — "o Claude devolve 'Alta' e o valor
 * chega ao app" — **não se confirma por esse caminho**: o `claude-adapter`
 * valida o retorno do LLM contra `PRIORITIES` e lança se não pertencer ao
 * enum, e `suggestPriority` captura esse erro e cai no fallback heurístico,
 * que sempre devolve prioridade válida. O servidor é robusto nesse ponto.
 *
 * O que estes testes cobrem, então, é a **ausência de defesa no cliente**,
 * que continua real e importa por três motivos: o servidor pode ser alterado
 * sem o cliente saber (o `SuggestPriorityOutputSchema` existe em
 * `functions/src/suggest-priority/schema.ts` mas **não** é aplicado na
 * resposta do handler); a DEC-005 duplica o schema manualmente entre os dois
 * lados; e o cliente aceitaria qualquer payload de uma versão futura ou de um
 * deploy divergente. São testes de resiliência do cliente, não a demonstração
 * de um bug ativo em produção.
 *
 * Estes testes reproduzem o cast do serviço real (`respostaDaCallable`) em vez
 * de instanciar o `PrioritySuggestionService` via TestBed: o serviço usa
 * `httpsCallable` importado como símbolo ESM, que não é interceptável. O teste
 * CI-28 prova que a correção proposta (schema zod na borda) resolve.
 */
describe('Integração — contrato da callable suggestpriority (Tipo D)', () => {
  const OWNER = 'user-owner';

  /** Contrato como o cliente o declara hoje: tipos, sem validação em runtime. */
  interface SuggestPriorityOutput {
    priority: TaskPriority;
    source: 'claude' | 'heuristic';
  }

  /**
   * Reproduz exatamente o que o `PrioritySuggestionService.suggest()` faz com
   * a resposta: um cast de TypeScript, sem verificação em runtime.
   */
  function respostaDaCallable(payload: unknown): SuggestPriorityOutput {
    return payload as SuggestPriorityOutput;
  }

  let db: FakeFirestore;
  let service: IntegrationTaskService;

  beforeEach(() => {
    db = new FakeFirestore();
    service = new IntegrationTaskService(db, new FakeAuth({ uid: OWNER }));
  });

  it('CI-24 ⚠️ — priority fora do enum atravessa F4 sem erro e só estoura na leitura seguinte', async () => {
    // 'Alta' não pertence ao enum ('low'|'medium'|'high'|'urgent').
    //
    // O servidor atual NÃO produz esse valor: o claude-adapter valida o
    // retorno do LLM e o fallback heurístico sempre devolve enum válido. O
    // que este teste demonstra é que o CLIENTE não tem defesa própria — se o
    // servidor divergir (mudança de contrato, deploy antigo, schema do
    // servidor não aplicado na resposta), nada aqui detecta.
    const sugestao = respostaDaCallable({ priority: 'Alta', source: 'claude' });

    // 1. O serviço NÃO detecta: o valor passa adiante como se fosse válido.
    expect(sugestao.priority).toBe('Alta' as TaskPriority);

    // 2. O valor chega ao banco (aqui, semeado como a Cloud Function o deixaria).
    db.seed('tasks', 'com-prioridade-ruim', {
      title: 'Tarefa com sugestão da IA',
      description: '',
      priority: sugestao.priority,
      status: TaskStatus.OPEN,
      userId: OWNER,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    });

    // 3. A falha aparece AQUI — no TaskService, em outra operação, com stack
    //    trace apontando para o Firestore e não para a Cloud Function.
    await expectAsync(service.getById('com-prioridade-ruim')).toBeRejectedWith(
      jasmine.any(ZodError),
    );
  });

  it('CI-25 ⚠️ — campo source ausente vira undefined sem erro em lugar nenhum', async () => {
    const sugestao = respostaDaCallable({ priority: TaskPriority.HIGH });

    // Nada lança. O código que decidir algo com base em `source` (ex.: exibir
    // "sugerido pela IA" vs. "heurística") simplesmente não funciona.
    expect(sugestao.priority).toBe(TaskPriority.HIGH);
    expect(sugestao.source).toBeUndefined();
  });

  it('CI-26 — campo extra na resposta é tolerado por design, permitindo evolução do servidor', async () => {
    const sugestao = respostaDaCallable({
      priority: TaskPriority.URGENT,
      source: 'claude',
      confidence: 0.92, // campo novo, servidor evoluiu
      model: 'claude-haiku-4-5',
    });

    // Tolerância deliberada: z.object sem .strict() ignora chaves desconhecidas,
    // e o cast de TS também. Um servidor pode ganhar campos sem romper clientes
    // antigos. A LLM havia afirmado que isto quebraria o parse — não quebra.
    expect(sugestao.priority).toBe(TaskPriority.URGENT);
    expect(sugestao.source).toBe('claude');

    const id = await service.create({
      title: 'Com campo extra',
      priority: sugestao.priority,
    } as never);
    expect(db.raw('tasks', id)!['priority']).toBe(TaskPriority.URGENT);
    // O campo extra não é persistido: o TaskCreateSchema o descarta.
    expect(db.raw('tasks', id)!['confidence']).toBeUndefined();
  });

  it('CI-27 ⚠️ — resposta null só falha quando alguém acessa a propriedade', () => {
    const sugestao = respostaDaCallable(null);

    // O cast aceita null sem reclamar; o TypeError acontece no componente,
    // longe da origem.
    expect(() => sugestao.priority).toThrowError(TypeError);
  });

  it('CI-21 ⚠️ — a sugestão fora do enum é a mesma falha de CI-24, vista do lado da escrita', async () => {
    // CI-21 e CI-24 são o mesmo defeito por dois ângulos: aqui o foco é que o
    // valor inválido chega a ser GRAVADO. O TaskCreateSchema é a única defesa,
    // e ela só age se a sugestão passar pelo create() — o que acontece no
    // fluxo da UI, mas não se a Cloud Function escrever direto no Firestore.
    const sugestao = respostaDaCallable({ priority: 'critical', source: 'claude' });

    await expectAsync(
      service.create({ title: 'Com sugestão ruim', priority: sugestao.priority } as never),
    ).toBeRejectedWith(jasmine.any(ZodError));

    // A defesa funcionou neste caminho: nada foi gravado.
    expect(db.count('tasks')).toBe(0);
  });

  it('CI-22 — callable que rejeita propaga o erro para quem chamou', async () => {
    // A Cloud Function pode estar indisponível, sem cota, ou bloqueada pelo
    // App Check. O serviço real faz `await callable(input)` sem try/catch,
    // então a rejeição sobe para o componente, que precisa tratá-la.
    const callableQueFalha = (): Promise<SuggestPriorityOutput> =>
      Promise.reject(new Error('functions/unavailable'));

    await expectAsync(callableQueFalha()).toBeRejectedWithError('functions/unavailable');

    // Invariante: a falha da sugestão NÃO impede o usuário de criar a tarefa
    // escolhendo a prioridade manualmente.
    const id = await service.create({
      title: 'Criada sem sugestão da IA',
      priority: TaskPriority.LOW,
    } as never);
    expect(db.raw('tasks', id)!['priority']).toBe(TaskPriority.LOW);
  });

  it('CI-28 — a correção proposta (schema zod na borda) detecta as quatro divergências na origem', () => {
    // Backlog item 1, validado aqui: três linhas no PrioritySuggestionService
    // movem a falha para a fronteira onde ela é causada.
    const SuggestPriorityOutputSchema = z.object({
      priority: TaskOutSchema.shape.priority,
      source: z.enum(['claude', 'heuristic']),
    });

    const valida = SuggestPriorityOutputSchema.safeParse({
      priority: 'high',
      source: 'claude',
    });
    expect(valida.success).toBeTrue();

    // CI-24, CI-25 e CI-27 passam a ser detectados no ponto da chamada.
    expect(
      SuggestPriorityOutputSchema.safeParse({ priority: 'Alta', source: 'claude' }).success,
    ).toBeFalse();
    expect(
      SuggestPriorityOutputSchema.safeParse({ priority: 'high' }).success,
    ).toBeFalse();
    expect(SuggestPriorityOutputSchema.safeParse(null).success).toBeFalse();

    // CI-26 continua tolerado — a correção não quebra a evolução do servidor.
    expect(
      SuggestPriorityOutputSchema.safeParse({
        priority: 'high',
        source: 'claude',
        confidence: 0.9,
      }).success,
    ).toBeTrue();
  });
});
