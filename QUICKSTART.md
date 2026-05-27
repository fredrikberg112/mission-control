# 🚀 Mission Control - Quick Start

## Step 1: Start Backend (one time setup)

Open PowerShell in `mission-control/backend` folder and run:

```powershell
npm install
node server.js
```

Or double-click `start.bat`

## Step 2: Open Dashboard

Open `mission-control/index.html` in your browser.

That's it! The dashboard will connect to your local backend.

## Optional: Auto-start on Windows boot

Run as Administrator:
```powershell
powershell -ExecutionPolicy Bypass -File install-service.ps1
```

## 🔒 Security

- Backend only accepts connections from localhost
- API key required: `mission-control-local`
- No external access possible

## 📊 What You'll See

- Real-time system stats (memory, CPU, uptime)
- Running Python scripts with PIDs
- Node.js processes
- PowerShell scripts
- Can start/stop/restart scripts
- View script logs
