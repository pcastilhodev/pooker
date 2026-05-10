FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Ferramentas base + Java 17 + Python 3.11
RUN apt-get update && apt-get install -y \
    curl wget git unzip jq ca-certificates gnupg lsb-release \
    openjdk-17-jdk \
    python3.11 python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Node 20 via NodeSource
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Google Chrome
RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub \
    | gpg --dearmor -o /usr/share/keyrings/google-chrome-keyring.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" \
       > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# Docker CLI (para passos de docker build no pipeline)
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
    && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
       https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
       > /etc/apt/sources.list.d/docker.list \
    && apt-get update && apt-get install -y docker-ce-cli \
    && rm -rf /var/lib/apt/lists/*

# sonar-scanner CLI 5.0.1.3006
ARG SONAR_SCANNER_VERSION=5.0.1.3006
RUN wget -q https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-${SONAR_SCANNER_VERSION}-linux.zip \
    && unzip -q sonar-scanner-cli-${SONAR_SCANNER_VERSION}-linux.zip \
    && mv sonar-scanner-${SONAR_SCANNER_VERSION}-linux /opt/sonar-scanner \
    && rm sonar-scanner-cli-${SONAR_SCANNER_VERSION}-linux.zip

ENV PATH="${PATH}:/opt/sonar-scanner/bin"

# Wrapper do Chrome com --no-sandbox (obrigatório em container Docker)
RUN printf '#!/bin/bash\nexec /usr/bin/google-chrome --no-sandbox --disable-dev-shm-usage --disable-gpu "$@"\n' \
    > /usr/local/bin/chrome-wrapper \
    && chmod +x /usr/local/bin/chrome-wrapper

ENV CHROME_BIN=/usr/local/bin/chrome-wrapper

# Usuário runner (GitHub Actions runner não pode rodar como root)
RUN useradd -m -s /bin/bash runner \
    && usermod -aG docker runner

# GitHub Actions runner binary
ARG RUNNER_VERSION=2.320.0
RUN mkdir /actions-runner \
    && cd /actions-runner \
    && curl -fLo actions-runner-linux-x64.tar.gz \
       "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" \
    && tar xzf actions-runner-linux-x64.tar.gz \
    && rm actions-runner-linux-x64.tar.gz \
    && ./bin/installdependencies.sh \
    && chown -R runner /actions-runner

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER runner
WORKDIR /actions-runner

ENTRYPOINT ["/entrypoint.sh"]
