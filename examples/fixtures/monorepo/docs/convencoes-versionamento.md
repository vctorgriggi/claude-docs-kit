# Convenções de versionamento

> Extraído do AGENTS.md (regra 11): o procedimento cresceu além de meia página
> e passou a ter dono próprio. O ponteiro de volta está nas Convenções do
> contrato raiz.

## Lockstep

Os dois pacotes sobem a mesma versão na mesma hora, mesmo quando só um mudou.

O motivo é o consumidor: quem instala `@tarifa/cli` recebe `@tarifa/nucleo`
como dependência, e versão independente cria a combinação em que a CLI de uma
versão fala com um núcleo de outra. A combinação é válida no `package.json` e
inválida na prática — a fronteira entre os dois é a tabela de faixas, que muda
de forma junto com o cálculo.

O custo aceito é uma versão nova do núcleo quando só a CLI mudou. É barato:
ninguém paga por baixar um pacote idêntico com número diferente.

## Procedimento

1. `npm version <nova> --workspaces` — os dois `package.json` de uma vez.
2. A dependência de `cli` para `nucleo` aponta a versão exata, nunca faixa.
3. Uma tag só, no monorepo, com o número que os dois receberam.

## O que não muda a versão

Mudança que não atravessa a fronteira publicada — teste, comentário, recipe de
pacote — não sobe versão. A pergunta é sempre "um consumidor externo notaria?".
