# Harness de Sensores Locais — Plano de Implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Instalar sensores de análise estática locais (Ruff, Mypy, PMD, SpotBugs, Checkstyle, ESLint+sonarjs) conectados a dois pontos de execução: hook `PostToolUse` não-bloqueante no Claude Code e gate `pre-push` bloqueante via framework `pre-commit`.

**Architecture:** Dois pontos de execução distintos. O `.claude/sensors.sh` roda após cada edição do agente — detecta arquivos alterados, roteia por extensão/serviço, reporta sem bloquear. O `.pre-commit-config.yaml` na raiz bloqueia `git push` rodando Ruff+Mypy (Python), Maven (auth-service), Gradle (api-gateway) e ESLint+tsc (frontend) nos diretórios corretos. Sem SonarLint CLI; sem tocar no SonarQube/CI existente.

**Tech Stack:** pre-commit 4.6.0, ruff-pre-commit v0.15.15, pre-commit-hooks v6.0.0, mypy 2.1.0, ruff 0.15.15, radon 6.0.1, vulture 2.16, maven-pmd-plugin 3.28.0, spotbugs-maven-plugin 4.9.3.0, maven-checkstyle-plugin 3.6.0, com.github.spotbugs Gradle plugin 6.5.5, eslint-plugin-sonarjs 4.0.3, TypeScript 5.9.

---

## Mapa de Arquivos

| Ação | Arquivo | Responsabilidade |
|---|---|---|
| Criar | `.pre-commit-config.yaml` | Gate pre-push: todos os linters/checkers |
| Criar | `.claude/settings.json` | Hook PostToolUse para sensors.sh |
| Criar | `.claude/sensors.sh` | Roteamento não-bloqueante por serviço |
| Criar | `CLAUDE.md` | Guia feedforward para o agente |
| Criar | `backend/requirements-dev.txt` | Ferramentas Python dev |
| Criar | `backend/pyproject.toml` | Config ruff+mypy para todos os serviços Python |
| Modificar | `backend/auth-service/pom.xml` | Adicionar PMD, SpotBugs, Checkstyle (preservar jacoco) |
| Modificar | `backend/api-gateway/build.gradle` | Adicionar PMD, SpotBugs, Checkstyle (preservar jacoco) |
| Modificar | `frontend/.eslintrc.json` | Adicionar sonarjs + regras de complexidade |

---

## Contexto crítico (leia antes de implementar)

- **Windows 11** — hooks rodam via `/usr/bin/bash`; `chmod +x` é no-op, mantido por compatibilidade.
- **Monorepo sem root pom.xml/package.json** — cada ferramenta roda no diretório correto.
- **`mvnw`** existe em `backend/auth-service/mvnw`; use-o no lugar de `mvn` para o pre-commit hook.
- **`gradlew`** existe em `backend/api-gateway/gradlew`.
- **ESLint 9.39.4** instalado no frontend. `@angular-eslint/builder` v20 detecta se existe `eslint.config.js` na raiz para decidir flat vs legacy. Como não existe `eslint.config.js`, ele usa o modo **legacy** e lê `.eslintrc.json`. Portanto **NÃO migre para flat config** — permaneça com `.eslintrc.json` e use `plugin:sonarjs/recommended-legacy` (não `plugin:sonarjs/recommended`).
- **Jacoco** já configurado em ambos Java services — **não tocar**.
- **SonarQube** existente (`docker-compose.sonar.yml`, `sonar-project.properties`) — **não tocar**.
- **`.claude/settings.local.json`** existe com permissões — o `settings.json` novo é um arquivo separado; o harness mescla os dois na leitura. **Não sobrescrever o `.local.json`**.

---

## Task 1: `backend/requirements-dev.txt` — ferramentas Python

**Files:**
- Criar: `backend/requirements-dev.txt`

- [ ] **Step 1: Criar o arquivo**

```text
# Ferramentas de análise estática — instalar no ambiente de dev (não no container)
ruff==0.15.15
mypy==2.1.0
radon==6.0.1
vulture==2.16
pre-commit==4.6.0
```

- [ ] **Step 2: Verificar que o arquivo foi criado corretamente**

Rode:
```bash
cat backend/requirements-dev.txt
```

Esperado: as 5 linhas acima, sem erros de encoding.

- [ ] **Step 3: Commit**

```bash
git add backend/requirements-dev.txt
git commit -m "chore: adicionar requirements-dev.txt com ferramentas de análise estática Python"
```

---

## Task 2: `backend/pyproject.toml` — config Ruff + Mypy para serviços Python

**Files:**
- Criar: `backend/pyproject.toml`

Esta config é compartilhada por todos os quatro serviços Python (`alugueis-service`, `filmes-service`, `payment-service`, `user-service`). Os hooks no `pre-commit` e o `sensors.sh` rodam a partir do diretório `backend/` usando o `pyproject.toml` como config base, passando cada `app/` como alvo.

- [ ] **Step 1: Criar o arquivo**

