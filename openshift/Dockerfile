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
# Same selection as serve.sh's rsync staging (docs/en.md, docs/de.md,
# quiz.json, code/main.py, outputs/*, assets/ per phase/lesson) — the equivalent .gitlab-ci.yml
# deploy_azure job this used to mirror was removed when Azure was
# decommissioned (see CLAUDE.md §1), so serve.sh is now the only other
# copy of this selection; keep the two in sync. Reimplemented in plain Node
# here so the build doesn't depend on rsync being present in the image.
# assets/ (lesson SVGs referenced by markdown ![]() images, resolved at
# request time by resolveLessonAssetSrc() in lesson.html) is a whole
# directory per lesson rather than a fixed filename, so it's copied with
# fs.cpSync's recursive mode instead of being added to FILES — that also
# covers assets/ ever gaining subdirectories later (flat today: 298
# lesson-assets dirs, 298 .svg files, ~2.1MB total across the repo).
RUN node site/build.js && node -e " \
  const fs = require('fs'); \
  const path = require('path'); \
  const FILES = ['docs/en.md', 'docs/de.md', 'quiz.json', 'code/main.py']; \
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
      const outputsSrc = path.join(lessonDir, 'outputs'); \
      if (fs.existsSync(outputsSrc) && fs.statSync(outputsSrc).isDirectory()) { \
        for (const outputName of fs.readdirSync(outputsSrc)) { \
          const outputSrc = path.join(outputsSrc, outputName); \
          if (!fs.statSync(outputSrc).isFile()) continue; \
          const outputDst = path.join('site/phases', phase, lesson, 'outputs', outputName); \
          fs.mkdirSync(path.dirname(outputDst), { recursive: true }); \
          fs.copyFileSync(outputSrc, outputDst); \
        } \
      } \
      const assetsSrc = path.join(lessonDir, 'assets'); \
      if (fs.existsSync(assetsSrc) && fs.statSync(assetsSrc).isDirectory()) { \
        fs.cpSync(assetsSrc, path.join('site/phases', phase, lesson, 'assets'), { recursive: true }); \
      } \
    } \
  } \
"

FROM registry.access.redhat.com/ubi9/nodejs-22-minimal:latest
WORKDIR /opt/app-root/src
COPY server/*.js server/package.json ./server/
COPY --from=build /opt/app-root/src/site ./site
COPY --from=build /opt/app-root/src/glossary ./glossary
COPY --from=build /opt/app-root/src/phases ./phases
COPY --from=build /opt/app-root/src/README.md /opt/app-root/src/ROADMAP.md ./
EXPOSE 8080
CMD ["node", "server/server.js"]
