#!/bin/bash
# Exit on error
set -e

echo "==================================================="
echo "  SIGECOSEM ERP v4.0 - Compilador y Despliegue (Linux)"
echo "==================================================="
echo

# 1. Navegar al frontend y compilar
echo "[+] Compilando frontend (npm run build)..."
cd frontend
npm run build
cd ..

echo
echo "[+] Eliminando carpeta antigua en el servidor..."
ssh root@192.241.244.170 "rm -rf /root/Ecosem/frontend/dist"

echo "[+] Subiendo nueva carpeta compilada..."
scp -r frontend/dist root@192.241.244.170:/root/Ecosem/frontend/

echo
echo "[+] Subiendo código fuente del backend actualizado..."
scp -r backend root@192.241.244.170:/root/Ecosem/

echo
echo "[+] Reconstruyendo y reiniciando el backend en el servidor..."
ssh root@192.241.244.170 "cd /root/Ecosem && docker compose up -d --build --force-recreate backend"

echo
echo "[+] Reiniciando servidor web Nginx..."
ssh root@192.241.244.170 "docker compose -f /root/Ecosem/docker-compose.yml restart nginx"

echo
echo "==================================================="
echo "  ¡Despliegue completado con éxito!"
echo "  Frontend + Backend actualizados en producción"
echo "==================================================="
echo
