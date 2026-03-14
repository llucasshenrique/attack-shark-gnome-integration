#!/bin/sh
set -eu

if command -v nfpm >/dev/null 2>&1; then
  exec nfpm "$@"
fi

if command -v docker >/dev/null 2>&1; then
  MOUNT_SPEC="$PWD:/work"
  if [ -e /sys/fs/selinux/enforce ]; then
    MOUNT_SPEC="$PWD:/work:Z"
  fi

  exec docker run --rm \
    -u "$(id -u):$(id -g)" \
    -v "$MOUNT_SPEC" \
    -w /work \
    ghcr.io/goreleaser/nfpm:latest \
    "$@"
fi

echo "nfpm and docker are not available. Install one of them to build packages." 1>&2
exit 1
