#!/bin/bash

echo
echo "=========================================="
echo " Enable CEP Debug Mode for HGScripts"
echo "=========================================="
echo

echo "This enables unsigned CEP extensions for the current macOS user."
echo

for version in 7 8 9 10 11 12 13 14 15; do
  defaults write "com.adobe.CSXS.$version" PlayerDebugMode 1
done

echo "Done."
echo "Restart Illustrator, then open Window > Extensions > 海哥的Adobe脚本管理器."
echo
read -r -p "Press Enter to exit..."
