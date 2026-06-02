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
