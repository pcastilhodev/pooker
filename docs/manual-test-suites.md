# Suítes de Teste Manual — Pooker

Este documento define suítes de teste manual para os fluxos principais do
usuário final da aplicação Pooker, complementando os testes automatizados
(unitários, de integração e o scan de segurança OWASP ZAP) descritos no
restante do projeto. Cada suíte cobre um fluxo de ponta a ponta através do
frontend Angular, exercitando os microsserviços de backend por trás dele.

## Como usar este documento

- **Pré-condições** listam o estado necessário do sistema antes de iniciar a suíte.
- Cada caso de teste tem: passos, resultado esperado e prioridade (Alta/Média/Baixa).
- **Ambiente**: aplicação rodando localmente via `docker-compose` (frontend em
  `http://localhost:4200`), com o Postgres de `docker-compose.local.yml` no ar.
- Ao executar, registre PASS/FAIL e anexe evidência (screenshot) para qualquer FAIL.

---

## Suíte 1 — Cadastro e Autenticação

**Objetivo**: garantir que um novo usuário consiga criar conta, autenticar-se,
permanecer autenticado durante a navegação e encerrar a sessão corretamente.

**Pré-condições**: aplicação carregada na página inicial, usuário deslogado
(sem token válido em localStorage), e-mail de teste ainda não cadastrado.

**Componente/tela**: modal de login/cadastro (aba "Entrar" / "Criar conta"
no cabeçalho).

| # | Caso de teste | Passos | Resultado esperado | Prioridade |
|---|---|---|---|---|
| 1.1 | Cadastro com dados válidos | 1. Clicar em "Entrar" no cabeçalho. 2. Selecionar a aba "Criar conta". 3. Preencher nome, e-mail nunca usado, senha com 8+ caracteres, CPF (11 dígitos) e telefone válidos. 4. Clicar em "Criar conta". | Conta é criada, toast de sucesso é exibido, o modal fecha e o usuário aparece autenticado (nome/iniciais no cabeçalho). | Alta |
| 1.2 | Cadastro com e-mail já existente | 1. Repetir o cadastro do caso 1.1 usando o **mesmo e-mail**. | Um toast/mensagem de erro é exibido informando que o e-mail já está em uso; nenhuma nova conta é criada; o modal permanece aberto. | Alta |
| 1.3 | Cadastro com senha curta ou CPF inválido | 1. Abrir "Criar conta". 2. Preencher senha com menos de 8 caracteres ou CPF com menos/mais de 11 dígitos. 3. Tentar submeter. | O formulário bloqueia o envio (validação client-side) e destaca o(s) campo(s) inválido(s); nenhuma requisição é enviada ao backend. | Média |
| 1.4 | Login com credenciais válidas | 1. Abrir "Entrar". 2. Informar e-mail e senha de uma conta já cadastrada (ex.: criada no caso 1.1). 3. Clicar em "Entrar". | Toast de sucesso, modal fecha, cabeçalho passa a exibir o usuário autenticado; recarregar a página mantém a sessão (token persistido). | Alta |
| 1.5 | Login com senha incorreta | 1. Abrir "Entrar". 2. Informar e-mail válido com senha incorreta. 3. Clicar em "Entrar". | Toast/mensagem de erro é exibido; usuário permanece na tela de login, não autenticado. | Alta |
| 1.6 | Logout | 1. Com um usuário autenticado, abrir o menu do cabeçalho. 2. Clicar em "Sair"/logout. | Sessão é encerrada (token removido), cabeçalho volta a exibir o botão "Entrar"; rotas que exigem autenticação passam a redirecionar/bloquear ação. | Média |

---

## Suíte 2 — Aluguel de Filme

**Objetivo**: validar o fluxo completo de alugar um filme, incluindo a
integração com o serviço de pagamento e o controle de cópias disponíveis.

**Pré-condições**: usuário autenticado (ver Suíte 1); existe pelo menos um
filme no catálogo com `copias_disponiveis > 0`; existe pelo menos um filme
com `copias_disponiveis = 0` (ou é possível esgotar as cópias repetindo o
aluguel).

**Componente/tela**: página de detalhe do filme (`/movie/:id`).

