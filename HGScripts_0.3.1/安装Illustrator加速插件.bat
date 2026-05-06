@echo off
setlocal EnableExtensions EnableDelayedExpansion

set "SOURCE_ROOT=%~dp0IllustratorPlugins_win"
set "FOUND=0"
set "INSTALLED=0"

echo.
echo ==========================================
echo  HGScripts Illustrator Acceleration
echo ==========================================
echo.
echo This installs the matching HGScripts .aip files for each Illustrator version.
echo Supported versions: 2023, 2024, 2025, 2026.
echo Please run this file as administrator.
echo.

if not exist "%SOURCE_ROOT%\2023\*.aip" if not exist "%SOURCE_ROOT%\2024\*.aip" if not exist "%SOURCE_ROOT%\2025\*.aip" if not exist "%SOURCE_ROOT%\2026\*.aip" (
  echo [ERROR] Acceleration plugin files were not found:
  echo %SOURCE_ROOT%
  echo.
  pause
  exit /b 1
)

for /D %%I in ("C:\Program Files\Adobe\Adobe Illustrator *") do (
  if exist "%%~fI\Plug-ins" (
    set "FOUND=1"
    call :detect_year "%%~nxI"
    if defined AI_YEAR (
      call :install_one "%%~fI\Plug-ins" "!AI_YEAR!"
    ) else (
      echo Skipped unsupported Illustrator folder:
      echo %%~fI
      echo.
    )
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

:detect_year
set "AI_YEAR="
set "AI_NAME=%~1"
echo %AI_NAME% | findstr /C:"2023" >nul && set "AI_YEAR=2023"
echo %AI_NAME% | findstr /C:"2024" >nul && set "AI_YEAR=2024"
echo %AI_NAME% | findstr /C:"2025" >nul && set "AI_YEAR=2025"
echo %AI_NAME% | findstr /C:"2026" >nul && set "AI_YEAR=2026"
exit /b 0

:install_one
set "PLUGIN_ROOT=%~1\HGScripts"
set "AI_YEAR=%~2"
set "SOURCE_DIR=%SOURCE_ROOT%\%AI_YEAR%"
set "BACKUP_DIR=%PLUGIN_ROOT%\backup_%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%"
set "BACKUP_DIR=%BACKUP_DIR: =0%"

if not exist "%SOURCE_DIR%\*.aip" (
  echo [ERROR] Missing plugin files for Illustrator %AI_YEAR%:
  echo %SOURCE_DIR%
  echo.
  exit /b 0
)

echo Installing Illustrator %AI_YEAR% plugins to:
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
