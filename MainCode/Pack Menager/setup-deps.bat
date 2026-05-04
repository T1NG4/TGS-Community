@echo off
echo Configurando dependencias para Pack Menager...
if exist node_modules rmdir /S /Q node_modules
mklink /J node_modules "..\..\Dependence\node_modules"
echo Concluido!
