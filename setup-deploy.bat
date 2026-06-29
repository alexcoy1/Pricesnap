@echo off
title PriceSnap Deploy Setup
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-deploy.ps1"