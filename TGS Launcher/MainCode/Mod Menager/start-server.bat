@echo off
title TGS Server Launcher
color 0A

echo ========================================
echo    TGS SERVER LAUNCHER
echo ========================================
echo.
echo Iniciando servidor...
echo.

cd /d "%~dp0server"

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em https://nodejs.org
    pause
    exit /b 1
)

echo Verificando dependencias...
if not exist node_modules (
    echo Instalando dependencias...
    npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependencias!
        pause
        exit /b 1
    )
)

echo.
echo Iniciando servidor em modo desenvolvimento...
echo Pressione Ctrl+C para parar
echo.
echo Servidor ira rodar em: http://localhost:3000
echo.

npm run dev

pause
