#!/bin/bash
cd "$(dirname "$0")" || exit 1
if [[ ! -d node_modules/electron/dist ]]; then
  echo "正在把星笺客户端下载到项目里…"
  node node_modules/electron/install.js || exit 1
fi
echo "正在打开星笺…"
npm run build:electron || exit 1
if [[ ! -f dist/index.html ]]; then
  npm run build:web || exit 1
fi
ROOT="$(pwd)"
open "$ROOT/node_modules/electron/dist/Electron.app" --args "$ROOT"
