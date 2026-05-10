#!/bin/bash
set -e

if [ -z "${REPO_URL}" ] || [ -z "${RUNNER_TOKEN}" ]; then
    echo "ERROR: REPO_URL and RUNNER_TOKEN must be set" >&2
    exit 1
fi

cleanup() {
    echo "Removing runner from GitHub..."
    ./config.sh remove --token "${RUNNER_TOKEN}" || true
}
trap cleanup EXIT SIGTERM SIGINT

./config.sh \
    --url "${REPO_URL}" \
    --token "${RUNNER_TOKEN}" \
    --name "${RUNNER_NAME:-pooker-runner}" \
    --labels "${LABELS:-self-hosted}" \
    --work "_work" \
    --unattended \
    --replace

./run.sh