```toml
# backend/pyproject.toml
# Configuração compartilhada de análise estática para todos os serviços Python

[tool.ruff]
target-version = "py311"
line-length = 88

[tool.ruff.lint]
select = [
    "E",    # pycodestyle errors
    "W",    # pycodestyle warnings
    "F",    # pyflakes
    "I",    # isort
    "N",    # pep8-naming
    "UP",   # pyupgrade
    "B",    # flake8-bugbear
    "C90",  # mccabe complexity
    "S",    # flake8-bandit (security)
    "ANN",  # flake8-annotations (required type hints)
]
ignore = [
    "ANN101",  # missing-type-self (deprecated)
    "ANN102",  # missing-type-cls (deprecated)
]

[tool.ruff.lint.mccabe]
max-complexity = 10

[tool.ruff.lint.per-file-ignores]
"**/tests/**" = ["S101", "ANN"]  # allow assert and unannotated in tests
"**/alembic/**" = ["ALL"]        # ignore generated migration code

[tool.ruff.format]
quote-style = "double"
indent-style = "space"

[tool.mypy]
python_version = "3.11"
strict = true
ignore_missing_imports = true
exclude = [
    ".*alembic.*",
    ".*__pycache__.*",
]
plugins = ["pydantic.mypy"]

[tool.mypy-pydantic]
init_forbid_extra = true
init_typed = true
warn_required_dynamic_aliases = true
```

- [ ] **Step 2: Verificar sintaxe TOML**

Se `python3` disponível:
```bash
python3 -c "import tomllib; tomllib.load(open('backend/pyproject.toml', 'rb')); print('TOML OK')"
```
Se não disponível, confira manualmente que não há chaves duplicadas.

- [ ] **Step 3: Commit**

```bash
git add backend/pyproject.toml
git commit -m "chore: adicionar pyproject.toml compartilhado com config ruff e mypy strict"
```

---

## Task 3: `backend/auth-service/pom.xml` — adicionar PMD, SpotBugs, Checkstyle

**Files:**
- Modificar: `backend/auth-service/pom.xml` (adicionar dentro de `<build><plugins>` após o plugin `spring-boot-maven-plugin`)

**Atenção:** O `jacoco-maven-plugin` já está configurado com execuções `prepare-agent`, `report` e `check` — **não remova nem altere nenhuma linha do jacoco**.

- [ ] **Step 1: Adicionar os três plugins ao `<build><plugins>` do pom.xml**

O bloco a inserir deve ser adicionado logo após o `</plugin>` que fecha o `spring-boot-maven-plugin` (linha 125 do arquivo atual) e antes do `<plugin>` do jacoco. O arquivo resultante de `<build><plugins>` deve ficar:

```xml
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>

            <!-- PMD: detecção de code smells e complexidade -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-pmd-plugin</artifactId>
                <version>3.28.0</version>
                <configuration>
                    <rulesets>
                        <ruleset>/rulesets/java/quickstart.xml</ruleset>
                    </rulesets>
                    <failOnViolation>true</failOnViolation>
                    <printFailingErrors>true</printFailingErrors>
                    <excludeRoots>
                        <excludeRoot>target/generated-sources</excludeRoot>
                    </excludeRoots>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>check</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- SpotBugs: detecção de bugs reais em bytecode -->
            <plugin>
                <groupId>com.github.spotbugs</groupId>
                <artifactId>spotbugs-maven-plugin</artifactId>
                <version>4.9.3.0</version>
                <configuration>
                    <effort>Max</effort>
                    <threshold>Medium</threshold>
                    <failOnError>true</failOnError>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>check</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <!-- Checkstyle: padrão de código Google -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-checkstyle-plugin</artifactId>
                <version>3.6.0</version>
                <configuration>
                    <configLocation>google_checks.xml</configLocation>
                    <failOnViolation>true</failOnViolation>
                    <violationSeverity>warning</violationSeverity>
                    <consoleOutput>true</consoleOutput>
                    <excludes>**/generated/**</excludes>
                </configuration>
                <executions>
                    <execution>
                        <goals>
                            <goal>check</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>

            <plugin>
                <groupId>org.jacoco</groupId>
                <artifactId>jacoco-maven-plugin</artifactId>
                <!-- ... bloco jacoco existente não alterado ... -->
```

Execute a edição diretamente no arquivo. O arquivo final deve ter a estrutura com os 4 plugins em `<build><plugins>`: spring-boot, maven-pmd, spotbugs, maven-checkstyle, jacoco (nessa ordem).

- [ ] **Step 2: Verificar que jacoco ainda está intacto**

```bash
grep -n "jacoco" backend/auth-service/pom.xml
```

Esperado: linhas com `jacoco-maven-plugin`, `prepare-agent`, `report` e `check` — exatamente como antes.

- [ ] **Step 3: Verificar que os novos plugins aparecem**

```bash
grep -n "pmd\|spotbugs\|checkstyle" backend/auth-service/pom.xml
```

Esperado: linhas com `maven-pmd-plugin`, `spotbugs-maven-plugin`, `maven-checkstyle-plugin`, suas versões e goals.

- [ ] **Step 4: Validar XML sintaticamente (se mvn disponível no PATH)**

```bash
cd backend/auth-service && ./mvnw help:effective-pom -q 2>&1 | tail -5
```

Esperado: saída sem erros de parsing XML. Se Maven não disponível no ambiente de escrita do plano, valide abrindo o XML num editor com suporte a XML.

- [ ] **Step 5: Commit**

```bash
git add backend/auth-service/pom.xml
git commit -m "chore(auth-service): adicionar plugins PMD, SpotBugs e Checkstyle ao Maven"
```

---

## Task 4: `backend/api-gateway/build.gradle` — adicionar PMD, SpotBugs, Checkstyle

