@echo off
title PayTrail Deploy Setup
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-deploy.ps1"
