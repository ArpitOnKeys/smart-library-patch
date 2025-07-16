
# 🖥️ PATCH - THE SMART LIBRARY
## Desktop Application Setup Guide

This guide will help you convert the web-based PATCH Library Management System into a native desktop application using Tauri.

---

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### 1. **Rust Programming Language**
```bash
# Install Rust (Windows/macOS/Linux)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Verify installation
rustc --version
cargo --version
```

### 2. **Node.js (v16 or later)**
```bash
# Verify installation
node --version
npm --version
```

### 3. **Platform-Specific Dependencies**

#### Windows:
- Visual Studio Build Tools 2019/2022 with C++ build tools
- Windows SDK

#### macOS:
- Xcode Command Line Tools: `xcode-select --install`

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

---

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

#### Windows:
```cmd
# Run the setup script
scripts\tauri-setup.bat
```

#### macOS/Linux:
```bash
# Make script executable and run
chmod +x scripts/tauri-setup.sh
./scripts/tauri-setup.sh
```

### Option 2: Manual Setup

#### Step 1: Install Tauri CLI
```bash
cargo install tauri-cli
```

#### Step 2: Install Project Dependencies
```bash
npm install
```

#### Step 3: Initialize Tauri
```bash
cargo tauri init --app-name "PATCH - THE SMART LIBRARY" --window-title "PATCH - THE SMART LIBRARY" --dist-dir "../dist" --dev-path "http://localhost:5173"
```

#### Step 4: Copy Configuration
```bash
# Copy the pre-configured Tauri settings
cp tauri-config/tauri.conf.json src-tauri/tauri.conf.json
```

---

## 🛠️ Development & Building

### Development Mode
Run the app in development mode with hot reload:

```bash
# Terminal 1: Start React dev server
npm run dev

# Terminal 2: Start Tauri dev window
cargo tauri dev
```

### Production Build

#### Step 1: Build React App
```bash
npm run build
```

#### Step 2: Build Tauri Desktop App
```bash
cargo tauri build
```

### Build Output Locations

After successful build, find your installers at:

#### Windows:
- **Installer**: `src-tauri/target/release/bundle/msi/PATCH - THE SMART LIBRARY_1.0.0_x64_en-US.msi`
- **Executable**: `src-tauri/target/release/PATCH - THE SMART LIBRARY.exe`

#### macOS:
- **App Bundle**: `src-tauri/target/release/bundle/macos/PATCH - THE SMART LIBRARY.app`
- **DMG Installer**: `src-tauri/target/release/bundle/dmg/PATCH - THE SMART LIBRARY_1.0.0_x64.dmg`

#### Linux:
- **AppImage**: `src-tauri/target/release/bundle/appimage/patch-the-smart-library_1.0.0_amd64.AppImage`
- **DEB Package**: `src-tauri/target/release/bundle/deb/patch-the-smart-library_1.0.0_amd64.deb`

---

## 🎨 Customization

### App Icon
Replace icons in `src-tauri/icons/` with your custom icons:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

### App Metadata
Edit `src-tauri/tauri.conf.json`:

```json
{
  "package": {
    "productName": "Your App Name",
    "version": "1.0.0"
  },
  "tauri": {
    "bundle": {
      "identifier": "com.yourname.yourapp",
      "copyright": "© 2024 Your Name",
      "category": "Education",
      "shortDescription": "Your app description",
      "longDescription": "Detailed description..."
    }
  }
}
```

### Window Settings
Modify window properties in `tauri.conf.json`:

```json
{
  "tauri": {
    "windows": [
      {
        "title": "Your App Title",
        "width": 1280,
        "height": 800,
        "minWidth": 1024,
        "minHeight": 768,
        "center": true,
        "resizable": true
      }
    ]
  }
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. **Rust Not Found**
```bash
# Add Rust to PATH (restart terminal after)
source ~/.cargo/env
```

#### 2. **Build Dependencies Missing (Linux)**
```bash
sudo apt install build-essential curl wget libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
```

#### 3. **Windows Build Tools Missing**
- Install Visual Studio Build Tools 2019/2022
- Include "C++ build tools" workload
- Install Windows SDK

#### 4. **macOS Code Signing**
For distribution, you'll need an Apple Developer account:
```bash
# Sign the app (requires Apple Developer Certificate)
codesign --force --deep --sign "Developer ID Application: Your Name" "PATCH - THE SMART LIBRARY.app"
```

### Debug Mode
Run with debug output:
```bash
RUST_LOG=debug cargo tauri dev
```

---

## 📦 Distribution

### Windows
- **MSI Installer**: Ready for enterprise deployment
- **Executable**: Portable, no installation required

### macOS
- **DMG**: Standard macOS installer format
- **App Bundle**: Drag-and-drop installation

### Linux
- **AppImage**: Universal Linux format
- **DEB**: Ubuntu/Debian package
- **RPM**: Red Hat/Fedora package (configure in `tauri.conf.json`)

---

## 🔐 Security & Permissions

The app is configured with minimal permissions by default:
- File system access (for data backup/restore)
- Dialog access (for file selection)
- Shell access (for opening WhatsApp links)

To modify permissions, edit `allowlist` in `tauri.conf.json`.

---

## 🚀 Advanced Features

### Auto-Updates
Enable auto-updates in `tauri.conf.json`:
```json
{
  "tauri": {
    "updater": {
      "active": true,
      "endpoints": ["https://your-update-server.com/updates"]
    }
  }
}
```

### Custom Plugins
Add Tauri plugins for additional functionality:
```bash
# Example: File system extended access
cargo add tauri-plugin-fs-extra
```

---

## 📞 Support

For technical support:
- **Developer**: Arpit Upadhyay
- **Issues**: Check build logs for specific error messages
- **Documentation**: https://tauri.app/

---

## 📝 Build Checklist

- [ ] Rust installed and updated
- [ ] Node.js 16+ installed
- [ ] Platform build tools installed
- [ ] Project dependencies installed (`npm install`)
- [ ] Tauri CLI installed (`cargo install tauri-cli`)
- [ ] React app builds successfully (`npm run build`)
- [ ] Tauri dev mode works (`cargo tauri dev`)
- [ ] Production build completes (`cargo tauri build`)
- [ ] App launches and functions correctly
- [ ] All features work offline
- [ ] Custom icons applied
- [ ] App metadata updated

---

**🎉 Once built successfully, you'll have a professional desktop application ready for distribution!**
