# CI/CD Setup Guide

This document covers the manual steps required to complete the CI/CD pipeline setup.

## Prerequisites

- Docker and Docker Compose installed on your machine
- GitHub repository with admin access
- Self-hosted runner machine (can be your local machine)

---

## Step 1: Start SonarQube

Start SonarQube using the provided docker-compose file:

```bash
docker compose -f docker-compose.sonar.yml up -d
```

Wait ~2 minutes for SonarQube to initialize, then access it at http://localhost:9000

Default credentials: `admin` / `admin` (you will be prompted to change on first login)

---

## Step 2: Generate SonarQube Token

1. Log in to SonarQube at http://localhost:9000
2. Go to **My Account** → **Security**
3. Under **Generate Tokens**, enter a name (e.g., `github-actions`)
4. Click **Generate**
5. Copy the token — you won't be able to see it again

---

## Step 3: Configure GitHub Secrets

In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add these two secrets:

| Secret name | Value |
|---|---|
| `SONAR_TOKEN` | The token generated in Step 2 |
| `SONAR_HOST_URL` | `http://localhost:9000` |

---

## Step 4: Register a Self-Hosted Runner

The pipelines use `runs-on: self-hosted` to access your local SonarQube instance.

### 4.1 Download and configure the runner

In your GitHub repository, go to **Settings** → **Actions** → **Runners** → **New self-hosted runner**

Select your OS and follow the displayed commands. Example for Linux:

```bash
# Create a folder for the runner
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.x.x.tar.gz -L https://github.com/actions/runner/releases/download/v2.x.x/actions-runner-linux-x64-2.x.x.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.x.x.tar.gz

# Configure the runner (use the token shown on GitHub)
./config.sh --url https://github.com/YOUR_ORG/looker --token YOUR_RUNNER_TOKEN
```

### 4.2 Start the runner

```bash
# Run interactively (for testing)
./run.sh

# Or install as a service (recommended)
sudo ./svc.sh install
sudo ./svc.sh start
```

### 4.3 Required tools on the runner machine

Make sure the following are installed:
- Java 17 (for ApiGateway and demo)
- Docker (for image builds)
- Python 3.11 (for Python services)
- Node.js 20 (for Angular frontend)
- Google Chrome (for Angular tests with ChromeHeadless)
- SonarQube Scanner CLI (`sonar-scanner`)

---

## Step 5: Verify Setup

Push a small change to `main` or `develop` and check the GitHub Actions tab. Each pipeline should:

1. Trigger on the relevant path change
2. Run on your self-hosted runner
3. Connect to SonarQube at http://localhost:9000
4. Pass the quality gate

---

## Pipelines Overview

| File | Trigger paths | Services |
|---|---|---|
| `.github/workflows/java-pipeline.yml` | `ApiGateway/**`, `demo/**` | ApiGateway (Gradle), demo (Maven) |
| `.github/workflows/python-pipeline.yml` | `*-service/**` | alugueis, filmes, user, payment |
| `.github/workflows/angular-pipeline.yml` | `frontend/looker/**` | Angular frontend |
| `Jenkinsfile` | (Jenkins SCM trigger) | All services |
