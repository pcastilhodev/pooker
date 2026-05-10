# Apresentação Técnica — CI/CD com GitHub Actions e SonarQube
## Projeto Pooker

---

## 3. Apresentação do Tema

### a) Histórico e contexto

O conceito de Integração Contínua (CI) foi formalizado por Kent Beck e Martin Fowler no final dos anos 1990
como uma das práticas do Extreme Programming (XP). O problema que motivou a prática era o chamado
"integration hell": times de software trabalhavam semanas em branches isoladas e, ao tentar integrar o
código de todos, encontravam tantos conflitos e regressões que o processo levava dias ou semanas para
ser resolvido.

A resposta foi simples mas poderosa: integrar frequentemente — idealmente, várias vezes por dia.
Cada integração dispara uma sequência automatizada de compilação e testes, garantindo que o código
sempre está em estado saudável.

Com o amadurecimento das práticas DevOps no início dos anos 2010, CI evoluiu para CD (Entrega Contínua
e Implantação Contínua), expandindo a automação até o deploy em produção. Ferramentas como Jenkins (2011),
Travis CI (2011), GitLab CI (2012) e GitHub Actions (2018) tornaram essa infraestrutura acessível a
qualquer projeto.

Paralelamente, a análise estática de código ganhou força como complemento aos testes dinâmicos.
O SonarQube, lançado em 2008 pela SonarSource, tornou-se referência de mercado para análise de qualidade
contínua — medindo não apenas cobertura de testes, mas também bugs, vulnerabilidades de segurança,
code smells e dívida técnica.

### b) Visão geral e importância no contexto de testes de software

No contexto de testes de software, CI/CD e análise estática são complementares:

- **Testes dinâmicos (CI)**: verificam se o código *funciona* — JUnit, pytest, Karma executam o software
  e verificam comportamentos esperados.

- **Análise estática (SonarQube)**: verificam se o código é *seguro e manutenível* — sem executar o
  software, inspeciona padrões problemáticos, caminhos não testados, vulnerabilidades e complexidade.

A importância está na **detecção precoce**: um bug encontrado no momento do commit custa muito menos
para corrigir do que um bug encontrado em produção. O estudo NIST (2002) estimou que corrigir um defeito
após o deploy custa até 30 vezes mais do que corrigi-lo durante o desenvolvimento. CI/CD + análise
estática empurram a detecção para o momento mais cedo possível no ciclo de vida.

---

## 4. Processo de Utilização

### a) Etapas para correta implementação

**Etapa 1 — Repositório e controle de versão**
- O projeto deve estar em um repositório Git com branches de integração definidas (main/develop).
- Branches de feature devem ser curtas e integradas frequentemente.

**Etapa 2 — Configuração do runner**
- Escolher entre runner cloud (gratuito com limite) ou self-hosted (ilimitado, requer máquina).
- Para projetos acadêmicos ou com infraestrutura local (SonarQube on-premise), self-hosted é preferível.
- O runner precisa ter todas as ferramentas de build instaladas: JDK, Python, Node.js.

**Etapa 3 — Escrita das pipelines (arquivos YAML)**
- Definir gatilhos: quais branches e quais caminhos de arquivo disparam cada pipeline.
- Estruturar os steps: checkout → setup de ambiente → build → testes → análise → artefato.
- Usar cache de dependências para reduzir tempo de execução (Gradle, pip, npm).

**Etapa 4 — Configuração do servidor de qualidade**
- Instalar e configurar o SonarQube.
- Criar um projeto por serviço com chave única.
- Configurar o Quality Gate com os critérios desejados (cobertura mínima, zero bugs críticos, etc.).
- Gerar token de autenticação e guardá-lo como secret no repositório (nunca no código).

**Etapa 5 — Integração das ferramentas de cobertura**
- Java: configurar plugin JaCoCo no build (Gradle ou Maven) para gerar relatório XML.
- Python: usar pytest-cov com saída no formato Cobertura XML.
- JavaScript/TypeScript: configurar Istanbul/Karma para saída LCOV.
- Apontar os caminhos dos relatórios no sonar-project.properties de cada serviço.

**Etapa 6 — Quality Gate bloqueante**
- Configurar o scanner com `-Dsonar.qualitygate.wait=true` para aguardar o veredicto.
- Testar o comportamento: um código com cobertura abaixo do mínimo deve reprovar a pipeline.

**Etapa 7 — Geração de artefatos (Docker)**
- Após aprovação do Quality Gate, gerar imagem Docker do serviço.
- Apenas código que passou em todas as etapas anteriores é empacotado.

