# CI/CD para Produção — Spec

**Data:** 2026-05-10
**Repositório:** pcastilhodev/pooker
**Abordagem escolhida:** Runner containerizado + SonarQube local, incremental, portável entre máquinas

---

## Contexto

O repositório `pooker` contém 7 microserviços (2 Java/Spring Boot, 4 Python/FastAPI, 1 Angular 20) com pipelines GitHub Actions já criados mas não funcionais. O SonarQube e PostgreSQL rodam localmente via Docker Desktop. O objetivo é ter uma esteira de CI completa com build, testes unitários, análise de qualidade e quality gate bloqueante — **portável entre máquinas**: qualquer colaborador com Docker Desktop consegue replicar a infraestrutura com um único `docker compose up`.

---

## Arquitetura de Infraestrutura

Toda a infraestrutura de CI roda via `docker-compose.cicd.yml` com 3 serviços na mesma rede Docker:

```
docker-compose.cicd.yml
├── postgres        ← banco do SonarQube (postgres:15)
├── sonarqube       ← análise de qualidade (sonarqube:community, porta 9000)
└── runner          ← GitHub Actions self-hosted runner (imagem customizada)
```

O runner acessa o SonarQube via nome de serviço Docker (`http://sonarqube:9000`) — sem depender de `localhost`. Isso é o que torna a stack portável.

**Como um colega sobe a esteira:**
1. Clona o repositório
2. Gera um token de runner em `github.com/pcastilhodev/pooker → Settings → Actions → Runners → New runner`
3. Cria `.env` na raiz com `RUNNER_TOKEN=<token>`
4. Executa `docker compose -f docker-compose.cicd.yml up -d`
5. Configura SonarQube (senha admin, token, projetos — feito uma única vez)
6. Adiciona secrets no GitHub

---

## Novos Arquivos a Criar

```
pooker/
├── docker-compose.cicd.yml          ← substitui docker-compose.sonar.yml
├── .env.example                     ← documenta variáveis necessárias
└── docker/
    └── runner/
        ├── Dockerfile               ← imagem do runner com todas as ferramentas
        └── entrypoint.sh            ← registro e inicialização do runner
```

### `docker-compose.cicd.yml`

```yaml
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: sonar
      POSTGRES_PASSWORD: sonar
      POSTGRES_DB: sonar
    volumes:
      - pg_data:/var/lib/postgresql/data
    networks:
      - cicd

  sonarqube:
    image: sonarqube:community
    depends_on: [postgres]
    environment:
      SONAR_JDBC_URL: jdbc:postgresql://postgres:5432/sonar
      SONAR_JDBC_USERNAME: sonar
      SONAR_JDBC_PASSWORD: sonar
    ports:
      - "9000:9000"
    volumes:
      - sonar_data:/opt/sonarqube/data
      - sonar_logs:/opt/sonarqube/logs
    networks:
      - cicd

  runner:
    build: ./docker/runner
    environment:
      REPO_URL: https://github.com/pcastilhodev/pooker
      RUNNER_TOKEN: ${RUNNER_TOKEN}
      RUNNER_NAME: ${RUNNER_NAME:-pooker-runner}
      LABELS: self-hosted
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    depends_on:
      - sonarqube
    networks:
      - cicd

networks:
  cicd:

volumes:
  pg_data:
  sonar_data:
  sonar_logs:
```

### `docker/runner/Dockerfile`

Base Ubuntu 22.04 com todas as ferramentas necessárias pré-instaladas:

- **Git** — checkout do código
- **Java 17 (OpenJDK)** — build dos serviços Java
- **Python 3.11 + pip** — testes e lint dos serviços Python
- **Node 20 + npm** — build Angular
- **Google Chrome** — testes Angular com ChromeHeadless
- **Docker CLI** — acesso ao Docker Engine do host via socket montado
- **sonar-scanner CLI** — scan de qualidade (substitui a action Docker-based)
- **GitHub Actions runner binary** — execução dos pipelines

### `docker/runner/entrypoint.sh`

Script de inicialização que:
1. Registra o runner no repositório com o token fornecido
2. Configura trap para desregistrar ao parar o container (`docker compose down`)
3. Inicia o processo do runner

### `.env.example`

```
RUNNER_TOKEN=           # token gerado em Settings → Actions → Runners
RUNNER_NAME=pooker-runner
```

---

## Fases de Execução

### Fase 1 — Stack sobe + Build/Test funcionando

**Objetivo:** `docker compose -f docker-compose.cicd.yml up` sobe sem erro e os 3 pipelines completam build e testes.

- Criar `docker-compose.cicd.yml`, `docker/runner/Dockerfile`, `entrypoint.sh`
- Corrigir `auth-service` para usar H2 em testes (ver Correções)
- Remover `filmes-service/.env` do git
- Desabilitar passos de SonarQube e Docker via `SONAR_ENABLED=false`
- Validar Java (Gradle + Maven), Python (pytest), Angular (Karma/ChromeHeadless)

**Critério de conclusão:** 3 pipelines verdes com Sonar desabilitado.

### Fase 2 — SonarQube conectado

**Objetivo:** análise de qualidade chegando no painel do SonarQube.

