# CI/CD para Produção — Spec

**Data:** 2026-05-10
**Repositório:** pcastilhodev/pooker
**Abordagem escolhida:** Self-hosted runner + SonarQube local, incremental

---

## Contexto

O repositório `pooker` contém 7 microserviços (2 Java/Spring Boot, 4 Python/FastAPI, 1 Angular 20) com pipelines GitHub Actions já criados mas não funcionais. O SonarQube e PostgreSQL rodam localmente via Docker Desktop. O self-hosted runner ainda não está instalado. O objetivo é ter uma esteira de CI completa com build, testes unitários, análise de qualidade e quality gate bloqueante.

---

## Fases de Execução

### Fase 1 — Runner + Build/Test

**Objetivo:** todos os 3 pipelines completam build e testes sem erro.

- Instalar GitHub Actions runner como serviço Windows
- Registrar no repositório com label `self-hosted`
- Desabilitar temporariamente passos de SonarQube e Docker via variável `SONAR_ENABLED=false`
- Validar que Java (Gradle + Maven), Python (pytest) e Angular (Karma/ChromeHeadless) passam

**Critério de conclusão:** 3 pipelines verdes no GitHub Actions com Sonar desabilitado.

### Fase 2 — SonarQube conectado

**Objetivo:** análise de qualidade chegando no painel do SonarQube.

- Configurar SonarQube: senha admin, token global, 7 projetos, quality gate customizado
- Adicionar secrets `SONAR_TOKEN` e `SONAR_HOST_URL` no GitHub
- Mudar `SONAR_ENABLED=true` na variável do repositório
- Validar que os scans aparecem no painel `http://localhost:9000`

**Critério de conclusão:** 7 projetos com análise no SonarQube.

### Fase 3 — Quality Gate bloqueante

**Objetivo:** pipeline falha se qualidade estiver abaixo do threshold.

- Verificar cobertura atual dos serviços Python
- Adicionar passo `sonarqube-quality-gate-action` após cada scan
- Ajustar testes ou thresholds conforme necessário

**Critério de conclusão:** push com cobertura abaixo de 70% falha o pipeline.

---

## Infraestrutura

### Self-hosted Runner

- **Instalação:** nativa no Windows (não em container)
- **Modo de execução:** serviço Windows (inicia com a máquina)
- **Label:** `self-hosted` (já configurado nos YAMLs)
- **Pré-requisitos na máquina:** Git, Docker Desktop, Chrome/Chromium no PATH
- **Ferramentas gerenciadas pelas actions:** Java 17, Python 3.11, Node 20 (baixados automaticamente pelas setup-* actions)
- **Acesso ao SonarQube:** `http://localhost:9000` diretamente (runner nativo acessa localhost)

### SonarQube

- **URL:** `http://localhost:9000`
- **Stack:** `docker-compose.sonar.yml` (sonarqube:community + postgres:15)
- **Quality gate customizado "Pooker":**
  - Coverage >= 70%
  - Sem bugs Blocker ou Critical
  - Sem vulnerabilidades Critical ou Blocker
- **Projetos (7):**

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
| `SONAR_HOST_URL` | `http://localhost:9000` |

### Variável do Repositório

| Variável | Fase 1 | Fase 2+ |
|---|---|---|
| `SONAR_ENABLED` | `false` | `true` |

---

## Ajustes nos Pipelines

### Condição de fase (todos os pipelines)

Adicionar `if: vars.SONAR_ENABLED == 'true'` nos passos de SonarQube scan, quality gate e Docker build:

```yaml
- name: SonarQube scan
  if: vars.SONAR_ENABLED == 'true'
  uses: sonarsource/sonarqube-scan-action@v5
  ...

- name: Quality Gate check
  if: vars.SONAR_ENABLED == 'true'
  uses: sonarsource/sonarqube-quality-gate-action@master
  timeout-minutes: 5
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

- name: Docker build
  if: vars.SONAR_ENABLED == 'true'
  ...
```

### Chrome para Angular (`angular-pipeline.yml`)

Adicionar passo antes dos testes se Chrome não estiver instalado na máquina:

```yaml
- name: Install Chrome
  run: choco install googlechrome -y --no-progress
```

Requer Chocolatey instalado. Se Chrome já estiver no PATH, esse passo é omitido.

### Quality gate step (após cada SonarQube scan)

```yaml
- name: Quality Gate check
  if: vars.SONAR_ENABLED == 'true'
  uses: sonarsource/sonarqube-quality-gate-action@master
  timeout-minutes: 5
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
    SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
```

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

Garantir que `**/.env` está no `.gitignore` raiz (já está).

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
    │   ├── Test (JUnit + JaCoCo)
    │   ├── SonarQube scan        ← condicional SONAR_ENABLED
    │   ├── Quality Gate check    ← bloqueia se falhar
    │   └── Docker build          ← condicional SONAR_ENABLED
    │
    ├── python-pipeline.yml (matrix × 4 serviços)
    │   ├── Install deps
    │   ├── Lint (flake8)
    │   ├── Test + Coverage (pytest, min 70%)
    │   ├── SonarQube scan        ← condicional SONAR_ENABLED
    │   ├── Quality Gate check    ← bloqueia se falhar
    │   └── Docker build          ← condicional SONAR_ENABLED
    │
    └── angular-pipeline.yml
        ├── npm ci
        ├── Lint
        ├── Test (Karma + ChromeHeadless)
        ├── SonarQube scan        ← condicional SONAR_ENABLED
        ├── Quality Gate check    ← bloqueia se falhar
        └── Build produção
```

---

## Fora do Escopo

- Deploy da aplicação (destino de produção não definido)
- Docker registry (push de imagens)
- Secrets de banco de dados de produção
- Configuração de ambientes (staging, production)
