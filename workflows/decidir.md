# docs decidir

A regra 6 manda registrar a convenção **no momento da decisão**, não no fim do
marco. Sem um comando para isso, tudo cai na `docs rodada` e só entra o que
alguém lembrar de contar. Este é esse comando: uma edição pequena, cirúrgica,
no arquivo certo.

Use quando algo foi decidido durante a implementação — uma convenção adotada,
um caminho rejeitado, uma dívida assumida de propósito, uma decisão em aberto
que finalmente fechou.

## 0. Carregue a gramática

Leia `$DOCS_KIT/grammar/GRAMATICA.md`. Ausente: **pare** e diga
que a instalação está incompleta; restaure a gramática no diretório da skill. A tabela de jurisdição da regra 8 governa a classificação.

## 1. Classifique

Classifique a decisão por seu efeito. A classificação determina o arquivo e a
forma, e vem antes de qualquer escrita:

| a decisão é… | vira | onde |
| --- | --- | --- |
| uma regra de como escrever código aqui | convenção, com a justificativa na linha | `AGENTS.md` › Convenções |
| um caminho proibido, com custo conhecido | proibição em "Nunca fazer" | `AGENTS.md` › Nunca fazer |
| uma dívida assumida de propósito | entrada em "Gaps conhecidos", com o paliativo e onde ele vive | `AGENTS.md` › Gaps conhecidos |
| uma capacidade ou um critério de produto aprovado | funcionalidade ou critério; em "Planejado" enquanto não implementado | `SPEC.md` |
| uma exclusão de produto, ou uma feature descartada | linha em "Fora do escopo", com o porquê | `SPEC.md` |
| ainda **não** decidida — falta informação | decisão em aberto, no formato da regra 7 | o arquivo da jurisdição (regra 8) |

Ordem/execução (o que fazer antes do quê) é do `PLAN.md`; termo de domínio ou
lei de negócio é do `DOMAIN.md`. Uma decisão vive em **um** arquivo só; se ela
já existe em outro, o certo é remover a cópia, não escrever a segunda (regra 8).

Se o contexto da solicitação não deixar a classificação óbvia, pergunte **uma** coisa: qual
das linhas acima é. Não escreva por adivinhação.

## 2. Modo resolver

Com `resolver <nome>`, ou quando a decisão informada fecha uma pendência que já
está nos documentos:

1. Localize a linha `- [ ] **<decisão>** — …` e diga em qual arquivo ela está.
2. Classifique o **produto** dela pela tabela do §1 — foi resolvida virando o
   quê?
3. Proponha o diff: a linha pendente **sai** e o produto entra. Não marque
   `[x]` e pare por aí: `[x]` parado no arquivo é rodada que não terminou o
   trabalho (regra 7).
4. Se a resolução não produz nada que mude como um agente age, a linha
   simplesmente sai — e você diz isso ao usuário. O git guarda a íntegra
   (regra 2).
5. Se a seção ficar vazia, ela declara "Nenhuma pendente." (regra 6).

## 3. Proponha e escreva

Mostre o diff exato antes de escrever: o arquivo, a seção, a linha que entra e
a linha que sai. Uma decisão, um diff coerente, inclusive quando a pendência
sai de um arquivo e o resultado entra em outro — não aproveite para arrumar
o resto do documento; isso é trabalho da `docs rodada`, com o aval dela.

Com o OK, escreva. A linha nova segue a gramática:

- justificativa na própria linha, em poucas palavras (regra 9);
- sem cronologia de registro; datas que mudam ações vigentes seguem a marca
  `(vigência: <prazo> — <efeito>)` da regra 2;
- convenção vinda de fonte externa carrega `(fonte: docs oficiais <stack>
  <versão>, <mês/ano>)`, conforme a regra 9.

## 4. Feche

1. Se `$DOCS_KIT/bin/docscheck.mjs` existir, rode
   `node "$DOCS_KIT/bin/docscheck.mjs" .` e repare o que a edição tiver
   acendido.
2. Uma linha de resumo: o que foi registrado, onde, e o que saiu — se saiu.
3. Não atualize o marcador de rodada. Este comando não fecha marco; quem fecha
   é `docs rodada`.
