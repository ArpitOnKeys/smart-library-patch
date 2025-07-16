
#!/bin/bash

echo "🚀 Setting up PATCH Library for Tauri Desktop Build"
echo "=================================================="

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first:"
    echo "   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
    echo "   source ~/.cargo/env"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Rust version: $(rustc --version)"
echo "✅ Node.js version: $(node --version)"

# Install Tauri CLI
echo "📦 Installing Tauri CLI..."
cargo install tauri-cli

# Install npm dependencies (assuming they're already installed)
echo "📦 Checking npm dependencies..."
npm install

# Initialize Tauri (if not already initialized)
if [ ! -d "src-tauri" ]; then
    echo "🔧 Initializing Tauri..."
    cargo tauri init --app-name "PATCH - THE SMART LIBRARY" --window-title "PATCH - THE SMART LIBRARY" --dist-dir "../dist" --dev-path "http://localhost:8080"
    
    # Copy our custom config
    cp tauri-config/tauri.conf.json src-tauri/tauri.conf.json
fi

echo "🎉 Tauri setup complete!"
echo ""
echo "Next steps:"
echo "1. Build the React app: npm run build"
echo "2. Build Tauri app: cargo tauri build"
echo "3. Find installers in: src-tauri/target/release/bundle/"
