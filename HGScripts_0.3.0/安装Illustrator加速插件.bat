@echo off
setlocal EnableExtensions

set "SOURCE_DIR=%~dp0IllustratorPlugins_win"
set "FOUND=0"
set "INSTALLED=0"

echo.
echo ==========================================
echo  HGScripts Illustrator Acceleration
echo ==========================================
echo.
echo This installs HGScripts .aip files into every detected Illustrator Plug-ins folder.
echo Please run this file as administrator.
echo.

if not exist "%SOURCE_DIR%\*.aip" (
  echo [ERROR] Acceleration plugin files were not found:
  echo %SOURCE_DIR%
  echo.
  pause
  exit /b 1
)

for /D %%I in ("C:\Program Files\Adobe\Adobe Illustrator *") do (
  if exist "%%~fI\Plug-ins" (
    set "FOUND=1"
    call :install_one "%%~fI\Plug-ins"
  )
)

echo.
if "%FOUND%"=="0" (
  echo [ERROR] No Illustrator Plug-ins folder was found.
  echo Please check whether Illustrator is installed in C:\Program Files\Adobe.
  echo.
  pause
  exit /b 1
)

if "%INSTALLED%"=="0" (
  echo [ERROR] No plugin was installed.
  echo Please right-click this file and choose Run as administrator.
  echo.
  pause
  exit /b 1
)

echo Installation completed.
echo Please restart Illustrator.
echo.
pause
exit /b 0

:install_one
set "PLUGIN_ROOT=%~1\HGScripts"
set "BACKUP_DIR=%PLUGIN_ROOT%\backup_%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "BACKUP_DIR=%BACKUP_DIR: =0%"

echo Installing to:
echo %PLUGIN_ROOT%

if not exist "%PLUGIN_ROOT%" mkdir "%PLUGIN_ROOT%"
if errorlevel 1 goto install_error

for %%F in ("%SOURCE_DIR%\*.aip") do (
  if exist "%PLUGIN_ROOT%\%%~nxF" (
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
    copy /Y "%PLUGIN_ROOT%\%%~nxF" "%BACKUP_DIR%\%%~nxF" >nul
  )
  copy /Y "%%~fF" "%PLUGIN_ROOT%\%%~nxF" >nul
  if errorlevel 1 goto install_error
)

set "INSTALLED=1"
echo Done.
echo.
exit /b 0

:install_error
echo [ERROR] Failed to install to:
echo %PLUGIN_ROOT%
echo.
exit /b 1
