import { suggestPriorityHeuristic } from './heuristic';

describe('suggestPriorityHeuristic', () => {
  test.each([
    [
      'urgente — palavra-chave hoje',
      { title: 'Pagar boleto da internet — vence hoje', description: '' },
      'urgent',
    ],
    [
      'urgente — palavra-chave urgente',
      { title: 'URGENTE: ligar pro médico', description: '' },
      'urgent',
    ],
    [
      'high — reunião amanhã',
      { title: 'Reunião com cliente amanhã às 9h', description: '' },
      'high',
    ],
    [
      'high — palavra-chave prazo',
      { title: 'Revisar documento com prazo apertado', description: '' },
      'high',
    ],
    [
      'low — leitura',
      { title: 'Ler artigo sobre Signals do Angular', description: '' },
      'low',
    ],
    [
      'low — quando puder',
      {
        title: 'Organizar prateleira de livros',
        description: 'Quando puder, sem pressa nenhuma',
      },
      'low',
    ],
    [
      'low — texto curto sem palavras-chave',
      { title: 'Café', description: '' },
      'low',
    ],
    [
      'medium — caso geral',
      {
        title: 'Comprar parafusos',
        description: 'Passar na loja de ferragens da rua principal',
      },
      'medium',
    ],
  ])('%s', (_label, input, expected) => {
    expect(suggestPriorityHeuristic(input)).toBe(expected);
  });

  test('é determinística para o mesmo input', () => {
    const input = {
      title: 'Reunião urgente sobre entrega',
      description: 'Cliente pediu hoje',
    };
    const a = suggestPriorityHeuristic(input);
    const b = suggestPriorityHeuristic(input);
    const c = suggestPriorityHeuristic(input);
    expect(a).toBe(b);
    expect(b).toBe(c);
  });

  test('é case-insensitive', () => {
    expect(
      suggestPriorityHeuristic({ title: 'URGENTE', description: '' }),
    ).toBe('urgent');
    expect(
      suggestPriorityHeuristic({ title: 'urgente', description: '' }),
    ).toBe('urgent');
    expect(
      suggestPriorityHeuristic({ title: 'Urgente', description: '' }),
    ).toBe('urgent');
  });

  test('prioriza urgent sobre high quando os dois aparecem', () => {
    expect(
      suggestPriorityHeuristic({
        title: 'Reunião urgente amanhã',
        description: '',
      }),
    ).toBe('urgent');
  });
});
