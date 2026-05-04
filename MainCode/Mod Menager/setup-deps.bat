@echo off
echo Configurando dependencias para Mod Menager...
if exist client\node_modules rmdir /S /Q client\node_modules
if exist server\node_modules rmdir /S /Q server\node_modules
cd client
mklink /J node_modules "..\..\..\Dependence\node_modules"
cd ..\server
mklink /J node_modules "..\..\..\Dependence\node_modules"
cd ..
echo Concluido!
