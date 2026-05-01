@echo off
setlocal EnableExtensions

set "PLUGIN_NAME=HGScripts"
set "SOURCE_DIR=%~dp0HGScripts"
set "TARGET_DIR=%APPDATA%\Adobe\CEP\extensions\%PLUGIN_NAME%"

echo.
echo ==========================================
echo  HGScripts v0.1.0 Installer
echo ==========================================
echo.

if not exist "%SOURCE_DIR%\CSXS\manifest.xml" (
  echo [ERROR] Plugin folder was not found:
  echo %SOURCE_DIR%
  echo.
  pause
  exit /b 1
)

echo [1/4] Preparing target folders
if not exist "%TARGET_DIR%" mkdir "%TARGET_DIR%"
if not exist "%TARGET_DIR%\data" mkdir "%TARGET_DIR%\data"
if not exist "%TARGET_DIR%\user_scripts" mkdir "%TARGET_DIR%\user_scripts"

echo [2/4] Copying plugin files
robocopy "%SOURCE_DIR%\assets" "%TARGET_DIR%\assets" /E /R:2 /W:1 >nul
if errorlevel 8 goto copy_error
robocopy "%SOURCE_DIR%\CSXS" "%TARGET_DIR%\CSXS" /E /R:2 /W:1 >nul
if errorlevel 8 goto copy_error
robocopy "%SOURCE_DIR%\scripts" "%TARGET_DIR%\scripts" /E /R:2 /W:1 >nul
if errorlevel 8 goto copy_error
copy /Y "%SOURCE_DIR%\index.html" "%TARGET_DIR%\index.html" >nul
if errorlevel 1 goto copy_error
copy /Y "%SOURCE_DIR%\README.md" "%TARGET_DIR%\README.md" >nul
if errorlevel 1 goto copy_error
copy /Y "%SOURCE_DIR%\data\script_icons.json" "%TARGET_DIR%\data\script_icons.json" >nul
if errorlevel 1 goto copy_error
if not exist "%TARGET_DIR%\data\settings.json" (
  copy /Y "%SOURCE_DIR%\data\settings.json" "%TARGET_DIR%\data\settings.json" >nul
  if errorlevel 1 goto copy_error
)

echo [3/4] Copying bundled scripts
robocopy "%SOURCE_DIR%\user_scripts" "%TARGET_DIR%\user_scripts" /E /XC /XN /XO /R:2 /W:1 >nul
if errorlevel 8 goto copy_error

echo [4/4] Enabling CEP debug mode for unsigned extensions
for %%V in (7 8 9 10 11 12 13 14 15) do (
  reg add "HKCU\Software\Adobe\CSXS.%%V" /v PlayerDebugMode /t REG_SZ /d 1 /f >nul
)

echo.
echo Installation completed.
echo Target: %TARGET_DIR%
echo.
echo Restart Illustrator, then open:
echo Window ^> Extensions ^> HGScripts / Haige Adobe Script Manager
echo.
pause
exit /b 0

:copy_error
echo.
echo [ERROR] Copy failed. Please close Illustrator and check folder permissions.
echo Target: %TARGET_DIR%
echo.
pause
exit /b 1
