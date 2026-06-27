@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PS1=%SCRIPT_DIR%install-local-code-signing-cert.ps1"
set "CERT=%SCRIPT_DIR%home-shopping-scheduler-code-signing.crt"

net session >nul 2>&1
if %errorlevel% neq 0 (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%PS1%" -CertificatePath "%CERT%"
echo.
echo 인증서 등록이 끝났습니다. 이제 home-shopping-scheduler.exe를 실행해 주세요.
pause