**Files:**
- Modificar: `backend/api-gateway/build.gradle`

**Atenção:** O bloco `jacoco { ... }`, `jacocoTestReport { ... }` e `jacocoTestCoverageVerification { ... }` devem ser **preservados exatamente como estão**.

- [ ] **Step 1: Adicionar plugins e configuração ao build.gradle**

O arquivo completo resultante deve ser:

```groovy
plugins {
	id 'java'
	id 'org.springframework.boot' version '3.5.4'
	id 'io.spring.dependency-management' version '1.1.7'
	id 'jacoco'
	id 'pmd'
	id 'checkstyle'
	id 'com.github.spotbugs' version '6.5.5'
}

group = 'looker'
version = '0.0.1-SNAPSHOT'
description = 'ApiGateway'

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

repositories {
	mavenCentral()
}

ext {
	set('springCloudVersion', "2025.0.0")
}

dependencies {
	implementation 'org.springframework.cloud:spring-cloud-starter-gateway'
	implementation 'org.springframework.cloud:spring-cloud-function-context'
	implementation 'org.springframework.cloud:spring-cloud-starter'
	implementation 'org.springframework.cloud:spring-cloud-starter-loadbalancer'
	implementation 'org.springframework.cloud:spring-cloud-starter-task'
	implementation 'io.jsonwebtoken:jjwt-api:0.11.5'
	runtimeOnly 'io.jsonwebtoken:jjwt-impl:0.11.5'
	runtimeOnly 'io.jsonwebtoken:jjwt-jackson:0.11.5'
	implementation 'org.glassfish.jaxb:jaxb-runtime:2.3.3'
	implementation 'org.springframework.boot:spring-boot-starter-security'
	implementation 'org.springframework.boot:spring-boot-starter-webflux'
	testImplementation 'org.springframework.boot:spring-boot-starter-test'
	testRuntimeOnly 'org.junit.platform:junit-platform-launcher'
}

dependencyManagement {
	imports {
		mavenBom "org.springframework.cloud:spring-cloud-dependencies:${springCloudVersion}"
	}
}

tasks.named('test') {
	useJUnitPlatform()
}

jacoco {
    toolVersion = "0.8.11"
}

jacocoTestReport {
    dependsOn test
    reports {
        xml.required = true
        html.required = true
    }
}

jacocoTestCoverageVerification {
    dependsOn jacocoTestReport
    violationRules {
        rule {
            limit {
                minimum = 0.70
            }
        }
    }
}

// --- PMD ---
pmd {
    toolVersion = '7.13.0'
    ruleSetFiles = files()
    ruleSets = ['java/quickstart']
    consoleOutput = true
    ignoreFailures = false
}

// --- Checkstyle ---
checkstyle {
    toolVersion = '10.23.1'
    configFile = resources.text.fromUri(
        'https://raw.githubusercontent.com/checkstyle/checkstyle/checkstyle-10.23.1/src/main/resources/google_checks.xml'
    ).asFile()
    ignoreFailures = false
    maxWarnings = 0
}

// --- SpotBugs ---
spotbugs {
    toolVersion = '4.9.3'
    effort = 'max'
    reportLevel = 'medium'
    ignoreFailures = false
}

spotbugsMain {
    reports {
        html {
            required = true
            outputLocation = layout.buildDirectory.file('reports/spotbugs/main.html')
        }
    }
}

// Encadear análise estática no check
check.dependsOn pmdMain, checkstyleMain, spotbugsMain
```

- [ ] **Step 2: Verificar que jacoco ainda está intacto**

```bash
grep -n "jacoco\|jacocoTest" backend/api-gateway/build.gradle
```

Esperado: linhas com `jacoco`, `jacocoTestReport`, `jacocoTestCoverageVerification`, `toolVersion = "0.8.11"`, `minimum = 0.70` — exatamente como antes.

- [ ] **Step 3: Verificar novos plugins**

```bash
grep -n "pmd\|spotbugs\|checkstyle" backend/api-gateway/build.gradle
```

Esperado: os três plugins declarados, com versões e config.

- [ ] **Step 4: Commit**

```bash
git add backend/api-gateway/build.gradle
git commit -m "chore(api-gateway): adicionar plugins PMD, SpotBugs e Checkstyle ao Gradle"
```

---

## Task 5: `frontend/.eslintrc.json` — adicionar sonarjs + regras de qualidade

**Files:**
- Modificar: `frontend/.eslintrc.json`

**Contexto crítico sobre ESLint 9 + @angular-eslint 20:**
- ESLint 9.39.4 usa flat config (`eslint.config.js`) por padrão ao rodar via CLI.
- **Porém**, `ng lint` usa `@angular-eslint/builder`, que detecta a ausência de `eslint.config.js` na raiz `frontend/` e chama a API `LegacyESLint` (modo `eslintrc`). O `.eslintrc.json` **é lido pelo `ng lint`**.
- `eslint-plugin-sonarjs` v4 em modo **legacy** requer `plugin:sonarjs/recommended-legacy` (não `plugin:sonarjs/recommended` que é apenas para flat config).
- **NÃO crie `eslint.config.js`** — isso quebraria o `ng lint` ao forçar o modo flat sem migrar as configs `@angular-eslint`.

- [ ] **Step 1: Instalar eslint-plugin-sonarjs**

