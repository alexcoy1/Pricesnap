@echo off
title PayTrail Netlify Deploy
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\netlify-deploy.ps1"
