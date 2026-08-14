# linkcheck

> CLI Node sem dependências que valida links internos de arquivos markdown.

Leia este arquivo no início de toda sessão — ele é o **contrato de como
escrevemos código aqui**, não documentação. Quando uma convenção for decidida
durante a implementação, registre-a aqui. Contexto detalhado mora em @SPEC.md
(o quê e por quê) e @PLAN.md (ordem de execução).

**Fase atual = links externos (HTTP).** O core interno e a CLI estão de pé; o
relatório JSON é fase posterior e não deve ser antecipado.

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
  hífen (âncora acentuada não casa com o alvo sem a normalização).
- Relatório: texto simples é a única saída; formato alternativo entra apenas
  com consumidor real (uma saída só mantém o core sem formatador).
- Erros de uso saem pela `cli.js` com exit 2; o core lança `Error` simples e
  nunca decide exit code.
- Borda de rede: toda chamada HTTP entra atrás de um fetcher injetável, para
  a suíte unitária rodar offline.

## Nunca fazer

- Nunca adicionar dependência de runtime — instalação por cópia é constraint
  do SPEC; supply chain em ferramenta de CI é risco desproporcional.
- Nunca chamar `process.exit` dentro de `check.js` — mata a testabilidade do
  core sem subprocess.
- Nunca abrir socket em teste unitário — a suíte tem que passar offline e em
  runner sem rede.
- Nunca corrigir link automaticamente — a ferramenta reporta e não edita
  (está em "Fora do escopo" no SPEC).

## Gaps conhecidos

1. **G1 — âncoras de headings HTML inline não são detectadas** — sem parser
   HTML na stdlib; paliativo: os docs do projeto usam apenas headings
   markdown. Revisitar se surgir falso negativo real.

## Decisões em aberto

Nenhuma pendente.
