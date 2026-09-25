@echo off
cd /d %~dp0..
node tools\build.js %*
if errorlevel 1 (
  echo.
  echo ?????/?????? web\build-report.txt
  pause
)