```bash
cd frontend && npm install --save-dev eslint-plugin-sonarjs@4.0.3
```

Esperado: `"eslint-plugin-sonarjs": "^4.0.3"` adicionado em `devDependencies` do `frontend/package.json`.

- [ ] **Step 2: Verificar que o pacote foi instalado**

```bash
ls frontend/node_modules/eslint-plugin-sonarjs/package.json
```

Esperado: arquivo existe.

- [ ] **Step 3: Editar `frontend/.eslintrc.json`**

O arquivo completo resultante deve ser:

```json
{
  "root": true,
  "ignorePatterns": ["projects/**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:@angular-eslint/recommended",
        "plugin:@angular-eslint/template/process-inline-templates",
        "plugin:sonarjs/recommended-legacy"
      ],
      "plugins": ["sonarjs"],
      "rules": {
        "@angular-eslint/directive-selector": [
          "error",
          { "type": "attribute", "prefix": "app", "style": "camelCase" }
        ],
        "@angular-eslint/component-selector": [
          "error",
          { "type": "element", "prefix": "app", "style": "kebab-case" }
        ],
        "complexity": ["error", 10],
        "@typescript-eslint/no-explicit-any": "error"
      }
    },
    {
      "files": ["*.html"],
      "extends": [
        "plugin:@angular-eslint/template/recommended",
        "plugin:@angular-eslint/template/accessibility"
      ],
      "rules": {}
    }
  ]
}
```

- [ ] **Step 4: Verificar que `ng lint` roda (pode falhar em violações — isso é esperado)**

```bash
cd frontend && npx ng lint --max-warnings=0 2>&1 | head -30
```

Esperado: o linter executa sem erro de "config not found" ou "plugin not found". Violações de código são esperadas (o legado ainda não foi limpo) — o importante é que a saída seja de um linter ativo, não de um erro de configuração. Exemplo de saída aceitável:
```
Linting "looker"...
...
✖ X problems (Y errors, Z warnings)
```

Se a saída for `ESLint couldn't find an eslint.config file` ou `Cannot find plugin "sonarjs"`, há problema de configuração — revisar.

- [ ] **Step 5: Commit**

```bash
git add frontend/.eslintrc.json frontend/package.json frontend/package-lock.json
git commit -m "chore(frontend): adicionar eslint-plugin-sonarjs e regras de complexidade ao ESLint"
```

---

## Task 6: `.pre-commit-config.yaml` — gate pre-push

**Files:**
- Criar: `.pre-commit-config.yaml` (raiz do repositório)

**Versões escolhidas (pinadas às últimas estáveis em 2026-05-31):**
- `ruff-pre-commit`: `v0.15.15`
- `pre-commit-hooks`: `v6.0.0`
- `mirrors-mypy`: usa `additional_dependencies` direto — não há mirror oficial atual; usa `repo: local` com `mypy==2.1.0`

**Nota sobre hooks `local`/`system` para Java e frontend:**
Pre-commit não gerencia ambientes Maven/Gradle/Node. Usa-se `repo: local` com `language: system` para invocar as ferramentas já instaladas no host. Em CI, garantir que Java, Maven wrapper, Gradle wrapper e Node estejam disponíveis no PATH.

**Nota sobre `./gradlew` no Windows:**
O gradlew é um script shell. Em Windows com bash disponível em `/usr/bin/bash`, o pre-commit com `language: system` chama o comando diretamente; o wrapper `.bat` pode ser necessário em contextos pure-Windows. O hook usa `./gradlew` via bash — funciona se o `pre-push` for disparado por bash (Git Bash/WSL). Se necessário, substituir por `gradlew.bat` para ambientes CMD puros.

- [ ] **Step 1: Criar o arquivo**

