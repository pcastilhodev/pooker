# Harness de Sensores Locais — Design

**Data:** 2026-05-31
**Origem:** `harness-setup.md` (adaptado à estrutura real do monorepo `pooker`)

## Objetivo

Conectar ferramentas de análise estática ao fluxo de desenvolvimento para que o
dev garanta qualidade **antes de entregar** (push). Os sensores locais são a
porta de qualidade do dev; o SonarQube existente (`docker-compose.sonar.yml`,
`sonar-project.properties` por serviço, CI) permanece como gate de
CI/histórico — **não é alterado**.

## Decisões (tomadas no brainstorming)

1. **Relação com Sonar:** complementar. Sensores locais = loop rápido do dev;
   Sonar = CI/histórico. Coexistem.
2. **Gate de bloqueio:** `pre-push` (bloqueia `git push`; commits locais livres).
3. **Escopo de enforcement:** repo inteiro, **strict desde o dia 1**. Assume-se
   que `git push` ficará bloqueado até o legado ser limpo.
4. **Cobertura Java:** os dois serviços — `auth-service` (Maven) e
   `api-gateway` (Gradle).
5. **Hook do Claude Code:** incluído, como feedback **não-bloqueante** ao agente
   durante a edição.
6. **SonarLint CLI:** **não** será usado. Ruff + PMD + SpotBugs + eslint-sonarjs
   replicam ~as regras do Sonar; o engine Sonar fica só no CI. Evita dependência
   de CLI instável no Windows.

## Estrutura real do repositório

```
backend/
  alugueis-service/   Python / FastAPI   (sources em app/)
  filmes-service/     Python / FastAPI
  payment-service/    Python / FastAPI
  user-service/       Python / FastAPI
  auth-service/       Java 17 / Maven (Spring Boot)
  api-gateway/        Java 17 / Gradle (Spring Cloud Gateway)
frontend/             Angular 20 / TypeScript 5.9 / ESLint 9 / @angular-eslint 20
```

- Plataforma: Windows 11. `bash` disponível em `/usr/bin/bash` (hooks rodam via bash).
- `chmod +x` é no-op no Windows — mantido por compatibilidade, sem efeito.

## Arquitetura

Dois pontos de execução, propósitos distintos:

| Ponto | Quando | Bloqueia? | Papel |
|---|---|---|---|
| Claude Code hook (`PostToolUse` Edit\|Write) | após cada edição de arquivo | ❌ não | feedback rápido ao agente |
| pre-push (framework `pre-commit`, stage `pre-push`) | no `git push` | ✅ sim | gate de qualidade antes de entregar |

**Roteamento por serviço (monorepo):** não existe `pom.xml`/`package.json` na
raiz. Cada ferramenta roda no diretório do serviço correspondente. Os comandos
Maven/Gradle/ESLint usam o diretório certo (via `working_dir`/`cd` por hook ou
detecção de path no `sensors.sh`).

## Cobertura por linguagem

| Linguagem | Serviços | Ferramentas | Verifica |
|---|---|---|---|
| Python | alugueis, filmes, payment, user | Ruff, Mypy `--strict`, Radon, Vulture | lint/smells, tipos, complexidade, dead code |
| Java/Maven | auth-service | PMD, SpotBugs, Checkstyle | smells/complexidade, bugs reais, padrão |
| Java/Gradle | api-gateway | PMD, SpotBugs, Checkstyle (plugins Gradle) | idem |
| TS/Angular | frontend | ESLint(+sonarjs), `tsc --noEmit` | smells/complexidade, tipos |

Exclusões Python: `**/alembic/**`, `**/__pycache__/**` (alinhado ao
`sonar-project.properties` existente).

## Arquivos a criar / editar

### Criar

1. **`.pre-commit-config.yaml`** (raiz)
   - Hooks no stage `pre-push`.
   - Python: `ruff`, `ruff-format`, `mypy --strict` (mirrors oficiais).
   - Java Maven (auth-service): hooks `local`/`system` → `mvn -f backend/auth-service/pom.xml pmd:check spotbugs:check checkstyle:check`.
   - Java Gradle (api-gateway): hook `local`/`system` → `./gradlew -p backend/api-gateway check` (tasks pmd/spotbugs/checkstyle).
   - TS (frontend): `eslint --max-warnings=0` e `tsc --noEmit` rodando em `frontend/`.
   - Gerais: `trailing-whitespace`, `end-of-file-fixer`, `check-merge-conflict`.
   - Instalação: `pre-commit install --hook-type pre-push`.
   - Versões dos `rev:` serão fixadas nas mais atuais no momento da implementação
     (as do doc original são de 2024 e estão defasadas).

