# Regressão da gramática

> Cenários para avaliar o comportamento da skill em uma sessão nova, no Codex
> ou no Claude Code. O verificador cobre a forma dos documentos; estes casos
> cobrem decisões que exigem julgamento. Use cópias dos fixtures, sem tocar
> repositórios de trabalho. Os exemplos de chamada usam `/docs`; no Codex,
> substitua por `$docs`.

## Carregamento e roteamento

| Entrada | Resultado esperado |
| --- | --- |
| Skill carregada sem ação identificável | Apresenta as ações e pede o objetivo; não inicia a fundação |
| Gramática ausente na raiz da skill | Para e informa instalação incompleta; não inventa regras |
| Skill instalada em caminho com espaços; projeto em outro diretório | Lê os recursos a partir da skill e verifica o projeto-alvo |
| `/docs estado` em linkcheck | Resume Fase 2, três tarefas abertas e a pendência de timeout; nada escrito |

## Fundação

| Entrada | Resultado esperado |
| --- | --- |
| `/docs fundar novo` em diretório vazio | Entrevista, proposta e geração apenas dentro do aval |
| Usuário já passou contexto suficiente | Aproveita as respostas; não repete perguntas |
| Usuário diz “Prosseguir” sem responder tudo | Proposta parcial com pendências; não inventa regra de ouro |
| `/docs fundar existente` em notas-api | Observado, inferido com evidência e não determinável; oferece rotas para o documento existente |
| Projeto com CLAUDE.md contendo regras reais | Propõe consolidar em AGENTS.md antes de reduzir CLAUDE.md a `@AGENTS.md` |
| Monorepo com regras próprias por pacote | AGENTS.md e ponte local por pacote, sem copiar o contrato raiz |
| Uma única proibição específica | Mantém a proibição; não preenche outras só para atingir uma quantidade |
| Código viola requisito documentado | Registra o desvio; não transforma o defeito em requisito |
| Critérios de projeto novo | Descreve primeira entrega ainda não implementada, separada das fases posteriores |

## Trabalho cotidiano

| Entrada | Resultado esperado |
| --- | --- |
| `/docs tarefa T2.1` em linkcheck | Briefing com módulo, contrato, verificação e limites; nada implementado |
| `/docs tarefa` em pacote com regras locais diferentes da raiz | Lê os contratos da raiz até os arquivos da tarefa, cita as fontes e inclui as restrições locais no briefing; conflito sem resolução de escopo é exposto |
| `/docs tarefa T2.2` bloqueada por timeout | Nomeia a decisão pendente e a dependência; não escolhe timeout sozinho |
| `/docs tarefa T9.9` inexistente | Informa o id ausente e mostra alternativas reais |
| `/docs decidir resolver Timeout padrão dos links externos` | Propõe a troca da pendência pelo produto da decisão, no dono correto |
| `/docs auditar` com regra de ouro descumprida | Distingue bug de contrato desatualizado, com evidência e remediação proposta |
| Auditoria sem achados | Resposta curta; não inventa problemas |
| `/docs rodada marco` com mudanças não commitadas | Inclui status, diff e diff do índice além da janela do marcador |
| Rodada fecha fase e decisão | Remove fase concluída do PLAN; converte decisão; nomeia as remoções no resumo |
| Contrato expira em data futura | Preserva vigência e consequência explícita, sem transformar o documento em diário |
| Usuário já autorizou o diff ou escopo proposto | Executa dentro dessa autorização; não pede o mesmo aval novamente |

## Validação mecânica

Rode `node --test test/*.test.mjs`. A suíte inclui a instalação dos dois pontos
de entrada em homes temporários, links após renomear o checkout, conflitos com
arquivos existentes, regras do verificador, pontes do Claude e mutações dos
fixtures. Não inicia modelos nem depende de credenciais dos agentes.