```yaml
# .pre-commit-config.yaml
# Gate de qualidade pré-push. Instalar com:
#   pre-commit install --hook-type pre-push
#
# Para rodar manualmente: pre-commit run --all-files --hook-stage pre-push

default_stages: [pre-push]

repos:
  # ----------------------------------------------------------------
  # Utilidades gerais
  # ----------------------------------------------------------------
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v6.0.0
    hooks:
      - id: trailing-whitespace
        stages: [pre-push]
      - id: end-of-file-fixer
        stages: [pre-push]
      - id: check-merge-conflict
        stages: [pre-push]

  # ----------------------------------------------------------------
  # Python — Ruff (linter + formatter)
  # ----------------------------------------------------------------
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.15.15
    hooks:
      - id: ruff
        name: ruff lint (Python services)
        args:
          - --config=backend/pyproject.toml
          - --no-fix
        files: ^backend/(alugueis|filmes|payment|user)-service/.*\.py$
        exclude: (alembic|__pycache__)
        stages: [pre-push]
      - id: ruff-format
        name: ruff format check (Python services)
        args:
          - --config=backend/pyproject.toml
          - --check
        files: ^backend/(alugueis|filmes|payment|user)-service/.*\.py$
        exclude: (alembic|__pycache__)
        stages: [pre-push]

  # ----------------------------------------------------------------
  # Python — Mypy (tipo estrito)
  # ----------------------------------------------------------------
  - repo: local
    hooks:
      - id: mypy-alugueis
        name: mypy --strict (alugueis-service)
        language: system
        entry: bash -c 'cd backend/alugueis-service && mypy --strict --config-file ../pyproject.toml app/'
        files: ^backend/alugueis-service/.*\.py$
        exclude: alembic
        pass_filenames: false
        stages: [pre-push]
      - id: mypy-filmes
        name: mypy --strict (filmes-service)
        language: system
        entry: bash -c 'cd backend/filmes-service && mypy --strict --config-file ../pyproject.toml app/'
        files: ^backend/filmes-service/.*\.py$
        exclude: alembic
        pass_filenames: false
        stages: [pre-push]
      - id: mypy-payment
        name: mypy --strict (payment-service)
        language: system
        entry: bash -c 'cd backend/payment-service && mypy --strict --config-file ../pyproject.toml app/'
        files: ^backend/payment-service/.*\.py$
        exclude: alembic
        pass_filenames: false
        stages: [pre-push]
      - id: mypy-user
        name: mypy --strict (user-service)
        language: system
        entry: bash -c 'cd backend/user-service && mypy --strict --config-file ../pyproject.toml app/'
        files: ^backend/user-service/.*\.py$
        exclude: alembic
        pass_filenames: false
        stages: [pre-push]

  # ----------------------------------------------------------------
  # Java / Maven — auth-service (PMD + SpotBugs + Checkstyle)
  # ----------------------------------------------------------------
  - repo: local
    hooks:
      - id: maven-auth-service
        name: Maven PMD+SpotBugs+Checkstyle (auth-service)
        language: system
        entry: bash -c 'cd backend/auth-service && ./mvnw pmd:check spotbugs:check checkstyle:check -q --no-transfer-progress'
        files: ^backend/auth-service/.*\.(java|xml)$
        pass_filenames: false
        stages: [pre-push]

  # ----------------------------------------------------------------
  # Java / Gradle — api-gateway (PMD + SpotBugs + Checkstyle)
  # ----------------------------------------------------------------
  - repo: local
    hooks:
      - id: gradle-api-gateway
        name: Gradle check (api-gateway)
        language: system
        entry: bash -c 'cd backend/api-gateway && ./gradlew pmdMain checkstyleMain spotbugsMain --no-daemon -q'
        files: ^backend/api-gateway/.*\.(java|gradle)$
        pass_filenames: false
        stages: [pre-push]

  # ----------------------------------------------------------------
  # TypeScript / Angular — ESLint + tsc
  # ----------------------------------------------------------------
  - repo: local
    hooks:
      - id: eslint-frontend
        name: ESLint --max-warnings=0 (frontend)
        language: system
        entry: bash -c 'cd frontend && npx ng lint -- --max-warnings=0'
        files: ^frontend/src/.*\.(ts|html)$
        pass_filenames: false
        stages: [pre-push]
      - id: tsc-frontend
        name: tsc --noEmit (frontend)
        language: system
        entry: bash -c 'cd frontend && npx tsc --noEmit -p tsconfig.app.json'
        files: ^frontend/src/.*\.ts$
        pass_filenames: false
        stages: [pre-push]
```

- [ ] **Step 2: Instalar o framework pre-commit (se ainda não instalado)**

```bash
pip install pre-commit==4.6.0
# ou, se usando o requirements-dev.txt recém-criado:
pip install -r backend/requirements-dev.txt
```

Esperado:
```
Successfully installed pre-commit-4.6.0
```

- [ ] **Step 3: Registrar o hook pre-push no repositório git**

```bash
pre-commit install --hook-type pre-push
```

Esperado:
```
pre-commit installed at .git/hooks/pre-push
```

- [ ] **Step 4: Verificar que o hook pre-push foi instalado**

```bash
cat .git/hooks/pre-push | head -5
```

Esperado: shebang `#!/usr/bin/env bash` e referência ao pre-commit — confirma que o arquivo existe.

- [ ] **Step 5: Testar disparo do hook com `--all-files` (execução a seco)**

```bash
pre-commit run trailing-whitespace --all-files --hook-stage pre-push
```

Esperado: `trailing-whitespace.....Passed` (ou lista de arquivos modificados, mas sem erro de "hook not found").

- [ ] **Step 6: Commit**

```bash
git add .pre-commit-config.yaml
git commit -m "chore: adicionar .pre-commit-config.yaml com gate pre-push para Python, Java e frontend"
```

---

## Task 7: `.claude/settings.json` — hook PostToolUse

**Files:**
- Criar: `.claude/settings.json`

**Importante:** Este arquivo é lido junto com o `.claude/settings.local.json` existente. O harness do Claude Code mescla os dois. Não há conflito: `settings.local.json` tem apenas `permissions.allow`; `settings.json` terá apenas `hooks`. Se o `settings.json` já existir no momento da implementação, verifique o conteúdo e **mescle** em vez de sobrescrever.

- [ ] **Step 1: Verificar que `.claude/settings.json` não existe ainda**

```bash
ls .claude/settings.json 2>/dev/null && echo "EXISTS — leia antes de editar" || echo "NOT EXISTS — criar"
```

- [ ] **Step 2: Criar `.claude/settings.json`**

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/sensors.sh"
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Verificar que o JSON é válido**

```bash
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json','utf8')); console.log('JSON OK')"
```

Esperado: `JSON OK`.

- [ ] **Step 4: Confirmar que `settings.local.json` não foi alterado**

```bash
cat .claude/settings.local.json
```

Esperado: conteúdo idêntico ao original (com `"permissions": { "allow": [...] }`).

