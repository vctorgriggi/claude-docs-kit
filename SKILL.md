---
name: docs
description: Cria, audita e mantém a documentação de agentes de um projeto (AGENTS, SPEC, PLAN e DOMAIN). Use para fundar o doc-set, preparar o briefing de uma tarefa, registrar decisões ou sincronizar documentos com o código. Não implementa tarefas nem substitui uma revisão de código.
---

# Documentação de agentes

Use o mesmo fluxo no Codex e no Claude Code. O contrato do projeto é
`AGENTS.md`; `CLAUDE.md` contém apenas `@AGENTS.md` para carregar esse contrato
no Claude Code. As regras e os dados não dependem de um agente específico.

## Localização e ferramentas

O diretório que contém **este** `SKILL.md` é a raiz do kit. Resolva seu caminho
absoluto a partir do local de onde a skill foi carregada, inclusive se houver
symlink. Nos exemplos, `DOCS_KIT` representa esse caminho: defina essa variável
em cada execução de shell que a usar. Não presuma que o kit está no diretório
atual nem em um caminho fixo do usuário.

O diretório atual é o projeto-alvo e deve continuar sendo ele ao executar o
verificador. Use as ferramentas de leitura, edição, shell e pesquisa disponíveis
no agente; esta skill não concede permissões adicionais.

Leia [grammar/GRAMATICA.md](grammar/GRAMATICA.md) antes de executar uma ação.
Se faltar, pare e informe a instalação incompleta; não invente a gramática.
Os [templates](templates/) são lidos somente quando seu documento for gerado.
O verificador requer Node ≥ 20:

```bash
node "$DOCS_KIT/bin/docscheck.mjs" --json .
node "$DOCS_KIT/bin/docscheck.mjs" --estado .
```

## Escolha da ação

A solicitação pode ser explícita (`$docs fundar` no Codex, `/docs fundar` no
Claude Code) ou em linguagem natural. O texto depois da ação é o contexto dela;
não dependa de substituição de argumentos específica de um agente. Leia apenas
o workflow da ação escolhida:

| Ação | Resultado | Procedimento |
| --- | --- | --- |
| `fundar [novo\|existente] [contexto]` | Cria, completa ou migra o doc-set após proposta | [fundar](workflows/fundar.md) |
| `tarefa [T2.1]` | Briefing de uma tarefa, sem implementar | [tarefa](workflows/tarefa.md) |
| `decidir [decisão\|resolver nome]` | Diff da decisão e das referências afetadas | [decidir](workflows/decidir.md) |
| `auditar [área]` | Relatório com evidência, sem escrever arquivos | [auditar](workflows/auditar.md) |
| `rodada [marco]` | Sincroniza o doc-set sem alterar código | [rodada](workflows/rodada.md) |
| `estado` | Resumo de fase, tarefas, pendências e marcador | Execute `--estado` e resuma o JSON; não altera arquivos |

Sem ação identificável, apresente essas opções brevemente e peça o objetivo.
Não inicie uma entrevista de fundação só porque a skill foi carregada.

## Escopo e autorização

As instruções explícitas do usuário e a autorização já dada na sessão
prevalecem. Prepare uma proposta ou diff concreto antes de pedir um aval que
esteja faltando; não peça novamente uma autorização que já cobre o trabalho.
`auditar`, `tarefa` e `estado` são somente leitura. As demais ações alteram
apenas a documentação aprovada. Bugs encontrados viram achados ou tarefas;
não reescreva requisitos vigentes para fazê-los coincidir com um defeito.

Ao criar `AGENTS.md` na raiz ou em um pacote, inclua no mesmo diff a ponte
`CLAUDE.md`, a partir do template. Se já existir conteúdo em qualquer um dos
dois, proponha primeiro a consolidação das instruções úteis em `AGENTS.md`;
nunca sobrescreva silenciosamente um contrato existente. A ponte não recebe
regras próprias. Não mantenha duas cópias do contrato.
