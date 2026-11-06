#!/bin/bash
# 把已经打好的 星笺.app 收成可以拖进「应用程序」的安装镜像。
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/release/mac-arm64/星笺.app"
VERSION="$(node -p "require('$ROOT/package.json').version")"
OUT="$ROOT/release/hoshisen-${VERSION}-arm64.dmg"
STAGE="$(mktemp -d "${TMPDIR:-/tmp}/hoshisen-dmg.XXXXXX")"

cleanup() {
  rm -rf "$STAGE"
}
trap cleanup EXIT

if [[ ! -d "$APP" ]]; then
  echo "还没有打好应用：$APP" >&2
  exit 1
fi

codesign --force --sign - --identifier app.hoshisen.local.location "$APP/Contents/Resources/LocationHelper.app"
codesign --force --deep --sign - --identifier app.hoshisen.local "$APP"

ditto "$APP" "$STAGE/星笺.app"
ln -s /Applications "$STAGE/Applications"
rm -f "$OUT"
diskutil image create from --format UDZO --volumeName "安装星笺" "$STAGE" "$OUT" >/dev/null
echo "$OUT"
