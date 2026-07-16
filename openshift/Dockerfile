# Builds the same artifact the GitLab CI job `deploy_azure` assembles
# (see .gitlab-ci.yml), just packaged as a container instead of a zip for
# Azure App Service. Zero npm dependencies at runtime — server/ only uses
# Node built-ins.
#
# Base image is Red Hat's UBI Node.js image, not the Docker Hub node:*
# image — this cluster's registry policy rejects docker.io pulls.

FROM registry.access.redhat.com/ubi9/nodejs-22:latest AS build
WORKDIR /opt/app-root/src
# COPY always sets root:root ownership unless --chown is given (regardless of
# the active USER), so the copied tree is unwritable by the image's default
# non-root user. This stage only produces build output consumed by COPY
# --from in the next stage, so running it as root is fine — the final image
# below never sets USER 0.
USER 0
COPY README.md ROADMAP.md ./
COPY glossary ./glossary
COPY site ./site
COPY phases ./phases
# Same selection as the rsync command in .gitlab-ci.yml's deploy_azure job
# (docs/en.md, quiz.json, code/main.py per phase/lesson), reimplemented in
# plain Node so the build doesn't depend on rsync being present in the image.
RUN node site/build.js && node -e " \
  const fs = require('fs'); \
  const path = require('path'); \
  const FILES = ['docs/en.md', 'quiz.json', 'code/main.py']; \
  for (const phase of fs.readdirSync('phases')) { \
    const phaseDir = path.join('phases', phase); \
    if (!fs.statSync(phaseDir).isDirectory()) continue; \
    for (const lesson of fs.readdirSync(phaseDir)) { \
      const lessonDir = path.join(phaseDir, lesson); \
      if (!fs.statSync(lessonDir).isDirectory()) continue; \
      for (const rel of FILES) { \
        const src = path.join(lessonDir, rel); \
        if (fs.existsSync(src)) { \
          const dst = path.join('site/phases', phase, lesson, rel); \
          fs.mkdirSync(path.dirname(dst), { recursive: true }); \
          fs.copyFileSync(src, dst); \
        } \
      } \
    } \
  } \
"

FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest
WORKDIR /opt/app-root/src
COPY server/server.js server/gate-core.js server/package.json ./server/
COPY --from=build /opt/app-root/src/site ./site
EXPOSE 8080
CMD ["node", "server/server.js"]