| # | Caso de teste | Passos | Resultado esperado | Prioridade |
|---|---|---|---|---|
| 2.1 | Alugar filme com cópias disponíveis | 1. Navegar até um filme com cópias disponíveis. 2. Clicar no botão "Alugar — R$ X,XX". | Botão muda para "Processando…" durante a chamada; ao concluir, toast de sucesso exibe o valor cobrado; o filme aparece em "Meus aluguéis" com status "Ativo" e data prevista de devolução. | Alta |
| 2.2 | Tentar alugar sem estar autenticado | 1. Fazer logout (ou usar aba anônima). 2. Navegar até um filme. 3. Clicar em "Alugar". | Toast "Faça login para alugar este filme." é exibido; nenhum aluguel é criado. | Alta |
| 2.3 | Tentar alugar filme sem cópias disponíveis | 1. Navegar até um filme com `copias_disponiveis = 0` (ou esgotar as cópias alugando repetidamente com contas diferentes). 2. Clicar em "Alugar". | Toast de erro ("Não foi possível concluir o aluguel...") é exibido; nenhum novo registro de aluguel é criado; o contador de cópias disponíveis não muda. | Alta |
| 2.4 | Cópias disponíveis decrementam após aluguel | 1. Anotar o número de cópias disponíveis exibido na página do filme. 2. Alugar o filme (caso 2.1). 3. Recarregar a página do filme. | O número de cópias disponíveis exibido diminuiu em 1 em relação ao valor anotado. | Média |
| 2.5 | Aluguel aparece em "Meus aluguéis" com valor e data corretos | 1. Alugar um filme. 2. Navegar até "Meus aluguéis". | O item alugado aparece na lista com título do filme, status "Ativo" e a data prevista de devolução (aluguel + 3 dias), consistente com o valor cobrado no toast. | Média |

---

## Suíte 3 — Avaliação e Comentários de Filme

**Objetivo**: garantir que um usuário autenticado consiga avaliar (nota em
estrelas) e comentar um filme, e que essas ações fiquem bloqueadas para
visitantes não autenticados.

**Pré-condições**: existe pelo menos um filme cadastrado; para os casos de
usuário autenticado, é necessário estar logado (ver Suíte 1).

**Componente/tela**: página de detalhe do filme (`/movie/:id`), seção de
avaliação e seção de comentários.

| # | Caso de teste | Passos | Resultado esperado | Prioridade |
|---|---|---|---|---|
| 3.1 | Avaliar filme com estrelas (usuário autenticado) | 1. Autenticado, navegar até um filme ainda não avaliado por esse usuário. 2. Clicar em uma quantidade de estrelas (ex.: 4) no componente "Avaliar". | Toast "Avaliação registrada" é exibido; a média/qtd. de avaliações do filme é atualizada; o rótulo passa a exibir "Sua nota" com o valor escolhido. | Alta |
| 3.2 | Alterar avaliação já registrada | 1. Repetir o caso 3.1. 2. No mesmo filme, clicar em uma nota diferente (ex.: 2 estrelas). | A nota do usuário é atualizada para o novo valor; a média geral do filme é recalculada; não é criado um registro duplicado de avaliação para o mesmo usuário. | Média |
| 3.3 | Avaliar sem estar autenticado | 1. Sem estar logado, navegar até um filme. 2. Clicar em uma quantidade de estrelas. | Toast "Faça login para avaliar este filme." é exibido; nenhuma nota é registrada. | Alta |
| 3.4 | Publicar comentário (usuário autenticado) | 1. Autenticado, navegar até um filme. 2. Escrever um texto no campo de comentário. 3. Clicar em "Publicar". | Toast "Comentário publicado." é exibido; o comentário aparece imediatamente na lista de comentários do filme, associado ao nome do usuário. | Alta |
| 3.5 | Publicar comentário vazio | 1. Autenticado, deixar o campo de comentário em branco. 2. Clicar em "Publicar". | Toast de aviso "Escreva algo antes de publicar." é exibido; nenhum comentário vazio é adicionado à lista. | Média |
| 3.6 | Excluir o próprio comentário | 1. Publicar um comentário (caso 3.4). 2. Clicar no botão de excluir (✕) desse comentário. | O comentário some da lista imediatamente e não reaparece ao recarregar a página. | Baixa |
| 3.7 | Comentar sem estar autenticado | 1. Sem estar logado, navegar até um filme com comentários existentes. 2. Tentar publicar um comentário. | Toast "Faça login para comentar." é exibido; nenhum comentário é adicionado. | Média |

---

## Registro de execução

Ao executar estas suítes (manualmente, por build/versão), preencher uma
tabela como a abaixo e anexar ao relatório final do projeto:

| Suíte | Caso | Data | Executor | Resultado | Observações |
|---|---|---|---|---|---|
| 1 | 1.1 | | | | |
| ... | | | | | |
