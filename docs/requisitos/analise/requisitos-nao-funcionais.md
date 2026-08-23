# Requisitos Não Funcionais — fed-catalogo-tarefas

Resultado da atividade 2 do exercício prático da Unidade III.

**Fontes de elicitação analisadas:** [`docs/escopo-MVP.md`](../../escopo-MVP.md),
[`docs/decisoes.md`](../../decisoes.md), [`docs/riscos/`](../../riscos/) e o
[README do projeto](../../../README.md).

> **Nota sobre a numeração.** RNF-001..RNF-005 vêm do escopo do MVP e foram
> mantidos. RNF-006 em diante são novos, derivados da análise — em boa parte a
> partir dos artefatos de gestão de riscos, que descreviam exigências de
> segurança e custo que nunca haviam sido escritas como requisitos.

---

## Requisitos consolidados

| ID | Requisito | Categoria (ISO/IEC 25010) | Origem | Estado |
|---|---|---|---|---|
| RNF-001 | O frontend deve ser construído em Angular ≥ 19 com componentes standalone, Signals para estado e SCSS para estilo. | Manutenibilidade | escopo-MVP | Atendido |
| RNF-002 | A persistência deve usar AngularFire (Firestore) pela API funcional (`inject`). | Manutenibilidade | escopo-MVP | Atendido |
| RNF-003 | Os modelos trafegados devem ser validados em runtime com zod, em paralelo aos tipos TypeScript. | Confiabilidade | escopo-MVP | Atendido |
| RNF-004 | A página principal de tarefas deve atingir TTI inferior a 3 segundos em rede 3G simulada. | Eficiência de desempenho | escopo-MVP | **Não atendido** (Lighthouse = 53; bundle inicial ~638 kb) |
| RNF-005 | A interface deve atender WCAG 2.1 nível AA nos critérios de navegação por teclado, contraste e rotulagem ARIA, sem violações `serious` ou `critical`. | Usabilidade | escopo-MVP | Atendido (axe-core = 100) |
| RNF-006 | Nenhuma requisição de leitura ou escrita em `/tasks` deve ser atendida sem um usuário autenticado cujo `uid` corresponda ao campo `userId` do documento. | Segurança | Derivado — R-03, DEC-004 | Atendido |
| RNF-007 | A chave da API da Anthropic não deve estar presente no repositório nem no bundle entregue ao navegador, sendo lida exclusivamente de um cofre de segredos em tempo de execução da função. | Segurança | Derivado — R-01, README §Segurança | Atendido |
| RNF-008 | A função de sugestão de prioridade deve rejeitar chamadas sem token de App Check válido e sem contexto de autenticação válido. | Segurança | Derivado — R-01, DEC-006 | Atendido |
| RNF-009 | A indisponibilidade ou o erro do provedor externo de IA não deve impedir o usuário de obter uma sugestão de prioridade. | Confiabilidade (tolerância a falhas) | Derivado — DEC-005 | Atendido (fallback heurístico) |
| RNF-010 | A lógica de classificação de prioridade não deve ser duplicada entre o caminho de IA e o caminho heurístico: ambos devem ser alcançados por uma única interface de serviço. | Manutenibilidade | Derivado — DEC-005 | Atendido |
| RNF-011 | O custo médio por sugestão de prioridade deve permanecer na ordem de US$ 0,0001, e o projeto deve ter alerta de orçamento configurado. | Eficiência / restrição de custo | Derivado — R-08 | Parcial (custo atendido; alerta é item de checklist) |
| RNF-012 | A interface deve ser utilizável em telas de largura a partir de 360 px sem rolagem horizontal. | Usabilidade / portabilidade | Derivado — "web responsiva" no fora-de-escopo do MVP | A verificar |

---

## Observações da análise

### RNF-004 é o único requisito reprovado — e isso é informação, não erro

O material de elicitação declarava o requisito e o resultado da medição
separadamente. A análise os aproximou: RNF-004 está **escrito corretamente** —
é específico, mensurável e verificável — e mesmo assim **não foi atendido**.
Essa distinção importa: um requisito não atendido não é um requisito ruim.
A justificativa de negócio para aceitar a reprovação está registrada no backlog
e permanece válida.

### RNF-012 nasceu de uma ambiguidade, não de uma fonte

"Apenas web responsiva" aparecia no material somente como *negação* de um app
mobile nativo. Isso não é um requisito: não diz até onde a responsividade
precisa ir. RNF-012 propõe um limiar verificável (360 px), mas o valor é uma
**sugestão do analista** e precisa de confirmação — está registrado em
[`duvidas-e-lacunas.md`](./duvidas-e-lacunas.md) como pergunta em aberto.

### Requisitos de qualidade que permanecem sem número

Os testes automatizados (16 unitários, E2E com Playwright, axe-core) e o
`Makefile` aparecem no backlog como itens de "Qualidade", mas descrevem
**práticas de construção**, não propriedades observáveis do produto em operação.
Optou-se por **não** convertê-los em RNFs: um requisito não funcional deve
poder ser verificado no sistema entregue, e "existir teste unitário" é
verificável no repositório, não no sistema. Mantidos como itens de backlog.
