#!/usr/bin/env bash
set -euo pipefail

# Requires XeLaTeX with TikZ and standalone, plus dvisvgm.
repository_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
diagram_source="$repository_root/src/assets/diagrams/momentum-bonus/figures.tex"
diagram_output="$repository_root/public/diagrams/momentum-bonus"
diagram_build="$(mktemp -d "${TMPDIR:-/tmp}/momentum-diagrams.XXXXXX")"
trap 'rm -rf "$diagram_build"' EXIT

mkdir -p "$diagram_output"
if ! xelatex -no-pdf -interaction=nonstopmode -halt-on-error -jobname=figures \
  -output-directory="$diagram_build" "\def\MomentumSvg{1}\input{$diagram_source}" \
  > "$diagram_build/compiler.log" 2>&1; then
  cat "$diagram_build/compiler.log" >&2
  exit 1
fi

dvisvgm --page=1 --bbox=papersize --no-fonts --exact \
  --output="$diagram_output/mass-ratio.svg" "$diagram_build/figures.xdv"
