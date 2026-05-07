@echo off
title Incunable ERP
echo.
echo  ================================
echo   Incunable ERP - Demarrage...
echo  ================================
echo.
echo  Ouvre http://localhost:8000 dans ton navigateur
echo  (attends 2-3 secondes le temps que ca demarre)
echo.
echo  Pour arreter : ferme cette fenetre
echo.
cd /d C:\xampp\htdocs\incunable
C:\xampp\php\php.exe artisan serve --port=8000
pause
