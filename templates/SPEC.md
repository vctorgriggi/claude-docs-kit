# SPEC.md

> Descreve o **<projeto> atual** <ou, em projeto novo: "o frontend/app/serviço
> X — o que vamos construir">. O que foi planejado mas ainda não implementado
> está na seção final "Planejado / <fases posteriores | não implementado
> (roadmap futuro)>" — nada fora dela deve ser lido como <já existente no app |
> escopo da primeira entrega>.

## Problema

<A dor, por que as alternativas não servem e o que este projeto faz. Numerado
quando o projeto faz mais de uma coisa. 2 a 4 parágrafos.>

## Usuários

- **<perfil>** — <o que faz e o que quer>.
- **(Fase posterior) <perfil futuro>** — <marcado como tal, nunca misturado aos atuais>.

## Funcionalidades

### Essenciais<, com o sufixo "— Fase 1" quando houver fases>

**<grupo>**

- <capacidade observável, com os detalhes de comportamento que importam:
  defaults, toggles, timers, edge cases já decididos>.

### Fora do escopo

- <exclusão deliberada, com justificativa curta quando não for óbvia>.

## Módulos

<Arquitetura em uma frase (por exemplo, "um core, várias views") seguida da
lista de módulos, com a responsabilidade de cada um e o que nunca atravessa as
fronteiras entre eles.>

## Stack

- **<tecnologia>** — <papel; justificativa quando a escolha não for óbvia>.

<Sem versões aqui: a tabela de Stack com versões tem dono no CLAUDE.md, que é
onde ela ancora no manifest (regra 8). Este parágrafo diz qual tecnologia e
por quê; o CLAUDE diz qual versão.>

## Constraints técnicas

1. **<nome curto da constraint>** — <o fato duro e a mitigação ou decisão tomada>.
2. ...

## Critérios de aceitação

1. <Verificável: ação e resultado observável. Cada critério vira teste ou roteiro.>
2. ...

## Planejado / <fases posteriores | não implementado (roadmap futuro)>

> O que está abaixo é **planejado** e não faz parte <da Fase 1 | do app atual>.
> <Como a arquitetura já acomoda isso sem depender disso.>

### <feature futura>

<Descrição, constraints associadas e critérios de aceitação para quando for
implementada. O futuro também recebe critérios.>

## Decisões em aberto (a confirmar)

- [ ] **<decisão>** — <contexto e opções>.
<Sem linha para decisão resolvida: resolver é remover a linha e escrever o
que ela produziu — convenção, proibição, gap ou exclusão de escopo (regra 7).>
