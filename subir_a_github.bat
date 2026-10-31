@echo off
title Subir MyMediary a GitHub
cd /d "C:\Users\cjtor\Desktop\MyMediary"
echo ========================================================
echo  Subiendo MyMediary a https://github.com/cblackmann/MyMediary
echo ========================================================
echo.
"%LOCALAPPDATA%\Programs\Git\cmd\git.exe" push -u origin main
echo.
echo ========================================================
echo Proceso finalizado. Puedes cerrar esta ventana.
echo ========================================================
pause