### b) Caso de estudo — Projeto Pooker

O Pooker é um monorepo com 7 microserviços (2 Java/Spring Boot, 4 Python/FastAPI, 1 Angular 20).
A implementação seguiu as etapas acima em 3 fases incrementais:

**Fase 1 — Builds e testes verdes**

O runner GitHub Actions foi instalado nativamente no Windows (em vez de Docker) para evitar
problemas de rede com serviços locais. Os YAMLs foram escritos em PowerShell porque o runner
Windows não tem Bash no PATH por padrão.

O auth-service (Spring Boot) usava PostgreSQL — inviável em CI sem banco externo. A solução foi
criar `src/test/resources/application.properties` sobrescrevendo a configuração com banco H2
em memória apenas durante os testes:

```properties
spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
spring.flyway.enabled=false
```

O Python Pipeline usa estratégia de matrix para rodar os 4 serviços FastAPI em paralelo
com um único job parametrizado:

```yaml
strategy:
  matrix:
    service: [alugueis-service, filmes-service, user-service, payment-service]
  fail-fast: false
```

**Fase 2 — SonarQube integrado**

Cada serviço recebeu um `sonar-project.properties` com chave e configuração de cobertura:

```properties
# Exemplo: api-gateway
sonar.projectKey=pooker-api-gateway
sonar.sources=src/main/java
sonar.coverage.jacoco.xmlReportPaths=build/reports/jacoco/test/jacocoTestReport.xml
```

O token SonarQube e a URL foram guardados como GitHub Secrets (`SONAR_TOKEN`, `SONAR_HOST_URL`).
Uma variável de repositório `SONAR_ENABLED=true` controla se os steps de análise executam.

O sonar-scanner não é pré-instalado no Windows, então é baixado dinamicamente na primeira execução
e cacheado em `$env:USERPROFILE\.sonar\`. Setup e execução foram combinados em um único step para
evitar problema de PATH não persistir entre steps:

```yaml
run: |
  $scannerDir = "$env:USERPROFILE\.sonar\sonar-scanner-5.0.1.3006-windows"
  if (-not (Test-Path $scannerDir)) {
    Invoke-WebRequest -Uri "https://binaries.sonarsource.com/..." -OutFile $zip
    Expand-Archive -Path $zip -DestinationPath "$env:USERPROFILE\.sonar" -Force
  }
  & "$scannerDir\bin\sonar-scanner.bat" "-Dsonar.qualitygate.wait=true"
```

**Fase 3 — Quality Gate bloqueante**

Com `-Dsonar.qualitygate.wait=true`, o pipeline aguarda o resultado do SonarQube antes de prosseguir.
Se a cobertura cair abaixo de 70% ou se bugs críticos forem introduzidos, o step falha com exit code 1
e o Docker build não acontece.

---

## 5. Demonstração Prática

### Execução de uma pipeline — passo a passo observável

1. **Gatilho**: um push para a branch `main` com alterações em `backend/auth-service/`.

2. **GitHub Actions detecta o evento**: o filtro `paths: ['backend/auth-service/**']` corresponde,
   o job `build-auth-service` é enfileirado.

3. **Runner Windows recebe o job**: faz checkout do repositório em `C:\actions-runner\_work\pooker\`.

4. **Setup Java**: `actions/setup-java@v4` instala o JDK 17 Temurin (ou restaura do cache).

5. **Build Maven sem testes**:
   ```
   .\mvnw.cmd package -DskipTests
   ```
   Verifica que o código compila sem erros de sintaxe ou dependência.

6. **Testes unitários**:
   ```
   .\mvnw.cmd test
   ```
   JUnit executa os testes. O JaCoCo registra quais linhas foram executadas.

7. **Relatório de cobertura**:
   ```
   .\mvnw.cmd jacoco:report
   ```
   Gera `target/site/jacoco/jacoco.xml` com a cobertura por classe e linha.

8. **Análise SonarQube**:
   O sonar-scanner lê o código-fonte e o relatório XML, envia para `http://localhost:9000`,
   aguarda o Quality Gate e retorna exit code 0 (passou) ou 1 (reprovou).

9. **Docker build** (apenas se Quality Gate passou):
   ```
   docker build -t pooker/auth-service:<sha> backend/auth-service/
   ```

### Simulação de falha no Quality Gate

Para demonstrar o bloqueio, basta remover um teste do auth-service e fazer push.
A cobertura cairá abaixo do threshold configurado, o SonarQube retornará status FAILED,
e o step de análise falhará com a mensagem:

