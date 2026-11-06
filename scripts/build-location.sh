#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP="$ROOT/build/LocationHelper.app"
mkdir -p "$APP/Contents/MacOS"
cp "$ROOT/scripts/LocationHelper-Info.plist" "$APP/Contents/Info.plist"
swiftc -O -framework CoreLocation -o "$APP/Contents/MacOS/location" "$ROOT/scripts/location.swift"
codesign --force --sign - --identifier app.hoshisen.local.location "$APP"
