# Builds the same artifact the GitLab CI job `deploy_azure` assembles
# (see .gitlab-ci.yml), just packaged as a container instead of a zip for
# Azure App Service. Zero npm dependencies at runtime — server/ only uses
# Node built-ins.

FROM node:22-alpine AS build
RUN apk add --no-cache rsync
WORKDIR /repo
COPY README.md ROADMAP.md ./
COPY glossary ./glossary
COPY site ./site
COPY phases ./phases
RUN node site/build.js \
 && mkdir -p site/phases \
 && rsync -a --prune-empty-dirs \
      --include='*/' \
      --include='docs/en.md' \
      --include='quiz.json' \
      --include='code/main.py' \
      --exclude='*' \
      phases/ site/phases/

FROM node:22-alpine
WORKDIR /app
COPY server/server.js server/gate-core.js server/package.json ./server/
COPY --from=build /repo/site ./site
EXPOSE 8080
USER node
CMD ["node", "server/server.js"]
