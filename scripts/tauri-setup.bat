
@echo off
echo 🚀 Setting up PATCH Library for Tauri Desktop Build
echo ==================================================

:: Check if Rust is installed
where rustc >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Rust is not installed. Please install Rust first:
    echo    https://rustup.rs/
    pause
    exit /b 1
)

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js 16+ first.
    pause
    exit /b 1
)

echo ✅ Rust installed
echo ✅ Node.js installed

:: Install Tauri CLI
echo 📦 Installing Tauri CLI...
cargo install tauri-cli

:: Install npm dependencies
echo 📦 Installing npm dependencies...
npm install

:: Initialize Tauri if not already done
if not exist "src-tauri" (
    echo 🔧 Initializing Tauri...
    cargo tauri init --app-name "PATCH - THE SMART LIBRARY" --window-title "PATCH - THE SMART LIBRARY" --dist-dir "../dist" --dev-path "http://localhost:8080"
    
    :: Copy our custom config
    copy "tauri-config\tauri.conf.json" "src-tauri\tauri.conf.json"
)

echo 🎉 Tauri setup complete!
echo.
echo Next steps:
echo 1. Build the React app: npm run build
echo 2. Build Tauri app: cargo tauri build
echo 3. Find installers in: src-tauri\target\release\bundle\
pause
