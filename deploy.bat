@echo off
echo ===================================================
echo   SIGECOSEM ERP v4.0 - Compilador y Despliegue
echo ===================================================
echo.

:: 1. Configurar ruta temporal de Node.js
set PATH=C:\Program Files\nodejs;%PATH%

:: 2. Navegar al frontend
cd /d "d:\sigecomen\Ecosem\Ecosem\frontend"

echo [+] Compilando frontend (npm run build)...
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] La compilacion del frontend fallo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [+] Eliminando carpeta antigua en el servidor...
ssh root@192.241.244.170 "rm -rf /root/Ecosem/frontend/dist"

echo [+] Subiendo nueva carpeta compilada...
scp -r "d:\sigecomen\Ecosem\Ecosem\frontend\dist" root@192.241.244.170:/root/Ecosem/frontend/

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Fallo la subida via SCP.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [+] Subiendo codigo fuente del backend actualizado...
scp -r "d:\sigecomen\Ecosem\Ecosem\backend" root@192.241.244.170:/root/Ecosem/

if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Fallo la subida del backend via SCP.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [+] Reconstruyendo y reiniciando el backend en el servidor...
ssh root@192.241.244.170 "cd /root/Ecosem && docker compose build backend && docker compose restart backend"

if %ERRORLEVEL% neq 0 (
    echo.
    echo [AVISO] El reinicio del backend reporto un error. Verifique el servidor.
)

echo.
echo [+] Reiniciando servidor web Nginx...
ssh root@192.241.244.170 "docker compose -f /root/Ecosem/docker-compose.yml restart nginx"

echo.
echo ===================================================
echo   !Despliegue completado con exito!
echo   Frontend + Backend actualizados en produccion
echo ===================================================
echo.
pause
