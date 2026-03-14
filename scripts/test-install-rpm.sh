#!/bin/sh
set -eu

PKG_PATH="${1:-}"
if [ -z "$PKG_PATH" ]; then
  echo "Usage: $0 /path/to/package.rpm" 1>&2
  exit 2
fi

if command -v dnf >/dev/null 2>&1; then
  dnf -y install "$PKG_PATH"
elif command -v microdnf >/dev/null 2>&1; then
  microdnf -y install "$PKG_PATH"
elif command -v yum >/dev/null 2>&1; then
  yum -y localinstall "$PKG_PATH"
else
  rpm -ivh "$PKG_PATH"
fi

test -x /usr/bin/attack-shark-cli
test -f /etc/udev/rules.d/99-attack-shark.rules

/usr/bin/attack-shark-cli >/tmp/cli.out 2>/tmp/cli.err || true
if grep -q 'No command specified' /tmp/cli.out || \
   grep -q 'No command specified' /tmp/cli.err || \
  grep -q '"error"' /tmp/cli.out; then
  exit 0
fi

echo "Unexpected CLI output while smoke testing rpm package" 1>&2
cat /tmp/cli.out 1>&2 || true
cat /tmp/cli.err 1>&2 || true
exit 1
