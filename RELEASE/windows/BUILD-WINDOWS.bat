@echo off
:: ═══════════════════════════════════════════════════════════════════════
::  PRO DIGITALIX — Build Windows EXE + Portable
::  ANABOK GROUP
::
::  PRÉREQUIS :
::  - Node.js 20+ (https://nodejs.org)
::  - npm install -g electron-builder
::
::  USAGE : Double-cliquer sur ce fichier ou lancer dans cmd.exe
:: ═══════════════════════════════════════════════════════════════════════

title PRO DIGITALIX — Build Windows
color 0B

echo.
echo  ██████╗ ██████╗  ██████╗     ██████╗ ██╗ ██████╗ ██╗████████╗ █████╗ ██╗     ██╗██╗  ██╗
echo  ██╔══██╗██╔══██╗██╔═══██╗    ██╔══██╗██║██╔════╝ ██║╚══██╔══╝██╔══██╗██║     ██║╚██╗██╔╝
echo  ██████╔╝██████╔╝██║   ██║    ██║  ██║██║██║  ███╗██║   ██║   ███████║██║     ██║ ╚███╔╝
echo  ██╔═══╝ ██╔══██╗██║   ██║    ██║  ██║██║██║   ██║██║   ██║   ██╔══██║██║     ██║ ██╔██╗
echo  ██║     ██║  ██║╚██████╔╝    ██████╔╝██║╚██████╔╝██║   ██║   ██║  ██║███████╗██║██╔╝ ██╗
echo  ╚═╝     ╚═╝  ╚═╝ ╚═════╝     ╚═════╝ ╚═╝ ╚═════╝ ╚═╝   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝╚═╝  ╚═╝
echo.
echo  ANABOK GROUP — Build Windows
echo  ═════════════════════════════════════════════════════════════════════
echo.

set ROOT=%~dp0..\..
set RELEASE=%~dp0

:: Vérifier Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERREUR] Node.js non trouve. Installer depuis https://nodejs.org
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo [OK] Node.js %NODE_VER%

:: Vérifier electron-builder
where electron-builder >nul 2>&1
if errorlevel 1 (
    echo [INFO] Installation electron-builder...
    call npm install -g electron-builder
)
echo [OK] electron-builder disponible

:: Aller à la racine du projet
cd /d "%ROOT%"

:: Installer les dépendances electron
echo.
echo [1/4] Installation des dependances Electron...
call npm install --legacy-peer-deps
if errorlevel 1 goto :error

:: Compiler TypeScript Electron
echo.
echo [2/4] Compilation TypeScript Electron...
call npx tsc -p electron\tsconfig.json
if errorlevel 1 goto :error
echo [OK] TypeScript compile

:: Build EXE installateur NSIS
echo.
echo [3/4] Build installateur NSIS (EXE)...
call electron-builder --win --x64 --config electron\electron-builder.yml
if errorlevel 1 goto :error

:: Copier dans RELEASE
echo.
echo [4/4] Copie vers dossier RELEASE...
for /f "tokens=*" %%f in ('dir /b /s "dist-electron\*.exe" 2^>nul') do (
    copy "%%f" "%RELEASE%" >nul
    echo [OK] Copie : %%~nxf
)

echo.
echo  ═════════════════════════════════════════════════════════════════════
echo  ✅ BUILD WINDOWS TERMINE !
echo  ═════════════════════════════════════════════════════════════════════
echo.
echo  Fichiers generes dans RELEASE\windows\ :
dir /b "%RELEASE%*.exe" 2>nul
echo.
pause
exit /b 0

:error
echo.
echo  [ERREUR] Le build a echoue. Verifiez les messages ci-dessus.
pause
exit /b 1
