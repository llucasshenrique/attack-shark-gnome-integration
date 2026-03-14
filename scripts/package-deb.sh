#!/bin/sh
set -eu

mkdir -p dist/packages
sh ./scripts/nfpm.sh package --config ./nfpm.yaml --packager deb --target dist/packages/
