@echo off
echo Starting PriceSnap...
echo.
echo Open in browser: http://127.0.0.1:8766
echo Create an account from the landing page to start
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
