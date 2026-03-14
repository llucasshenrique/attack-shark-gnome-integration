#!/bin/sh
set -eu

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found; cannot run container package tests" 1>&2
  exit 1
fi

if ! ls dist/packages/*.deb >/dev/null 2>&1; then
  echo "no .deb package found in dist/packages" 1>&2
  exit 1
fi

if ! ls dist/packages/*.rpm >/dev/null 2>&1; then
  echo "no .rpm package found in dist/packages" 1>&2
  exit 1
fi

run_test() {
  name="$1"
  dockerfile="$2"
  base_image="$3"

  echo "Running container package test: $name ($base_image)"
  docker build \
    --build-arg BASE_IMAGE="$base_image" \
    -f "$dockerfile" \
    -t "attack-shark-cli-test:$name" \
    .
}

run_test "debian-12" ".docker/Dockerfile.deb" "debian:12"
run_test "ubuntu-22-04" ".docker/Dockerfile.deb" "ubuntu:22.04"
run_test "ubuntu-24-04" ".docker/Dockerfile.deb" "ubuntu:24.04"
run_test "fedora-41" ".docker/Dockerfile.rpm" "fedora:41"
run_test "fedora-43" ".docker/Dockerfile.rpm" "fedora:43"
run_test "ubi-9" ".docker/Dockerfile.rpm" "registry.access.redhat.com/ubi9/ubi"