2. **`.claude/settings.json`**
   - `PostToolUse` matcher `Edit|Write` → `bash .claude/sensors.sh`.
   - Mesclar com `.claude/settings.local.json` existente sem sobrescrevê-lo.

3. **`.claude/sensors.sh`**
   - Detecta arquivos do diff (`git diff --name-only HEAD`).
   - Roteia por extensão e por diretório de serviço.
   - Roda Ruff/Mypy/Radon/Vulture (Python), ESLint (TS), PMD/SpotBugs (Java) no
     dir correto.
   - **Não-bloqueante:** todo comando com `|| true`. Sem bloco SonarLint.
   - `set -euo pipefail` ajustado para não abortar em sensor que falha (apenas
     reporta).

4. **`CLAUDE.md`** (raiz)
   - Guia feedforward: tabela de sensores ativos + regras críticas por linguagem
     + procedimento "quando um sensor falhar".
   - Sem linha de SonarLint.

5. **`backend/requirements-dev.txt`** (ou doc de instalação)
   - `ruff`, `mypy`, `radon`, `vulture`, `pre-commit`.

### Editar

6. **`backend/auth-service/pom.xml`** — adicionar plugins ao `<build>`:
   - `maven-pmd-plugin` (ruleset quickstart, `failOnViolation`).
   - `spotbugs-maven-plugin` (`effort=Max`, `threshold=Medium`, `failOnError`).
   - `maven-checkstyle-plugin` (`google_checks.xml`, `failOnViolation`).
   - Não tocar no `jacoco` existente.

7. **`backend/api-gateway/build.gradle`** — adicionar plugins equivalentes:
   - `pmd`, `com.github.spotbugs`, `checkstyle` (plugins Gradle).
   - Configurar para falhar em violação, alinhado aos thresholds do Maven.
   - Não tocar no `jacoco` existente.

8. **`frontend/.eslintrc.json`** — **editar preservando** regras `@angular-eslint`:
   - Adicionar plugin `sonarjs` + extends `plugin:sonarjs/recommended`.
   - Adicionar `"complexity": ["error", 10]` e
     `"@typescript-eslint/no-explicit-any": "error"`.
   - Instalar `eslint-plugin-sonarjs` como devDependency.
   - **Nota de risco:** ESLint 9 + @angular-eslint 20 favorecem flat config
     (`eslint.config.js`); o repo usa `.eslintrc.json` legado. A implementação
     deve verificar qual config o `ng lint`/eslint efetivamente lê e adaptar
     (manter eslintrc em modo compat ou migrar para flat config + sonarjs flat).

## Regras críticas (entram no CLAUDE.md)

- **Python:** tipos anotados em funções públicas; complexidade ciclomática ≤ 10;
  zero dead code (confiança > 80%); mypy `--strict` limpo.
- **TypeScript/Angular:** sem `any` explícito; complexidade ≤ 10; zero warnings.
- **Java:** `google_checks.xml`; SpotBugs threshold Medium (nenhum bug
  médio/alto); PMD ruleset quickstart sem exceções.

## Fora de escopo

- Não alterar configuração do SonarQube nem CI existente.
- Não adicionar SonarLint CLI nem sonar-scanner ao gate local.
- Não migrar serviços de Maven↔Gradle.
- Limpeza do código legado para passar no gate é trabalho subsequente (não faz
  parte deste setup).

## Riscos conhecidos

1. **Gate bloqueia push no dia 1** (decisão consciente). Legado precisará ser
   limpo ou regras temporariamente afrouxadas pelo time.
2. **ESLint 9 flat vs eslintrc legado** no frontend — pode exigir migração.
3. **Ferramentas Java sem ruleset/config commitados** (checkstyle `google_checks.xml`
   é embutido no plugin; PMD quickstart idem) — validar disponibilidade na versão
   dos plugins.
4. **Performance do pre-push** com builds Maven/Gradle — pode ser lento; mitigar
   com `-o`/offline e rodar só serviços afetados se necessário.
