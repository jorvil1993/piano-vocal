@echo off
title Atril - Chordify Claude
chcp 65001 > nul
cls
echo ========================================================
echo   ATRIL DE ENSAYO - acordes, letra, piano y bateria
echo ========================================================
echo.
echo Iniciando el servidor. Desde el celular entra por HTTPS
echo (el puerto 8443) o la pantalla se apagara sola mientras tocas.
echo.
cd /d "%~dp0en-curso\chordify-claude"
python servidor.py
pause
