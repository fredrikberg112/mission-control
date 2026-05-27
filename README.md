# 🚀 Mission Control Dashboard

A local dashboard for monitoring your OpenClaw setup, background scripts, and system resources.

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │◄────►│  Backend (Local)  │◄────►│  Your System    │
│  (GitHub Pages) │      │  (Port 3333)      │      │  (Processes)    │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                           │
         │    CORS Restricted        │
         │    API Key Secured        │
         │                           │
    Public Access              Localhost Only
```

## 🔒 Security

- **CORS**: Only allows requests from localhost origins
- **API Key**: Required header `x-api-key: mission-control-local`
- **Command Whitelist**: Only specific system commands allowed
- **Local Only**: Backend binds to 127.0.0.1 (not accessible from network)

## 🚀 Quick Start

### 1. Start the Backend

```bash
cd backend
npm install
node server.js
```

Or on Windows:
```
cd backend
start.bat
```

### 2. Open the Frontend

Open `index.html` in your browser, or use Live Server in VS Code.

### 3. Verify Connection

The dashboard should show:
- ✅ Backend Status: ONLINE
- 📊 Memory usage
- 💻 CPU cores
- ⏱️ System uptime

## 📡 API Endpoints

All endpoints require header: `x-api-key: mission-control-local`

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | System memory, CPU, uptime |
| `GET /api/processes` | Running processes (tasklist) |
| `GET /api/scripts` | Python scripts running |
| `GET /api/node-processes` | Node.js processes |
| `GET /api/powershell-processes` | PowerShell processes |
| `GET /api/disk` | Disk usage |
| `GET /api/network` | Network interfaces |
| `POST /api/exec` | Execute whitelisted command |
| `POST /api/kill/:pid` | Kill a process |

## 🖥️ Installing as Windows Service

Run as Administrator:

```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force
.\backend\install-service.ps1
```

This will:
- Create a Windows service "MissionControlBackend"
- Auto-start on boot
- Run in background

## 🛠️ Development

### Frontend
```bash
cd mission-control
# Open with Live Server or any static file server
```

### Backend
```bash
cd backend
npm run dev
```

## 📁 File Structure

```
mission-control/
├── index.html          # Frontend entry
├── app.js              # Frontend logic
├── styles.css          # Styling
├── backend/
│   ├── server.js       # Express API
│   ├── package.json    # Dependencies
│   ├── start.bat       # Windows start script
│   └── install-service.ps1  # Service installer
└── README.md
```

## 🐛 Troubleshooting

**Backend won't start**
- Check if port 3333 is in use: `netstat -ano | findstr 3333`
- Make sure Node.js is installed: `node --version`

**Frontend shows OFFLINE**
- Backend is not running
- Check browser console for CORS errors
- Verify API key is correct

**Can't see processes**
- Windows: Run as Administrator for full process list
- Some processes may be protected by Windows

## 📝 License

MIT