- [ ] **Step 5: Commit**

```bash
git add .claude/settings.json
git commit -m "chore: adicionar .claude/settings.json com hook PostToolUse para sensors.sh"
```

---

## Task 8: `.claude/sensors.sh` — roteamento não-bloqueante

**Files:**
- Criar: `.claude/sensors.sh`

O script detecta arquivos alterados desde o último commit, identifica a qual serviço pertencem e roda os sensores correspondentes. Todo comando usa `|| true` para ser **não-bloqueante**. Sem SonarLint CLI.

- [ ] **Step 1: Criar `.claude/sensors.sh`**

```bash
#!/usr/bin/env bash
# .claude/sensors.sh
# Sensor de análise estática não-bloqueante para o Claude Code.
# Disparado via PostToolUse (Edit|Write). Nunca bloqueia o agente.
# Cada sensor reporta no stdout/stderr; falhas são informativas apenas.

set -uo pipefail

# Arquivos modificados desde o último commit (staged + unstaged)
CHANGED=$(git diff --name-only HEAD 2>/dev/null || true)

if [ -z "$CHANGED" ]; then
  exit 0
fi

echo "=== Sensores locais (não-bloqueantes) ==="

# ----------------------------------------------------------------
# Função auxiliar: roda um comando e reporta resultado
# ----------------------------------------------------------------
run_sensor() {
  local name="$1"
  shift
  echo "--- $name ---"
  "$@" || true
}

# ----------------------------------------------------------------
# Python — detecta qual(is) serviço(s) foram alterados
# ----------------------------------------------------------------
PYTHON_SERVICES=(alugueis-service filmes-service payment-service user-service)

for SERVICE in "${PYTHON_SERVICES[@]}"; do
  PY_FILES=$(echo "$CHANGED" | grep "^backend/${SERVICE}/.*\.py$" | grep -v "alembic\|__pycache__" || true)
  if [ -n "$PY_FILES" ]; then
    echo ""
    echo ">>> Python: $SERVICE"
    # Ruff lint
    run_sensor "ruff lint" \
      bash -c "cd backend/${SERVICE} && ruff check --config ../pyproject.toml app/ 2>&1"
    # Ruff format check
    run_sensor "ruff format" \
      bash -c "cd backend/${SERVICE} && ruff format --check --config ../pyproject.toml app/ 2>&1"
    # Mypy strict
    run_sensor "mypy --strict" \
      bash -c "cd backend/${SERVICE} && mypy --strict --config-file ../pyproject.toml app/ 2>&1"
    # Radon (complexidade ciclomática)
    run_sensor "radon cc (complexity)" \
      bash -c "cd backend/${SERVICE} && radon cc app/ -s -n C 2>&1"
    # Vulture (dead code, confiança > 80%)
    run_sensor "vulture (dead code)" \
      bash -c "cd backend/${SERVICE} && vulture app/ --min-confidence 80 2>&1"
  fi
done

# ----------------------------------------------------------------
# Java / Maven — auth-service
# ----------------------------------------------------------------
JAVA_MAVEN_FILES=$(echo "$CHANGED" | grep "^backend/auth-service/.*\.java$" || true)
if [ -n "$JAVA_MAVEN_FILES" ]; then
  echo ""
  echo ">>> Java/Maven: auth-service"
  run_sensor "Maven PMD" \
    bash -c "cd backend/auth-service && ./mvnw pmd:check -q --no-transfer-progress 2>&1"
  run_sensor "Maven SpotBugs" \
    bash -c "cd backend/auth-service && ./mvnw spotbugs:check -q --no-transfer-progress 2>&1"
  run_sensor "Maven Checkstyle" \
    bash -c "cd backend/auth-service && ./mvnw checkstyle:check -q --no-transfer-progress 2>&1"
fi

# ----------------------------------------------------------------
# Java / Gradle — api-gateway
# ----------------------------------------------------------------
JAVA_GRADLE_FILES=$(echo "$CHANGED" | grep "^backend/api-gateway/.*\.java$" || true)
if [ -n "$JAVA_GRADLE_FILES" ]; then
  echo ""
  echo ">>> Java/Gradle: api-gateway"
  run_sensor "Gradle PMD" \
    bash -c "cd backend/api-gateway && ./gradlew pmdMain --no-daemon -q 2>&1"
  run_sensor "Gradle SpotBugs" \
    bash -c "cd backend/api-gateway && ./gradlew spotbugsMain --no-daemon -q 2>&1"
  run_sensor "Gradle Checkstyle" \
    bash -c "cd backend/api-gateway && ./gradlew checkstyleMain --no-daemon -q 2>&1"
fi

# ----------------------------------------------------------------
# TypeScript / Angular — frontend
# ----------------------------------------------------------------
TS_FILES=$(echo "$CHANGED" | grep "^frontend/src/.*\.\(ts\|html\)$" || true)
if [ -n "$TS_FILES" ]; then
  echo ""
  echo ">>> TypeScript/Angular: frontend"
  run_sensor "ESLint" \
    bash -c "cd frontend && npx ng lint 2>&1"
  run_sensor "tsc --noEmit" \
    bash -c "cd frontend && npx tsc --noEmit -p tsconfig.app.json 2>&1"
fi

echo ""
echo "=== Sensores concluídos ==="
exit 0
```

