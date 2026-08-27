@echo off
title Chordify Claude - Procesar cancion
chcp 65001 > nul
cls
set /p url="Pega el link de YouTube y presiona Enter: "
python procesar.py "%url%"
pause
