#!/bin/sh
set -eu

PKG_PATH="${1:-}"
if [ -z "$PKG_PATH" ]; then
  echo "Usage: $0 /path/to/package.deb" 1>&2
  exit 2
fi

if command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y --no-install-recommends ca-certificates
fi

dpkg -i "$PKG_PATH" || true
if command -v apt-get >/dev/null 2>&1; then
  apt-get install -f -y
fi

test -x /usr/bin/attack-shark-cli
test -f /etc/udev/rules.d/99-attack-shark.rules

/usr/bin/attack-shark-cli >/tmp/cli.out 2>/tmp/cli.err || true
if grep -q 'No command specified' /tmp/cli.out || \
   grep -q 'No command specified' /tmp/cli.err || \
  grep -q '"error"' /tmp/cli.out; then
  exit 0
fi

echo "Unexpected CLI output while smoke testing deb package" 1>&2
cat /tmp/cli.out 1>&2 || true
cat /tmp/cli.err 1>&2 || true
exit 1
