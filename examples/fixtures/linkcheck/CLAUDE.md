# linkcheck

> CLI Node sem dependências que valida links internos de arquivos markdown.

Leia este arquivo no início de toda sessão — ele é o **contrato de como
escrevemos código aqui**, não documentação. Quando uma convenção for decidida
durante a implementação, registre-a aqui. Contexto detalhado mora em @SPEC.md
(o quê e por quê) e @PLAN.md (ordem de execução).

## Regra de ouro

**Zero dependências de runtime: toda funcionalidade usa apenas a stdlib do
Node.** Tudo abaixo é desdobramento disso. Uma feature que "precisa" de pacote
externo ou é reescrita sobre a stdlib ou não entra; a borda de CLI fica fina
para o core continuar puro e testável sem mock.

## Stack

| Camada  | Tecnologia     |
| ------- | -------------- |
| Runtime | Node ≥ 20, ESM |
| Testes  | node:test      |

## Estrutura

```
src/
  check.js   # core puro: extração, slug e validação (sem process/argv/print)
  cli.js     # borda: argv, relatório em texto, exit code
test/
  check.test.js
```

## Como rodar

```bash
node src/cli.js docs/   # valida um diretório
node --test             # testes
```

## Convenções

- Core puro: `check.js` não lê argv, não imprime e não chama `process.exit`;
  recebe caminhos e devolve dados (mantém os critérios de aceitação
  testáveis sem subprocess).
- Slug de âncora: minúsculas, NFD sem diacríticos, não-alfanumérico vira
  hífen (decidido na fase-1: âncoras acentuadas falhavam sem normalização).
- Erros de uso saem pela `cli.js` com exit 2; o core lança `Error` simples e
  nunca decide exit code.

## Gaps conhecidos

1. **G1 — âncoras de headings HTML inline não são detectadas** — aceito na
   fase-1 (sem parser HTML na stdlib); paliativo: os docs do projeto usam
   apenas headings markdown. Revisitar se surgir falso negativo real.

## Decisões em aberto

- [x] **Formato do relatório** — resolvido: texto simples; JSON adiado para
      o roadmap (rodada fase-1).

Nenhuma pendente.
