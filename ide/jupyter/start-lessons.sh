#!/bin/bash
# Seed the user's home with the lessons on first start. The home dir is a fresh
# per-user volume, so we copy from the image's /opt/lessons if not already there.
set -e
if [ ! -d "$HOME/lessons" ]; then
  cp -r /opt/lessons "$HOME/lessons"
fi
exec "$@"
