const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

const app = express();
const PORT = process.env.PORT || 3333;

// Security: Only allow localhost
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'http://127.0.0.1:3000', 'null'],
  credentials: true
}));

app.use(express.json());

// Security: Simple API key check
const API_KEY = process.env.MC_API_KEY || 'mission-control-local';
app.use((req, res, next) => {
  const key = req.headers['x-api-key'] || req.query.key;
  if (key !== API_KEY && req.path !== '/') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});

// ── HELPERS ──

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '-';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

// ── API ENDPOINTS ──

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Mission Control Backend',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

// Get system stats
app.get('/api/stats', async (req, res) => {
  try {
    // Get memory info
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const usedMem = totalMem - freeMem;
    
    // Get CPU info
    const cpus = require('os').cpus();
    const cpuModel = cpus[0].model;
    const cpuCount = cpus.length;
    
    // Get load average (Windows doesn't have this, simulate)
    const loadAvg = require('os').loadavg ? require('os').loadavg() : [0, 0, 0];
    
    res.json({
      memory: {
        total: formatBytes(totalMem),
        used: formatBytes(usedMem),
        free: formatBytes(freeMem),
        percent: Math.round((usedMem / totalMem) * 100)
      },
      cpu: {
        model: cpuModel,
        cores: cpuCount,
        loadAvg: loadAvg.map(v => v.toFixed(2))
      },
      platform: require('os').platform(),
      hostname: require('os').hostname(),
      uptime: formatDuration(Math.floor(require('os').uptime()))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get running processes
app.get('/api/processes', async (req, res) => {
  try {
    // Use tasklist for Windows
    const { stdout } = await execAsync('tasklist /FO CSV /NH');
    
    const processes = stdout.split('\n')
      .filter(line => line.trim())
      .map(line => {
        const parts = line.replace(/"/g, '').split(',');
        return {
          name: parts[0]?.trim() || 'Unknown',
          pid: parseInt(parts[1]) || 0,
          sessionName: parts[2]?.trim() || '',
          sessionNum: parts[3]?.trim() || '',
          memory: parts[4]?.trim() || '0 K'
        };
      })
      .filter(p => p.name !== 'Unknown')
      .slice(0, 100); // Limit to top 100
    
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Python scripts running
app.get('/api/scripts', async (req, res) => {
  try {
    const { stdout } = await execAsync('tasklist /FO CSV /NH /FI "IMAGENAME eq python.exe"');
    
    const scripts = [];
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.replace(/"/g, '').split(',');
      const pid = parseInt(parts[1]);
      if (!pid) continue;
      
      // Try to get command line for this process
      let cmdLine = '';
      try {
        const { stdout: wmic } = await execAsync(`wmic process where processid=${pid} get CommandLine /format:list`);
        const match = wmic.match(/CommandLine=(.+)/);
        cmdLine = match ? match[1].trim() : '';
      } catch (e) {
        cmdLine = 'Unknown';
      }
      
      scripts.push({
        name: parts[0]?.trim() || 'python.exe',
        pid: pid,
        memory: parts[4]?.trim() || '0 K',
        commandLine: cmdLine.substring(0, 200), // Truncate
        status: 'running'
      });
    }
    
    res.json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Node.js processes
app.get('/api/node-processes', async (req, res) => {
  try {
    const { stdout } = await execAsync('tasklist /FO CSV /NH /FI "IMAGENAME eq node.exe"');
    
    const processes = [];
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.replace(/"/g, '').split(',');
      const pid = parseInt(parts[1]);
      if (!pid) continue;
      
      processes.push({
        name: parts[0]?.trim() || 'node.exe',
        pid: pid,
        memory: parts[4]?.trim() || '0 K',
        status: 'running'
      });
    }
    
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get PowerShell processes
app.get('/api/powershell-processes', async (req, res) => {
  try {
    const { stdout } = await execAsync('tasklist /FO CSV /NH /FI "IMAGENAME eq powershell.exe"');
    
    const processes = [];
    const lines = stdout.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.replace(/"/g, '').split(',');
      const pid = parseInt(parts[1]);
      if (!pid) continue;
      
      processes.push({
        name: parts[0]?.trim() || 'powershell.exe',
        pid: pid,
        memory: parts[4]?.trim() || '0 K',
        status: 'running'
      });
    }
    
    res.json(processes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all background tasks/scripts info
app.get('/api/background-tasks', async (req, res) => {
  try {
    // Combine different process types
    const tasks = [];
    
    // Check for Python scripts
    try {
      const { stdout: py } = await execAsync('tasklist /FO CSV /NH /FI "IMAGENAME eq python.exe"');
      py.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.replace(/"/g, '').split(',');
        const pid = parseInt(parts[1]);
        if (pid) {
          tasks.push({
            id: `python-${pid}`,
            name: 'Python Script',
            description: parts[0]?.trim() || 'python.exe',
            status: 'running',
            type: 'python',
            pid: pid,
            memory: parts[4]?.trim() || '0 K',
            uptime: '-'
          });
        }
      });
    } catch (e) {}
    
    // Check for Node processes
    try {
      const { stdout: node } = await execAsync('tasklist /FO CSV /NH /FI "IMAGENAME eq node.exe"');
      node.split('\n').filter(l => l.trim()).forEach(line => {
        const parts = line.replace(/"/g, '').split(',');
        const pid = parseInt(parts[1]);
        if (pid) {
          tasks.push({
            id: `node-${pid}`,
            name: 'Node.js Process',
            description: 'Node.js runtime',
            status: 'running',
            type: 'node',
            pid: pid,
            memory: parts[4]?.trim() || '0 K',
            uptime: '-'
          });
        }
      });
    } catch (e) {}
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get disk usage
app.get('/api/disk', async (req, res) => {
  try {
    const { stdout } = await execAsync('wmic logicaldisk get size,freespace,caption /format:csv');
    
    const disks = [];
    const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('Node'));
    
    for (const line of lines) {
      const parts = line.split(',');
      if (parts.length >= 4) {
        const caption = parts[1]?.trim();
        const freeSpace = parseInt(parts[2]);
        const size = parseInt(parts[3]);
        
        if (caption && size > 0) {
          disks.push({
            drive: caption,
            total: formatBytes(size),
            free: formatBytes(freeSpace),
            used: formatBytes(size - freeSpace),
            percent: Math.round(((size - freeSpace) / size) * 100)
          });
        }
      }
    }
    
    res.json(disks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get network info
app.get('/api/network', async (req, res) => {
  try {
    const { stdout } = await execAsync('ipconfig /all');
    
    const interfaces = [];
    const sections = stdout.split('\r\n\r\n');
    
    for (const section of sections) {
      if (section.includes('Ethernet') || section.includes('Wi-Fi')) {
        const nameMatch = section.match(/Ethernet adapter (.+?):|Wireless LAN adapter (.+?):/);
        const name = nameMatch ? (nameMatch[1] || nameMatch[2]) : 'Unknown';
        
        const ipMatch = section.match(/IPv4 Address.+?:\s+([\d.]+)/);
        const ip = ipMatch ? ipMatch[1] : 'N/A';
        
        const macMatch = section.match(/Physical Address.+?:\s+([\w-]+)/);
        const mac = macMatch ? macMatch[1] : 'N/A';
        
        interfaces.push({ name: name.trim(), ip, mac });
      }
    }
    
    res.json(interfaces);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Execute a command (restricted)
app.post('/api/exec', async (req, res) => {
  try {
    const { command } = req.body;
    
    // Whitelist allowed commands for security
    const allowedCommands = [
      /^tasklist/,
      /^wmic/,
      /^ipconfig/,
      /^systeminfo/,
      /^whoami/,
      /^hostname/
    ];
    
    const isAllowed = allowedCommands.some(pattern => pattern.test(command));
    if (!isAllowed) {
      return res.status(403).json({ error: 'Command not allowed' });
    }
    
    const { stdout, stderr } = await execAsync(command, { timeout: 30000 });
    
    res.json({ 
      stdout: stdout.substring(0, 10000), // Limit output
      stderr: stderr.substring(0, 5000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kill a process
app.post('/api/kill/:pid', async (req, res) => {
  try {
    const pid = parseInt(req.params.pid);
    if (!pid || pid < 0) {
      return res.status(400).json({ error: 'Invalid PID' });
    }
    
    // Safety: Don't kill system processes
    if (pid < 100) {
      return res.status(403).json({ error: 'Cannot kill system process' });
    }
    
    await execAsync(`taskkill /PID ${pid} /F`);
    res.json({ success: true, message: `Process ${pid} killed` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs from a specific script
app.get('/api/logs/:scriptName', async (req, res) => {
  try {
    const scriptName = req.params.scriptName;
    const logPath = path.join('C:', 'Users', 'fredr', '.openclaw', 'workspace', 'logs', `${scriptName}.log`);
    
    if (!fs.existsSync(logPath)) {
      return res.json({ logs: [], message: 'No logs found' });
    }
    
    const logs = fs.readFileSync(logPath, 'utf-8')
      .split('\n')
      .filter(line => line.trim())
      .slice(-50) // Last 50 lines
      .map(line => ({
        time: new Date().toISOString(),
        level: 'info',
        message: line
      }));
    
    res.json({ logs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── ERROR HANDLING ──

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── START SERVER ──

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Mission Control Backend running on http://127.0.0.1:${PORT}`);
  console.log(`🔒 Security: Only localhost allowed`);
  console.log(`📊 API Key: ${API_KEY}`);
});

module.exports = app;
