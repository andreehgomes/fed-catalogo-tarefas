#!/usr/bin/env node
/**
 * Verifica a paridade entre o `IntegrationTaskService` (harness dos testes de
 * integração) e o `TaskService` de produção.
 *
 * ## Por que existe
 *
 * O harness replica a lógica de fronteira do serviço real, porque as funções
 * do SDK do Firestore são imports ESM não interceptáveis — ver o docblock de
 * `src/app/integration/harness/integration-task-service.ts`. Uma réplica pode
 * divergir do original em silêncio: se o `TaskService` mudar a ordem das
 * checagens, os testes de integração continuariam verdes testando um
 * comportamento que o sistema não tem mais.
 *
 * Este script é a mitigação: lê o código-fonte dos dois arquivos e compara a
 * sequência de operações de fronteira em cada método.
 *
 * Roda fora do Karma porque precisa de acesso ao filesystem (o bundler do
 * Angular não resolve `?raw` para arquivos `.ts`).
 *
 * Uso:
 *   node scripts/check-harness-parity.mjs
 *
 * Sai com código 1 e um diff legível se houver divergência.
 *
 * ## Limitação
 *
 * Comparar texto de código detecta reordenação e remoção de etapas — as
 * divergências que importam — mas não detecta mudança de semântica dentro de
 * uma etapa. A solução definitiva é o Firebase Emulator Suite; ver o backlog
 * em `docs/pos-ia/forum-testes-integracao/casos-de-teste.md`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const REAL = resolve(here, '../src/app/services/task.service.ts');
const HARNESS = resolve(here, '../src/app/integration/harness/integration-task-service.ts');

/** Extrai o corpo de um método pelo início da assinatura, balanceando chaves. */
function methodBody(source, signature, label) {
  const start = source.indexOf(signature);
  if (start < 0) {
    throw new Error(`método "${signature}" não encontrado em ${label}`);
  }
  const from = source.indexOf('{', start);
  let depth = 0;
  for (let i = from; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(from, i + 1);
    }
  }
  throw new Error(`corpo não fechado para "${signature}" em ${label}`);
}

/**
 * Reduz o corpo de um método à sequência de etapas de fronteira, na ordem em
 * que aparecem. Cada padrão cobre as duas escritas: SDK (serviço real) e fake
 * (harness).
 */
function stepSequence(body) {
  const patterns = [
    ['requireUserId', /requireUserId\(\)/g],
    ['parseCreate', /TaskCreateSchema\.parse\(/g],
    ['parseUpdate', /TaskUpdateSchema\.parse\(/g],
    ['read', /\bgetDoc\(/g],
    ['checkMissing', /!snap\.exists\(\)|if \(!raw\)/g],
    // Cobre as escritas da checagem de ownership nos dois arquivos:
    // `(snap.data() as TaskRaw).userId` e `raw.userId` no serviço real,
    // `raw['userId']` no harness. O sufixo comum é ` !== userId`.
    ['checkOwnership', /userId(?:'\])? !== userId/g],
    ['write', /\b(addDoc|updateDoc|deleteDoc)\(/g],
    ['mapOut', /mapSnapshot\(/g],
  ];

  const hits = [];
  for (const [step, re] of patterns) {
    for (const m of body.matchAll(re)) hits.push({ index: m.index ?? 0, step });
  }
  return hits.sort((a, b) => a.index - b.index).map((h) => h.step);
}

const real = readFileSync(REAL, 'utf8');
const harness = readFileSync(HARNESS, 'utf8');

const methods = ['create', 'getById', 'update', 'delete'];
const failures = [];

for (const name of methods) {
  const sig = `async ${name}(`;
  const esperado = stepSequence(methodBody(real, sig, 'task.service.ts'));
  const obtido = stepSequence(methodBody(harness, sig, 'integration-task-service.ts'));

  if (JSON.stringify(esperado) !== JSON.stringify(obtido)) {
    failures.push({ name, esperado, obtido });
  } else {
    console.log(`  ok  ${name}()  [${esperado.join(' → ')}]`);
  }
}

// Invariantes que sustentam CI-07 e CI-17: a janela de concorrência só existe
// porque há exatamente uma leitura antes da escrita, e o not-found da escrita
// não é convertido em erro de domínio.
const updateReal = methodBody(real, 'async update(', 'task.service.ts');
const leituras = [...updateReal.matchAll(/\bgetDoc\(/g)].length;
if (leituras !== 1) {
  failures.push({
    name: 'update() — janela de concorrência',
    esperado: ['exatamente 1 getDoc antes da escrita'],
    obtido: [`${leituras} getDoc`],
  });
} else {
  console.log('  ok  update() mantém a janela de concorrência de CI-07/CI-17');
}

if (updateReal.includes('catch')) {
  failures.push({
    name: 'update() — backlog item 6',
    esperado: ['sem try/catch (not-found vaza cru)'],
    obtido: ['há try/catch: o item 6 do backlog pode ter sido implementado'],
  });
} else {
  console.log('  ok  update() ainda não converte not-found (backlog item 6 pendente)');
}

if (failures.length > 0) {
  console.error('\nDIVERGÊNCIA entre o harness e o TaskService de produção:\n');
  for (const f of failures) {
    console.error(`  ${f.name}`);
    console.error(`    produção: ${f.esperado.join(' → ')}`);
    console.error(`    harness:  ${f.obtido.join(' → ')}\n`);
  }
  console.error(
    'Os testes de integração podem estar verdes testando um comportamento\n' +
      'que o sistema não tem mais. Alinhe o harness ou atualize os casos.\n',
  );
  process.exit(1);
}

console.log('\nParidade OK: o harness reflete a sequência de operações do serviço real.');