```
ERROR: QUALITY GATE STATUS: FAILED
ERROR: Pipeline is failing due to quality gate failure
```

O Docker build não executará — o artefato não é gerado a partir de código que não atende
os critérios de qualidade.

---

## 6. Integração com Outras Ferramentas

### GitHub Actions ↔ SonarQube

A integração acontece via sonar-scanner CLI e dois mecanismos de autenticação:
- `SONAR_HOST_URL`: endereço do servidor SonarQube
- `SONAR_TOKEN`: token de autenticação gerado no SonarQube

Esses valores chegam ao scanner como variáveis de ambiente (`env:` no YAML), nunca hardcodados.

### GitHub Actions ↔ Docker

O runner tem acesso ao Docker Desktop instalado na máquina. Após aprovação do Quality Gate,
o step de Docker build usa o `Dockerfile` de cada serviço para gerar a imagem, tagueada
com o SHA do commit para rastreabilidade:

```
pooker/api-gateway:a3f8c21
```

### Ciclo de vida completo (SDLC)

```
Desenvolvimento local
        ↓
    git push
        ↓
GitHub Actions (CI) ──────────────────────────────────────────────┐
   ├── Build                                                        │
   ├── Testes unitários → relatório de cobertura                   │
   ├── SonarQube (análise estática + Quality Gate)                 │
   └── Docker build (apenas se Quality Gate ✓)                     │
        ↓                                                          │
 Imagem Docker pronta para deploy                                  │
        ↓                                                     Quality Gate
 Staging / Produção (próximo passo)                           bloqueia aqui
                                                               se necessário
```

### Integração futura planejada

- **Docker Hub / Registry**: publicar imagens automaticamente após Quality Gate aprovado.
- **Kubernetes / Docker Compose**: deploy automático (CD completo) após push para main.
- **Branch Protection Rules**: bloquear merge de PRs se a pipeline falhar.
- **Slack / Email notifications**: alertas quando Quality Gate reprovar.

---

## 7. Práticas e Técnicas Associadas

### Integração Contínua (CI)

A prática central implementada. Cada commit dispara a pipeline completa, garantindo que a
base de código está sempre em estado integrável. O filtro de paths evita execuções
desnecessárias — eficiência sem abrir mão da cobertura.

### Trunk-Based Development

O projeto trabalha com branches de curta duração integradas à main/develop frequentemente.
Isso reduz o risco de conflitos e mantém o histórico linear. As pipelines reforçam essa prática:
quanto mais cedo o código é integrado, menor é o custo de resolver eventuais problemas.

### Test-Driven Development (TDD) como suporte

O Quality Gate com cobertura mínima de 70% incentiva que testes sejam escritos junto com o
código, não depois. Sem testes suficientes, o código não passa pela pipeline — o que
naturalmente aproxima o time de práticas de TDD.

### Shift Left em segurança

O SonarQube analisa vulnerabilidades de segurança (OWASP, CWE) no momento do commit —
o que é chamado de "shift left": mover verificações de segurança para o início do ciclo de
desenvolvimento, quando o custo de correção é mais baixo.

### Infraestrutura como Código (IaC)

Toda a configuração da pipeline está em arquivos YAML versionados no Git:
- `.github/workflows/java-pipeline.yml`
- `.github/workflows/python-pipeline.yml`
- `.github/workflows/angular-pipeline.yml`

Isso significa que a pipeline tem histórico, pode ser revisada em PRs, pode ser revertida
e é reproduzível em qualquer fork do repositório. A infraestrutura é tratada como código,
não como configuração manual em um servidor.

### Separação de ambientes por variável de feature

A variável `SONAR_ENABLED` no repositório do GitHub permite ligar/desligar a análise de
qualidade sem alterar o código da pipeline. Isso é equivalente a um feature flag — útil
durante desenvolvimento inicial quando os testes ainda estão sendo escritos e o Quality Gate
ainda não deve bloquear.

### Caching estratégico de dependências

Cada pipeline implementa cache de dependências por hash do arquivo de lock:
- **Gradle**: hash de `*.gradle*` e `gradle-wrapper.properties`
- **Maven**: hash de `pom.xml`
- **pip**: hash de `requirements.txt`
- **npm**: hash de `package-lock.json`

Se as dependências não mudaram, o cache é restaurado em segundos em vez de baixar centenas
de megabytes novamente — reduzindo o tempo de pipeline em 40-60%.

---

*Projeto Pooker — Esteira CI/CD com GitHub Actions + SonarQube*
*Runner self-hosted Windows · 7 microserviços · Quality Gate 70% cobertura*
