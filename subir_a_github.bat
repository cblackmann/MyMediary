@echo off
title Subir Mediary a GitHub
cd /d "%~dp0"
echo ========================================================
echo  Subiendo Mediary a GitHub...
echo ========================================================
echo.
git push -u origin main
echo.
echo ========================================================
echo Proceso finalizado. Puedes cerrar esta ventana.
echo ========================================================
pause