- [ ] **Step 2: Tornar executável (no-op no Windows, mas necessário para compatibilidade)**

```bash
chmod +x .claude/sensors.sh
```

- [ ] **Step 3: Testar o script manualmente com um arquivo Python modificado**

Crie um arquivo temporário modificado para simular:
```bash
# Faça uma edição qualquer num arquivo Python e depois:
bash .claude/sensors.sh
```

Esperado: o script executa sem abortar (mesmo que os sensores reportem problemas). A saída deve conter `=== Sensores locais (não-bloqueantes) ===` e `=== Sensores concluídos ===`.

- [ ] **Step 4: Testar com nenhum arquivo alterado**

```bash
# Em um estado com zero alterações (após um commit limpo):
git stash && bash .claude/sensors.sh; git stash pop
```

Esperado: o script sai silenciosamente (sem a mensagem do cabeçalho) — o `exit 0` após `CHANGED` vazio.

- [ ] **Step 5: Commit**

```bash
git add .claude/sensors.sh
git commit -m "chore: adicionar sensors.sh com roteamento não-bloqueante por serviço"
```

---

## Task 9: `CLAUDE.md` — guia feedforward para o agente

**Files:**
- Criar: `CLAUDE.md` (raiz do repositório)

- [ ] **Step 1: Criar `CLAUDE.md`**

Crie o arquivo `CLAUDE.md` na raiz do repositório com o conteúdo exato abaixo. O arquivo contém markdown com seções, tabelas e blocos de código bash — use a ferramenta Write com o conteúdo literal a seguir (os blocos de código bash dentro do arquivo são parte do conteúdo do CLAUDE.md, não comandos a executar):

Conteúdo do arquivo `CLAUDE.md`:

    # CLAUDE.md — Guia de Qualidade Local (pooker)

    Este arquivo guia o agente Claude Code sobre as ferramentas de análise
    estática ativas neste repositório e o que fazer quando elas reportam problemas.

    ---

    ## Sensores ativos

    | Linguagem | Serviço | Ferramenta | Quando roda | Bloqueia? |
    |---|---|---|---|---|
    | Python | alugueis-service | Ruff lint + format | PostToolUse (Edit/Write) | Não |
    | Python | filmes-service | Ruff lint + format | PostToolUse (Edit/Write) | Não |
    | Python | payment-service | Ruff lint + format | PostToolUse (Edit/Write) | Não |
    | Python | user-service | Ruff lint + format | PostToolUse (Edit/Write) | Não |
    | Python | todos acima | Mypy --strict | PostToolUse (Edit/Write) | Não |
    | Python | todos acima | Radon cc (complexidade) | PostToolUse (Edit/Write) | Não |
    | Python | todos acima | Vulture (dead code) | PostToolUse (Edit/Write) | Não |
    | Java/Maven | auth-service | PMD + SpotBugs + Checkstyle | PostToolUse + pre-push | Não (sensor) / Sim (push) |
    | Java/Gradle | api-gateway | PMD + SpotBugs + Checkstyle | PostToolUse + pre-push | Não (sensor) / Sim (push) |
    | TypeScript | frontend | ESLint (sonarjs) + tsc | PostToolUse + pre-push | Não (sensor) / Sim (push) |

    O sensor (PostToolUse) roda após cada Edit ou Write do agente e **nunca
    bloqueia** — apenas reporta. O gate `pre-push` **bloqueia** `git push` se
    houver violações.

    ---

    ## Regras críticas por linguagem

    ### Python
    - Funções e métodos **públicos** devem ter anotações de tipo completas.
    - Complexidade ciclomática máxima: **10** por função (Radon + Ruff C90).
    - Zero dead code com confiança > 80% (Vulture).
    - `mypy --strict` deve passar sem erros.
    - Excluídos: `**/alembic/**`, `**/__pycache__/**`.

    ### TypeScript / Angular
    - **Zero** uso de `any` explícito (`@typescript-eslint/no-explicit-any: error`).
    - Complexidade ciclomática máxima: **10** (`complexity: ["error", 10]`).
    - Zero warnings no ESLint (`--max-warnings=0`).
    - `tsc --noEmit` deve passar sem erros de tipo.

    ### Java
    - Checkstyle com `google_checks.xml` — zero violações de nível warning ou superior.
    - SpotBugs threshold **Medium** — nenhum bug de severidade média ou alta.
    - PMD ruleset `quickstart` — zero violações.

    ---

    ## Quando um sensor falhar

    1. **Leia a mensagem de erro** — o sensor identifica arquivo, linha e regra violada.
    2. **Corrija no arquivo apontado** — não suprima regras sem justificativa explícita.
    3. **Para suprimir pontualmente** (apenas quando justificado):
       - Python/Ruff: `# noqa: CÓDIGO` na linha, com comentário explicando o motivo.
       - Python/Mypy: `# type: ignore[código]` na linha, com comentário.
       - TypeScript/ESLint: `// eslint-disable-next-line regra -- motivo`
       - Java/PMD: `@SuppressWarnings("PMD.NomeRegra")` no método, com comentário.
       - Java/SpotBugs: `@SuppressFBWarnings(value="CÓDIGO", justification="motivo")`
       - Java/Checkstyle: `// CHECKSTYLE:OFF NomeRegra` / `// CHECKSTYLE:ON`
    4. **Nunca** suprima erros de tipo do Mypy ou `@typescript-eslint/no-explicit-any`
       apenas para fazer o build passar.

    ---

    ## Fora de escopo deste harness

    - SonarQube (CI/histórico) — não alterar `docker-compose.sonar.yml` nem `sonar-project.properties`.
    - SonarLint CLI — não instalado, não usar.
    - Cobertura de testes — gerenciada pelo Jacoco (Java) e pytest-cov (Python) separadamente.

    ---

    ## Instalação inicial (uma vez por máquina)

    Execute na raiz do repositório:

        pip install -r backend/requirements-dev.txt
        pre-commit install --hook-type pre-push

