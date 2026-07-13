# SPEC.md

> Descreve o **linkcheck atual** — CLI que valida links internos de arquivos
> markdown. O que foi planejado mas ainda não implementado está na seção final
> "Planejado / não implementado (roadmap futuro)" — nada fora dela deve ser
> lido como já existente no app.

## Problema

Links internos de documentação quebram em silêncio: arquivos são renomeados,
títulos mudam e a referência só falha quando um leitor clica. Revisão manual
não escala nem em repositório pequeno. O linkcheck varre os `.md` de um
diretório e falha (exit code ≠ 0) quando encontra link interno quebrado, para
rodar em CI ou pre-commit.

## Usuários

- **Dev mantenedor de docs** — roda o comando localmente e no CI; quer saída
  curta e exit code confiável.

## Funcionalidades

### Essenciais

**Validação**

- Varre `*.md` recursivamente a partir do diretório dado (ignora
  `node_modules` e `.git`).
- Valida links internos relativos: o arquivo-alvo existe.
- Valida âncoras (`#secao`) por slug: minúsculas, NFD sem diacríticos,
  não-alfanumérico vira hífen — "## Configuração" casa com `#configuracao`.
- Relatório em texto simples: um link quebrado por linha
  (`arquivo:linha → alvo`), resumo final com contagem.
- Exit code: 0 sem quebras; 1 com quebras; 2 erro de uso.

### Fora do escopo

- Corrigir links automaticamente (a ferramenta reporta, não edita).

## Módulos

Um core puro e uma borda fina: `check` (varredura, extração, slug e validação;
sem I/O de processo) e `cli` (argv, relatório, exit code). Nada de
`process.exit` ou impressão atravessa para o core.

## Stack

- **Node ≥ 20, ESM** — stdlib apenas; testes com `node:test`.

## Constraints técnicas

1. **Zero dependências de runtime** — instalação por cópia; nada de supply
   chain em ferramenta de CI.

## Critérios de aceitação

1. Diretório com um link relativo para arquivo inexistente → exit 1 e o link
   listado com arquivo e linha.
2. Âncora com acento ("## Configuração" referenciada como `#configuracao`) →
   válida.
3. Diretório sem quebras → exit 0 e resumo "0 quebrado(s)".

## Planejado / não implementado (roadmap futuro)

> O que está abaixo é **planejado** e não faz parte do app atual. A
> arquitetura já acomoda: novos validadores entram como funções puras em
> `check`, sem tocar a borda.

### Links externos (HTTP)

Validação de URLs http(s) com timeout. Critério: URL 404 → listada; rede
indisponível → aviso, não falha.

### Relatório JSON

Flag `--json` para consumo por outras ferramentas. Critério: saída parseável
com schema estável.

## Decisões em aberto (a confirmar)

- [x] **Formato do relatório** — resolvido: texto simples por padrão; JSON
      adiado para o roadmap (rodada fase-1).
