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