- [ ] **Step 2: Verificar que o arquivo foi criado**

```bash
ls CLAUDE.md
```

Esperado: arquivo existe.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: adicionar CLAUDE.md com guia feedforward de sensores e regras de qualidade"
```

---

## Verificação Final — smoke test completo

Após todas as tasks anteriores, execute esta bateria para confirmar que o harness está funcionando end-to-end.

- [ ] **Smoke test 1: Hook sensors.sh é disparado pelo Claude Code**

Edite qualquer arquivo Python (ex: adicione um comentário a `backend/alugueis-service/app/main.py`) usando a ferramenta `Edit` do Claude Code. O hook `PostToolUse` deve disparar `bash .claude/sensors.sh` automaticamente e exibir a saída dos sensores no terminal. Se não disparar, verifique `.claude/settings.json`.

- [ ] **Smoke test 2: Pre-push hook intercepta `git push`**

```bash
git push --dry-run origin develop 2>&1 | head -10
```

Esperado: saída indicando que os hooks pre-push estão sendo executados (você verá as saídas dos linters antes da mensagem "Everything up-to-date" ou similar).

Se `--dry-run` não disparar hooks, teste com:
```bash
pre-commit run --all-files --hook-stage pre-push 2>&1 | head -30
```

Esperado: lista de hooks executando (alguns podem falhar devido ao legado — isso é esperado conforme decisão do spec).

- [ ] **Smoke test 3: Confirmar que SonarQube não foi alterado**

```bash
git log --oneline -- docker-compose.sonar.yml backend/alugueis-service/sonar-project.properties backend/filmes-service/sonar-project.properties backend/payment-service/sonar-project.properties backend/user-service/sonar-project.properties backend/auth-service/sonar-project.properties backend/api-gateway/sonar-project.properties
```

Esperado: nenhum commit listado — esses arquivos não foram tocados por nenhum commit deste plano.

- [ ] **Smoke test 4: Confirmar que jacoco não foi alterado**

```bash
# Pega o hash do commit anterior ao início deste plano (o primeiro commit que não era deste plano)
BEFORE=$(git log --oneline | grep -v "chore\|docs" | head -1 | awk '{print $1}')
git show ${BEFORE}:backend/auth-service/pom.xml | grep -c "jacoco" || true
git show HEAD:backend/auth-service/pom.xml | grep -c "jacoco"
```

Esperado: o mesmo número de ocorrências em ambos — jacoco intacto.

```bash
git show ${BEFORE}:backend/api-gateway/build.gradle | grep -c "jacoco" || true
git show HEAD:backend/api-gateway/build.gradle | grep -c "jacoco"
```

Esperado: idem. Alternativamente, um grep direto é suficiente:

```bash
grep -c "jacoco" backend/auth-service/pom.xml
# Esperado: 6 (prepare-agent, report, check, jacoco-maven-plugin, duas ocorrências de "jacoco" em ids)
grep -c "jacoco" backend/api-gateway/build.gradle
# Esperado: 4 (jacoco plugin id, jacoco{}, jacocoTestReport, jacocoTestCoverageVerification)
```

---

## Riscos conhecidos (do spec) — lembrete para o implementador

1. **Gate bloqueia push no dia 1.** O código legado provavelmente tem violações. A decisão de manter strict desde o início é consciente — o time precisará limpar o legado ou temporariamente afrouxar thresholds (ex: `ignoreFailures = true` no Gradle, `failOnViolation = false` no Maven) como medida transitória, revertendo em seguida.

2. **ESLint 9 flat vs eslintrc.** O `ng lint` lê `.eslintrc.json` enquanto não existir `eslint.config.js` na raiz `frontend/`. Se em algum momento o time criar `eslint.config.js` (ex: via `ng generate`), o comportamento mudará e as configs `@angular-eslint` precisarão ser migradas para flat config. **Não crie `eslint.config.js` como parte deste setup.**

3. **Performance do pre-push.** Maven e Gradle builds podem ser lentos na primeira execução (download de deps). Mitigações: cache do Maven (`~/.m2`) e Gradle (`~/.gradle`) já são usados por default. A flag `--no-daemon` no Gradle evita problemas com daemons zumbis.

4. **`google_checks.xml` via URL no Gradle.** O `configFile` no Checkstyle do Gradle aponta para a URL do arquivo no GitHub. Em ambientes sem internet (CI offline), substituir por uma cópia local: baixe o arquivo e aponte para `file("config/checkstyle/google_checks.xml")`.

5. **SpotBugs requer bytecode compilado.** O goal `spotbugsMain` exige que `compileJava` tenha rodado. O `check.dependsOn` garante a ordem correta. Se rodar `spotbugsMain` isoladamente, pode ser necessário rodar `./gradlew compileJava spotbugsMain`.
