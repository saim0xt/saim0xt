# 📥 Installation Guide

Complete guide to install, build, and run the Expense Tracker application.

## 🎯 System Requirements

### Minimum Requirements
- **OS**: Windows 10 or 11
- **RAM**: 2GB
- **Storage**: 500MB free space
- **CPU**: Any modern processor (Intel/AMD)
- **Node.js**: Version 16 or higher (for development)

### Recommended
- **RAM**: 4GB+
- **Storage**: 1GB free space
- **Node.js**: Version 22 (latest LTS)

---

## 🚀 Quick Installation (Users)

### Option 1: Use Pre-built Installer
1. Download the installer from the releases page
2. Run `Expense-Tracker-Setup-1.0.0.exe`
3. Follow the installation wizard
4. Launch the app from Desktop or Start Menu

### Option 2: Build from Source
See "Development Setup" below.

---

## 👨‍💻 Development Setup

### Step 1: Install Prerequisites

#### Install Node.js
1. Download from [nodejs.org](https://nodejs.org/)
2. Install version 16 or higher (22 recommended)
3. Verify installation:
```bash
node --version  # Should show v16.0.0 or higher
npm --version   # Should show 8.0.0 or higher
```

#### Install Git (Optional)
For cloning the repository:
```bash
git --version
```

### Step 2: Get the Source Code

#### Option A: Download ZIP
1. Download the project ZIP
2. Extract to a folder
3. Open terminal in that folder

#### Option B: Clone with Git
```bash
git clone <repository-url>
cd expense-tracker-electron
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- Electron and build tools (~300MB)
- React and UI libraries (~50MB)
- Database and utility packages (~50MB)
- Total: ~400MB, takes 1-3 minutes

**Expected output:**
```
added 479 packages in 2m
```

### Step 4: Run in Development Mode

```bash
npm run dev
```

This will:
1. Start Vite dev server on port 5173
2. Launch Electron window
3. Enable hot reload (changes appear instantly)

**Expected output:**
```
> dev:renderer
  VITE v7.2.2 ready in 234 ms
  ➜ Local: http://localhost:5173/

> dev:electron
  Electron started
```

The app window should open automatically!

---

## 🏗️ Building for Production

### Step 1: Build the React App

```bash
npm run build
```

This creates optimized production files in `dist-renderer/`

**Expected output:**
```
vite v7.2.2 building for production...
✓ built in 8.5s
```

### Step 2: Build Windows Installer

```bash
npm run build:win
```

This creates a Windows installer using Electron Builder.

**Expected output:**
```
• electron-builder version=26.0.12
• loaded configuration file=package.json
• building target=nsis
• packed in 45s
• installer created dist/Expense-Tracker-Setup-1.0.0.exe
```

**Output file:**
- Location: `dist/Expense-Tracker-Setup-1.0.0.exe`
- Size: ~150-200MB
- Type: NSIS installer

### Step 3: Test the Installer

1. Navigate to `dist/` folder
2. Run `Expense-Tracker-Setup-1.0.0.exe`
3. Install the app
4. Launch and test

---

## 📦 Package Scripts Explained

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | Full dev mode | Runs both renderer and electron |
| `npm run dev:renderer` | Vite only | Just the React dev server |
| `npm run dev:electron` | Electron only | Just the Electron window |
| `npm run build` | Build renderer | Creates production React bundle |
| `npm run build:win` | Build installer | Creates Windows installer |
| `npm start` | Run production | Runs built app (after build) |

---

## 🔧 Configuration

### Changing App Name
Edit `package.json`:
```json
{
  "name": "your-app-name",
  "build": {
    "productName": "Your App Name"
  }
}
```

### Changing App Icon

1. Create icon files:
   - `resources/icon.ico` (256x256, Windows)
   - `resources/icon.png` (512x512, development)

2. Use icon converter tools:
   - [ICO Converter](https://www.icoconverter.com/)
   - [CloudConvert](https://cloudconvert.com/png-to-ico)

3. Rebuild the app:
```bash
npm run build:win
```

### Changing Port (Dev)
Edit `vite.config.js`:
```javascript
server: {
  port: 5173  // Change this
}
```

### Database Location
Default: `%APPDATA%/expense-tracker-electron/expenses.db`

To change, edit `src/database/index.js`:
```javascript
const dbPath = path.join(userDataPath, 'your-db-name.db');
```

---

## 🐛 Troubleshooting

### Problem: "npm install" fails

**Solution 1**: Clear npm cache
```bash
npm cache clean --force
npm install
```

**Solution 2**: Delete node_modules
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3**: Use different registry
```bash
npm install --registry=https://registry.npmjs.org/
```

### Problem: "npm run dev" shows blank window

**Solution 1**: Check port 5173
- Make sure nothing else uses port 5173
- Change port in vite.config.js

**Solution 2**: Check console
- Open DevTools (Ctrl+Shift+I)
- Look for errors in console
- Check network tab

**Solution 3**: Rebuild
```bash
rm -rf node_modules dist-renderer
npm install
npm run dev
```

### Problem: "electron-builder" fails

**Solution 1**: Install Windows Build Tools (if on Windows)
```bash
npm install --global windows-build-tools
```

**Solution 2**: Check disk space
- Need at least 1GB free
- Clear temp files

**Solution 3**: Build in steps
```bash
npm run build           # Build renderer first
npm run build:win       # Then build installer
```

### Problem: Database errors

**Solution 1**: Delete database
- Location: `%APPDATA%/expense-tracker-electron/`
- Delete `expenses.db*` files
- Restart app

**Solution 2**: Check permissions
- Make sure app can write to AppData
- Run as administrator (if needed)

### Problem: Import/Export not working

**Solution 1**: Check file format
- CSV: `Date,Amount,Category,Description`
- Excel: Same column headers
- Ensure categories match

**Solution 2**: Check file permissions
- Can read import file
- Can write to export location

---

## 📱 Platform-Specific Notes

### Windows 10/11
- ✅ Fully supported
- ✅ NSIS installer
- ✅ Desktop shortcuts
- ✅ Start menu integration

### Windows 7/8
- ⚠️ May work but not officially supported
- Install latest Node.js compatible version

### Linux (Development only)
```bash
# Install dependencies
npm install

# Run in dev mode
npm run dev

# Build for Windows (requires Wine)
npm run build:win
```

### macOS (Development only)
```bash
# Same as Linux
npm install
npm run dev
```

---

## 🔄 Updating the App

### Update Dependencies
```bash
# Check for updates
npm outdated

# Update all packages
npm update

# Update specific package
npm install electron@latest

# Rebuild
npm run build:win
```

### Update Electron Version
```bash
npm install electron@latest
npm run build:win
```

---

## 📊 Build Sizes

| Component | Size |
|-----------|------|
| **node_modules** | ~400MB |
| **Built renderer** | ~2MB |
| **Electron runtime** | ~150MB |
| **Final installer** | ~180-200MB |
| **Installed app** | ~220MB |
| **Database** | <1MB |

---

## ⚡ Performance Tips

### Development
- Use SSD for faster builds
- Close unnecessary apps
- Use Node 22 for best performance

### Production
- Build on fast machine
- Enable all optimizations (default)
- Test on low-end hardware

---

## 🎓 Learning Resources

### Electron
- [Electron Docs](https://www.electronjs.org/docs)
- [Electron Builder](https://www.electron.build/)

### React
- [React Docs](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)

### SQLite
- [SQLite Docs](https://www.sqlite.org/docs.html)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)

---

## ✅ Installation Checklist

Before deploying to users:

- [ ] App builds without errors
- [ ] Installer runs and installs correctly
- [ ] App launches without errors
- [ ] Database creates and saves data
- [ ] All features work (add, edit, delete)
- [ ] Charts display correctly
- [ ] Import/Export works
- [ ] Theme switching works
- [ ] Keyboard shortcuts work
- [ ] App closes cleanly
- [ ] Uninstaller works
- [ ] No console errors
- [ ] Custom icon displays
- [ ] Desktop shortcut works
- [ ] Start menu entry works

---

## 🆘 Getting Help

If you encounter issues:

1. **Check this guide** - Most issues covered here
2. **Check README.md** - Additional documentation
3. **Check console** - Look for error messages
4. **Google the error** - Often already solved
5. **Open an issue** - Describe your problem

---

**Installation complete! Enjoy tracking your expenses! 💰**
