#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="$SCRIPT_DIR/HGScripts"
TARGET_DIR="$HOME/Library/Application Support/Adobe/CEP/extensions/HGScripts"

echo
echo "=========================================="
echo " HGScripts v0.2.0 macOS Installer"
echo "=========================================="
echo

if [ ! -f "$SOURCE_DIR/CSXS/manifest.xml" ]; then
  echo "[ERROR] Plugin folder was not found:"
  echo "$SOURCE_DIR"
  echo
  read -r -p "Press Enter to exit..."
  exit 1
fi

echo "[1/2] Preparing target folder"
mkdir -p "$(dirname "$TARGET_DIR")"

echo "[2/2] Copying plugin files"
rm -rf "$TARGET_DIR"
cp -R "$SOURCE_DIR" "$TARGET_DIR"

echo
echo "Installation completed."
echo "Target: $TARGET_DIR"
echo
echo "If the panel menu does not appear, run Enable_CEP_Debug_Mode_macOS.command once."
echo "Restart Adobe apps, then open Window > Extensions > HGScripts."
echo
read -r -p "Press Enter to exit..."