- Configurar SonarQube: senha admin, token global, 7 projetos, quality gate "Pooker"
- Adicionar secrets `SONAR_TOKEN` e `SONAR_HOST_URL` no GitHub
- Mudar `SONAR_ENABLED=true`
- Validar scans em `http://localhost:9000`

**Critério de conclusão:** 7 projetos com análise no painel Sonar.

### Fase 3 — Quality Gate bloqueante

**Objetivo:** pipeline falha se qualidade estiver abaixo do threshold.

- Verificar cobertura atual dos serviços Python
- Adicionar `-Dsonar.qualitygate.wait=true` ao comando `sonar-scanner`
- Ajustar testes ou thresholds conforme necessário

**Critério de conclusão:** push com cobertura abaixo de 70% falha o pipeline.

---

## Configuração do SonarQube

### Quality gate customizado "Pooker"

Criado em `Administration → Quality Gates → Create`:
- Coverage >= 70%
- Sem bugs Blocker ou Critical
- Sem vulnerabilidades Critical ou Blocker

Associado a todos os 7 projetos.

### Projetos (7)

| Serviço | Project Key |
|---|---|
| API Gateway | `pooker-api-gateway` |
| Auth Service | `pooker-auth-service` |
| Filmes Service | `pooker-filmes-service` |
| Alugueis Service | `pooker-alugueis-service` |
| User Service | `pooker-user-service` |
| Payment Service | `pooker-payment-service` |
| Frontend | `pooker-frontend` |

### Secrets do GitHub

| Secret | Valor |
|---|---|
| `SONAR_TOKEN` | Token gerado em Administration → Security → Users |
| `SONAR_HOST_URL` | `http://sonarqube:9000` (nome do serviço Docker — não localhost) |

### Variável do Repositório

| Variável | Fase 1 | Fase 2+ |
|---|---|---|
| `SONAR_ENABLED` | `false` | `true` |

---

## Ajustes nos Pipelines

### Substituição das actions Docker do SonarQube pelo CLI

Como o runner roda em container, usar `sonarsource/sonarqube-scan-action` (que cria containers aninhados) causa problemas de rede. Em vez disso, o `sonar-scanner` CLI (já instalado na imagem do runner) é chamado diretamente como processo — acessando SonarQube via nome de serviço Docker.

Scan + quality gate combinados num único passo:

```yaml
- name: SonarQube scan + Quality Gate
  if: vars.SONAR_ENABLED == 'true'
  working-directory: <service-dir>
  run: sonar-scanner -Dsonar.qualitygate.wait=true
  env:
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

Os demais parâmetros (`sonar.projectKey`, `sonar.sources`, etc.) já estão no `sonar-project.properties` de cada serviço.

### Condição de fase (todos os pipelines)

```yaml
if: vars.SONAR_ENABLED == 'true'
```

Aplicado nos passos: SonarQube scan e Docker build.

### Chrome no runner

Chrome está instalado na imagem do runner — nenhum passo de instalação necessário nos pipelines. O `karma.conf.js` já está configurado para `ChromeHeadless`.

---

## Correções de Código Necessárias

### 1. auth-service — testes Spring Boot com H2

**Arquivo a criar:** `backend/auth-service/src/test/resources/application.properties`
(sobrescreve automaticamente o de main durante testes — sem precisar de `@ActiveProfiles`)

```properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.database-platform=org.hibernate.dialect.H2Dialect
spring.jpa.hibernate.ddl-auto=create-drop
spring.flyway.enabled=false
```

**Dependência a adicionar em `pom.xml`:**
```xml
<dependency>
    <groupId>com.h2database</groupId>
    <artifactId>h2</artifactId>
    <scope>test</scope>
</dependency>
```

### 2. filmes-service — remover .env do git

```bash
git rm --cached backend/filmes-service/.env
```

`**/.env` já está no `.gitignore` raiz.

### 3. Cobertura Python — verificação antes da Fase 3

Antes de ativar o quality gate, rodar localmente em cada serviço:
```bash
cd backend/<service>
pytest --cov=app --cov-report=term-missing
```

Criar testes mínimos ou ajustar threshold se cobertura < 70%.

---

## Fluxo Completo (estado final)

```
push main/develop
    │
    ├── java-pipeline.yml
    │   ├── Build (Gradle/Maven)
    │   ├── Test (JUnit + JaCoCo ≥ 70%)
    │   ├── sonar-scanner --qualitygate.wait  ← condicional SONAR_ENABLED
    │   └── Docker build                      ← condicional SONAR_ENABLED
    │
    ├── python-pipeline.yml (matrix × 4)
    │   ├── Install deps
    │   ├── Lint (flake8)
    │   ├── pytest --cov ≥ 70%
    │   ├── sonar-scanner --qualitygate.wait  ← condicional SONAR_ENABLED
    │   └── Docker build                      ← condicional SONAR_ENABLED
    │
    └── angular-pipeline.yml
        ├── npm ci
        ├── Lint
        ├── Karma + ChromeHeadless
        ├── sonar-scanner --qualitygate.wait  ← condicional SONAR_ENABLED
        └── npm run build --configuration production
```

---

## Fora do Escopo

- Deploy da aplicação (destino de produção não definido)
- Docker registry / push de imagens para registry remoto
- Secrets de banco de dados de produção
- Configuração de ambientes (staging, production)
- Backup/restore do volume do SonarQube
