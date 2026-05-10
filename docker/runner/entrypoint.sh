#!/bin/bash
set -e

# Registrar o runner no repositÃ³rio GitHub
./config.sh \
    --url "${REPO_URL}" \
    --token "${RUNNER_TOKEN}" \
    --name "${RUNNER_NAME:-pooker-runner}" \
    --labels "${LABELS:-self-hosted}" \
    --work "_work" \
    --unattended \
    --replace

# Desregistrar o runner ao parar o container
cleanup() {
    echo "Removendo runner do GitHub..."
    ./config.sh remove --token "${RUNNER_TOKEN}" || true
}
trap cleanup EXIT SIGTERM SIGINT

# Iniciar o runner
./run.sh
