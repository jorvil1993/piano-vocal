@echo off
title Permitir el atril desde el celular
chcp 65001 > nul
cls

net session >nul 2>&1
if %errorlevel% neq 0 (
  echo.
  echo   ESTO HAY QUE ABRIRLO COMO ADMINISTRADOR.
  echo.
  echo   Cierra esta ventana, haz CLIC DERECHO sobre
  echo   ABRIR-FIREWALL.bat y elige
  echo   "Ejecutar como administrador".
  echo.
  pause
  exit /b
)

echo ========================================================
echo   PERMITIR QUE EL CELULAR ENTRE AL ATRIL
echo ========================================================
echo.
echo Se van a hacer tres cosas. Solo una vez.
echo.

echo [1/3] Marcar tu wifi como red PRIVADA (es tu casa, no un
echo       aeropuerto). En publica Windows bloquea casi todo.
powershell -NoProfile -Command "Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq 'Public' } | Set-NetConnectionProfile -NetworkCategory Private"
echo       hecho.
echo.

echo [2/3] Abrir los puertos 8300 y 8443 para la red local.
netsh advfirewall firewall delete rule name="Atril Chordify 8300" >nul 2>&1
netsh advfirewall firewall delete rule name="Atril Chordify 8443" >nul 2>&1
netsh advfirewall firewall add rule name="Atril Chordify 8300" dir=in action=allow protocol=TCP localport=8300 profile=any >nul
netsh advfirewall firewall add rule name="Atril Chordify 8443" dir=in action=allow protocol=TCP localport=8443 profile=any >nul
echo       hecho.
echo.

echo [3/3] Quitar las reglas que BLOQUEAN python.
echo       Aparecieron al pulsar "Cancelar" en algun aviso de
echo       Windows, y mandan sobre las de permitir.
powershell -NoProfile -Command "Get-NetFirewallRule -Direction Inbound -Action Block -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'python' } | Disable-NetFirewallRule"
echo       hecho.
echo.

echo ========================================================
echo   LISTO. Desde el celular entra por:
echo.
powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.*' } | Select-Object -First 1).IPAddress | ForEach-Object { '       https://' + $_ + ':8443' }"
echo.
echo   Con el https:// delante y el :8443 al final.
echo   La primera vez acepta el aviso del certificado en
echo   "Configuracion avanzada" y "Continuar".
echo ========================================================
echo.
pause
