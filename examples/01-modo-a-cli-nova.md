# Exemplo 1: /bootstrap novo — entrevista, proposta, geração

Sessão do Modo A sobre diretório vazio, com a semente passada na chamada.
Convenção do corpus: blockquotes em itálico são anotações deste documento;
todo o resto é a sessão.

---

**Usuário:** `/bootstrap novo uma CLI que valida links quebrados em arquivos markdown`

**Agente:** São 4 blocos curtos de perguntas; ao fim apresento a proposta de
arquivos e só gero após seu OK. A semente já responde parte do problema;
começo pelo que falta.

Bloco 1 — problema e usuários:

1. O que quebra hoje: links entre arquivos do repositório, âncoras
   (`#secao`), URLs externas?
2. Quem roda a ferramenta: só você, localmente, ou também o CI?

Prontidão: em descoberta.

> _A abertura anuncia a forma (blocos + gate) e pula o que `$ARGUMENTS` já
> respondeu — não refaz "que dor este projeto resolve"._

**Usuário:**

1. links internos e âncoras. externos seria bom mas não agora
2. eu e o CI

**Agente:** Bloco 2 — recorte da primeira entrega:

1. A menor entrega útil cabe em "varre `.md`, valida links internos, exit
   code ≠ 0 com quebra"?
2. Externos (HTTP) ficam para fase posterior — confirma?
3. Algo fora do escopo em definitivo?

Prontidão: em descoberta.

**Usuário:**

1. isso. âncora pode ficar pra depois tb se der trabalho
2. sim
3. corrigir link automaticamente. só reportar

**Agente:** Bloco 3 — stack e restrições:

1. Node, Python, outra? Versão mínima?
2. Pode ter dependência externa, ou precisa rodar onde só há o runtime?
3. Fora dos blocos, porque muda a regra de validação de âncora: os `.md` são
   lidos direto no GitHub ou passam por um gerador de site (que muda como as
   âncoras são geradas)?

Prontidão: refinando.

> _A pergunta 3 é a licença de wildcard em uso: fora dos blocos fixos, com a
> estaca declarada na própria pergunta (muda a regra de slug do SPEC) — não é
> ritual de completude._

**Usuário:**

1. node 20+
2. sem dependência nenhuma, é pra rodar em qualquer CI
3. github direto

**Agente:** Bloco 4 — disciplina:

1. "Sem dependência nenhuma" é candidata a regra de ouro — zero dependências
   de runtime, tudo na stdlib?
2. Proibições que você já conhece ("nunca X")?
3. O que precisaria estar verificado para você aceitar a entrega?
4. TDD por tarefa ou verificação manual?

Prontidão: refinando.

**Usuário:**

1. sim
2. não sei
3. testes
4. tdd

**Agente:** "Testes" ainda não é um critério: o que um teste teria que provar
para a Fase 1 estar pronta? Por exemplo: "diretório com um link para arquivo
inexistente → exit 1 e o link listado com arquivo e linha" — é isso?

> _Sondagem anti-satisficing: resposta rasa em bloco load-bearing recebe uma
> sondagem por especificidade. Se o vazio persistisse, viraria decisão em
> aberto — nunca critério inventado._

**Usuário:** isso que vc escreveu tá bom. e âncora com acento tem que funcionar

**Agente:** Cobertura — 0 Regra-de-ouro candidata: zero dependências de
runtime · 1 Problema/usuários: links internos quebram em silêncio; dev + CI ·
2 Recorte da Fase 1: varrer `.md`, validar links internos, exit code; âncoras
se couber · 3 Stack/segredos: Node ≥ 20, sem segredos · 4
Disciplina/critérios: TDD; exit 1 + listagem com linha; âncora acentuada.

Prontidão: pronto para propor.

**Proposta.**

- **SPEC.md** — problema, recorte e critérios. Âncoras entram na seção
  "Planejado" (você as marcou "se der trabalho"); HTTP e relatório JSON idem.
- **PLAN.md** — Fase 0: core puro com TDD (extração e validação); Fase 1:
  CLI. A ordem isola a lógica testável da borda.
- **CLAUDE.md** — regra de ouro: **zero dependências de runtime**. Sem seção
  "Nunca fazer" por ora: não existem 4 proibições específicas, e a gramática
  proíbe preenchê-la com itens genéricos. Registro uma decisão em aberto: o
  formato do relatório (texto simples vs JSON).
- **Sem ROADMAP** — as ambições além do SPEC cabem na seção "Planejado"; um
  arquivo a mais não teria razão de existir.

Esqueleto de fases: Fase 0 (fundação testada) → Fase 1 (CLI utilizável em
CI). Aprova, ou ajusta?

> _Escala honesta duas vezes: "Nunca fazer" não nasce vazia nem genérica, e o
> ROADMAP é recusado com justificativa pela paleta de arquivos (§4)._

**Usuário:** aprovado

**Agente:** [gera SPEC.md, depois PLAN.md, depois CLAUDE.md. Abertura do SPEC
gerado:]

```
# SPEC.md

> Descreve o **linkcheck** — o que vamos construir: CLI que valida links
> internos de arquivos markdown. O que foi planejado mas não faz parte da
> primeira entrega está na seção final "Planejado / fases posteriores" —
> nada fora dela deve ser lido como escopo da Fase 1.
```

Checagens de entrega: fronteira presente/futuro no SPEC com blockquote de
reforço — ok; "Nunca fazer" ausente por falta de 4 proibições — ok; os 2
critérios de aceitação viram teste — ok; rastreabilidade T0.x/T1.x → módulos
check/cli, risco → constraint 1 — ok; zero placeholder — ok; teste de
deleção: duas linhas redundantes cortadas do CLAUDE.md — reparado.

Resumo: SPEC.md (o quê e por quê; âncoras, HTTP e JSON em Planejado), PLAN.md
(Fase 0 core puro, Fase 1 CLI), CLAUDE.md (regra de ouro: zero dependências;
decisão em aberto: formato do relatório). Rode `/rodada <nome>` ao fechar
cada marco.

> _As checagens de entrega re-aplicam os invariantes ao artefato já escrito —
> a norma vira gate, e uma falha real (linhas redundantes) foi reparada antes
> da entrega. O estado destes arquivos após a rodada "fase-1" está em
> [`fixtures/linkcheck/`](fixtures/linkcheck/); a diferença entre o gerado
> aqui e aquele estado é exatamente o diff do [exemplo 3](03-rodada.md)._
