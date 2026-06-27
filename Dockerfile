FROM golang:1.26-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/usr/local/go/bin:/go/bin:${PATH}"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
      ca-certificates \
      curl \
      gcc \
      git \
      gnupg \
      libgtk-3-dev \
      libwebkit2gtk-4.0-dev \
      nsis \
      osslsigncode \
      pkg-config \
    && rm -rf /var/lib/apt/lists/*

RUN install -d -m 0755 /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_26.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

RUN node --version \
    && npm --version \
    && go install github.com/wailsapp/wails/v2/cmd/wails@v2.12.0

WORKDIR /workspace
