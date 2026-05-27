// ── CONFIG ──
const API_BASE = 'http://127.0.0.1:3333/api';
const API_KEY = 'mission-control-local';
const REFRESH_INTERVAL = 30000; // 30 seconds

// ── STATE ──
let currentScreen = 'home';
let agentsData = null;
let cronData = null;
let scriptsData = [];
let selectedScript = null;

// ── DOM ELEMENTS ──
const screens = {
  home: document.getElementById('screen-home'),
  office: document.getElementById('screen-office'),
  tasks: document.getElementById('screen-tasks'),
  calendar: document.getElementById('screen-calendar'),
  memory: document.getElementById('screen-memory'),
  scripts: document.getElementById('screen-scripts'),
  team: document.getElementById('screen-team')
};

const navItems = document.querySelectorAll('.nav-item');
const currentScreenLabel = document.getElementById('current-screen');

// ── NAVIGATION ──
navItems.forEach(item => {
  item.addEventListener('click', () => {
    const screen = item.dataset.screen;
    switchScreen(screen);
  });
});

function switchScreen(screen) {
  // Update nav
  navItems.forEach(item => item.classList.remove('active'));
  document.querySelector(`[data-screen="${screen}"]`).classList.add('active');
  
  // Update screens
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[screen].classList.add('active');
  
  // Update label
  const labels = {
    home: 'Mission Control',
    office: 'Visual Office',
    tasks: 'Tasks',
    calendar: 'Calendar',
    memory: 'Memory',
    scripts: 'Background Scripts',
    team: 'Team'
  };
  currentScreenLabel.textContent = labels[screen];
  
  currentScreen = screen;
  
  // Load screen-specific data
  if (screen === 'office') loadOffice();
  if (screen === 'tasks') loadTasks();
  if (screen === 'scripts') loadScripts();
  if (screen === 'team') loadTeam();
}

// ── API CALLS ──
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    return null;
  }
}

// ── LOAD AGENTS ──
async function loadAgents() {
  const data = await fetchAPI('/agents');
  if (data) {
    agentsData = data;
    return data;
  }
  return null;
}

// ── LOAD STATS ──
async function loadStats() {
  const data = await fetchAPI('/stats');
  if (!data) {
    document.getElementById('stats-grid').innerHTML = `
      <div class="stat-item">
        <div class="stat-value" style="color: var(--pink);">OFFLINE</div>
        <div class="stat-label">Backend Status</div>
      </div>
      <div class="stat-item">
        <div class="stat-value" style="color: var(--text-muted);">-</div>
        <div class="stat-label">Start backend to see data</div>
      </div>
    `;
    return;
  }
  
  const statsGrid = document.getElementById('stats-grid');
  statsGrid.innerHTML = `
    <div class="stat-item">
      <div class="stat-value" style="color: var(--green);">ONLINE</div>
      <div class="stat-label">Backend Status</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: var(--cyan);">${data.memory.percent}%</div>
      <div class="stat-label">Memory Used</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: var(--purple);">${data.cpu.cores}</div>
      <div class="stat-label">CPU Cores</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="color: var(--amber);">${data.uptime}</div>
      <div class="stat-label">System Uptime</div>
    </div>
  `;
}

// ── LOAD AGENT LIST ──
async function loadAgentList() {
  const data = await loadAgents();
  if (!data) return;
  
  const agentList = document.getElementById('agent-list');
  
  agentList.innerHTML = data.agents.map(agent => `
    <div class="agent-row" style="border-color: ${agent.color}33;">
      <div class="avatar" style="background: ${agent.color}22;">${agent.emoji}</div>
      <div class="info">
        <div class="name">${agent.name}</div>
        <div class="meta">${agent.role} • ${agent.model}</div>
      </div>
      <div class="status status-${agent.status}">
        ${agent.status === 'active' ? '● ' : ''}${agent.status.toUpperCase()}
      </div>
    </div>
  `).join('');
}

// ── LOAD TASKS ──
async function loadTaskList() {
  const data = await fetchAPI('/tasks');
  if (!data) return;
  
  const taskList = document.getElementById('task-list');
  
  taskList.innerHTML = data.slice(0, 5).map(task => `
    <div class="task-item">
      <div class="checkbox ${task.status === 'done' ? 'done' : ''}"></div>
      <div class="content">
        <div class="title ${task.status === 'done' ? 'done' : ''}">${task.title}</div>
        <div class="meta">${task.agent} • ${task.schedule}</div>
      </div>
      <div class="tag tag-${task.type}">${task.type}</div>
    </div>
  `).join('');
}

// ── LOAD EVENTS ──
async function loadEventList() {
  // Mock events for now - will be real data in Phase 2
  const events = [
    { time: '07:00', title: 'Morning Brief - Daily Calendar', type: 'cron' },
    { time: '11:00', title: 'Gmail + Calendar Check', type: 'cron' },
    { time: '12:00', title: 'Gmail + Calendar Check', type: 'cron' },
    { time: '13:00', title: 'Gmail + Calendar Check', type: 'cron' }
  ];
  
  const eventList = document.getElementById('event-list');
  
  eventList.innerHTML = events.map(event => `
    <div class="event-item">
      <div class="time">${event.time}</div>
      <div class="title">${event.title}</div>
      <div class="badge badge-${event.type === 'cron' ? 'active' : 'standby'}">${event.type}</div>
    </div>
  `).join('');
}

// ── LOAD VISUAL OFFICE ──
async function loadOffice() {
  const data = await loadAgents();
  if (!data) return;
  
  const officeGrid = document.getElementById('office-grid');
  
  officeGrid.innerHTML = data.rooms.map(room => {
    const roomAgents = data.agents.filter(a => room.agents.includes(a.id));
    
    return `
      <div class="room-card ${room.id}">
        <div class="room-label">${room.name}</div>
        
        <div class="room-agents">
          ${roomAgents.length > 0 
            ? roomAgents.map(agent => `
              <div class="mini-avatar ${agent.status}" 
                   style="background: ${agent.color}22;"
                   data-name="${agent.name}">
                ${agent.emoji}
                <div class="tooltip">${agent.name} - ${agent.status}</div>
              </div>
            `).join('')
            : '<span class="room-empty">Empty</span>'
          }
        </div>
        
        <div class="room-terminal">${room.terminal_output || 'Ready'}</div>
      </div>
    `;
  }).join('');
}

// ── LOAD TASKS SCREEN ──
async function loadTasks() {
  const data = await fetchAPI('/tasks');
  if (!data) return;
  
  const kanbanBoard = document.getElementById('kanban-board');
  
  const todo = data.filter(t => t.status === 'pending');
  const done = data.filter(t => t.status === 'done');
  
  kanbanBoard.innerHTML = `
    <div class="kanban-column todo">
      <h4>⏳ To Do (${todo.length})</h4>
      ${todo.map(task => `
        <div class="task-item" style="margin-bottom: 8px;">
          <div class="checkbox"></div>
          <div class="content">
            <div class="title">${task.title}</div>
            <div class="meta">${task.schedule}</div>
          </div>
          <div class="tag tag-${task.type}">${task.type}</div>
        </div>
      `).join('')}
    </div>
    
    <div class="kanban-column inprogress">
      <h4>🔵 In Progress (0)</h4>
      <div style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 20px;">
        No active tasks
      </div>
    </div>
    
    <div class="kanban-column done">
      <h4>✅ Done (${done.length})</h4>
      ${done.map(task => `
        <div class="task-item" style="margin-bottom: 8px; opacity: 0.7;">
          <div class="checkbox done"></div>
          <div class="content">
            <div class="title done">${task.title}</div>
            <div class="meta">${task.last_run || 'Completed'}</div>
          </div>
          <div class="tag tag-${task.type}">${task.type}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── LOAD TEAM SCREEN ──
async function loadTeam() {
  const data = await loadAgents();
  if (!data) return;
  
  const teamGrid = document.getElementById('team-grid');
  
  teamGrid.innerHTML = data.agents.map(agent => `
    <div class="team-card">
      <div class="header">
        <div class="avatar" style="background: ${agent.color}22;">
          ${agent.emoji}
        </div>
        <div class="info">
          <div class="name" style="color: ${agent.color};">${agent.name}</div>
          <div class="role">${agent.role}</div>
          <div class="model">${agent.model}</div>
        </div>
      </div>
      
      <div class="description">${agent.description}</div>
      
      <div class="skills">
        ${agent.skills.map(skill => `
          <span class="skill-tag">${skill}</span>
        `).join('')}
      </div>
      
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
        <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
          <span>Status: <span style="color: ${agent.status === 'active' || agent.status === 'online' ? 'var(--green)' : 'var(--amber)'};">${agent.status.toUpperCase()}</span></span>
          <span>Room: ${agent.room}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ── UPDATE TICKER ──
async function updateTicker() {
  const data = await loadAgents();
  if (!data) return;
  
  const tickerContent = document.getElementById('ticker-content');
  
  const items = data.agents.map(agent => {
    const timeAgo = agent.last_run 
      ? formatTimeAgo(new Date(agent.last_run))
      : 'never';
    const nextIn = agent.next_run
      ? formatTimeUntil(new Date(agent.next_run))
      : 'on-demand';
    
    return `
      <div class="ticker-item">
        <span class="ticker-name">${agent.name}:</span>
        <span class="ticker-status ${agent.status}">${agent.status.toUpperCase()}</span>
        <span class="ticker-time">(${timeAgo})</span>
        <span class="ticker-time">— next: ${nextIn}</span>
      </div>
      <span class="ticker-sep">•</span>
    `;
  }).join('');
  
  // Duplicate for seamless scroll
  tickerContent.innerHTML = items + items;
}

// ── TIME FORMATTERS ──
function formatTimeAgo(date) {
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatTimeUntil(date) {
  const now = new Date();
  const diff = Math.floor((date - now) / 1000);
  
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

// ── BACKGROUND SCRIPTS MONITOR ──

async function fetchScripts() {
  // Get real process data from backend
  const [pythonProcs, nodeProcs, psProcs, sysStats] = await Promise.all([
    fetchAPI('/scripts'),
    fetchAPI('/node-processes'),
    fetchAPI('/powershell-processes'),
    fetchAPI('/stats')
  ]);
  
  const allScripts = [];
  
  // Combine all process types
  if (pythonProcs) {
    pythonProcs.forEach(p => {
      allScripts.push({
        id: `python-${p.pid}`,
        name: p.name,
        description: p.commandLine || 'Python script',
        status: 'running',
        type: 'python',
        language: 'python',
        pid: p.pid,
        memory: p.memory,
        cpu: '-',
        uptime: '-',
        schedule: 'On demand',
        log: [
          { time: new Date().toISOString(), level: 'info', message: `Process running (PID: ${p.pid})` }
        ]
      });
    });
  }
  
  if (nodeProcs) {
    nodeProcs.forEach(p => {
      allScripts.push({
        id: `node-${p.pid}`,
        name: p.name,
        description: 'Node.js process',
        status: 'running',
        type: 'service',
        language: 'node',
        pid: p.pid,
        memory: p.memory,
        cpu: '-',
        uptime: '-',
        schedule: 'Continuous',
        log: [
          { time: new Date().toISOString(), level: 'info', message: `Node process running (PID: ${p.pid})` }
        ]
      });
    });
  }
  
  if (psProcs) {
    psProcs.forEach(p => {
      allScripts.push({
        id: `ps-${p.pid}`,
        name: p.name,
        description: 'PowerShell script',
        status: 'running',
        type: 'cron',
        language: 'powershell',
        pid: p.pid,
        memory: p.memory,
        cpu: '-',
        uptime: '-',
        schedule: 'On demand',
        log: [
          { time: new Date().toISOString(), level: 'info', message: `PowerShell running (PID: ${p.pid})` }
        ]
      });
    });
  }
  
  // Add system info as a "script"
  if (sysStats) {
    allScripts.unshift({
      id: 'system-info',
      name: 'System Monitor',
      description: `System uptime: ${sysStats.uptime}`,
      status: 'running',
      type: 'service',
      language: 'node',
      pid: process.pid || 0,
      memory: sysStats.memory?.used || '0 MB',
      cpu: sysStats.cpu?.loadAvg?.[0] || '0%',
      uptime: sysStats.uptime || '-',
      schedule: 'Continuous',
      log: [
        { time: new Date().toISOString(), level: 'info', message: `Memory: ${sysStats.memory?.percent}% used (${sysStats.memory?.used})` },
        { time: new Date().toISOString(), level: 'info', message: `CPU Load: ${sysStats.cpu?.loadAvg?.join(', ')}` }
      ]
    });
  }
  
  return allScripts;
}

async function loadScripts() {
  const data = await fetchScripts();
  scriptsData = data;
  
  renderScriptsStats(data);
  renderScriptsGrid(data);
}

function renderScriptsStats(scripts) {
  const stats = document.getElementById('scripts-stats');
  const running = scripts.filter(s => s.status === 'running').length;
  const stopped = scripts.filter(s => s.status === 'stopped').length;
  const totalMemory = scripts.filter(s => s.memory !== '-').reduce((acc, s) => acc + parseInt(s.memory), 0);
  
  stats.innerHTML = `
    <div class="script-stat-item">
      <div class="script-stat-value" style="color: var(--green);">${running}</div>
      <div class="script-stat-label">Running</div>
    </div>
    <div class="script-stat-item">
      <div class="script-stat-value" style="color: var(--amber);">${stopped}</div>
      <div class="script-stat-label">Stopped</div>
    </div>
    <div class="script-stat-item">
      <div class="script-stat-value" style="color: var(--cyan);">${scripts.length}</div>
      <div class="script-stat-label">Total</div>
    </div>
    <div class="script-stat-item">
      <div class="script-stat-value" style="color: var(--purple);">${totalMemory}MB</div>
      <div class="script-stat-label">Memory Used</div>
    </div>
  `;
}

function renderScriptsGrid(scripts) {
  const grid = document.getElementById('scripts-grid');
  const filter = document.getElementById('script-filter')?.value || 'all';
  
  let filtered = scripts;
  if (filter === 'running') filtered = scripts.filter(s => s.status === 'running');
  if (filter === 'stopped') filtered = scripts.filter(s => s.status === 'stopped');
  if (filter === 'cron') filtered = scripts.filter(s => s.type === 'cron');
  if (filter === 'python') filtered = scripts.filter(s => s.language === 'python');
  if (filter === 'powershell') filtered = scripts.filter(s => s.language === 'powershell');
  
  grid.innerHTML = filtered.map(script => `
    <div class="script-card ${script.status}" onclick="selectScript('${script.id}')">
      <div class="script-header">
        <div class="script-icon">${getScriptIcon(script.language)}</div>
        <div class="script-title">${script.name}</div>
        <div class="script-status status-${script.status}">
          ${script.status === 'running' ? '● ' : ''}${script.status.toUpperCase()}
        </div>
      </div>
      
      <div class="script-body">
        <div class="script-description">${script.description}</div>
        
        <div class="script-meta">
          <span class="script-badge badge-type">${script.type}</span>
          <span class="script-badge badge-lang">${script.language}</span>
          ${script.pid ? `<span class="script-badge badge-pid">PID: ${script.pid}</span>` : ''}
        </div>
        
        <div class="script-metrics">
          <div class="metric">
            <span class="metric-label">Uptime</span>
            <span class="metric-value">${script.uptime}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Memory</span>
            <span class="metric-value">${script.memory}</span>
          </div>
          <div class="metric">
            <span class="metric-label">CPU</span>
            <span class="metric-value">${script.cpu}</span>
          </div>
        </div>
        
        <div class="script-schedule">
          <span class="schedule-label">📅</span>
          <span>${script.schedule}</span>
          ${script.nextRun ? `<span class="next-run">Next: ${formatTime(script.nextRun)}</span>` : ''}
        </div>
      </div>
      
      <div class="script-actions">
        <button class="btn-script-action" onclick="event.stopPropagation(); toggleScript('${script.id}')"
                ${script.status === 'running' ? 'title="Stop"' : 'title="Start"'}>
          ${script.status === 'running' ? '⏹️' : '▶️'}
        </button>
        <button class="btn-script-action" onclick="event.stopPropagation(); restartScript('${script.id}')" title="Restart">
          🔄
        </button>
        <button class="btn-script-action" onclick="event.stopPropagation(); viewScriptLog('${script.id}')" title="View Log">
          📜
        </button>
      </div>
    </div>
  `).join('');
}

function getScriptIcon(language) {
  const icons = {
    python: '🐍',
    node: '⬢',
    powershell: '⚡',
    bash: '🐚',
    default: '📄'
  };
  return icons[language] || icons.default;
}

function formatTime(isoString) {
  if (!isoString) return '-';
  const date = new Date(isoString);
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

function selectScript(scriptId) {
  selectedScript = scriptsData.find(s => s.id === scriptId);
  if (selectedScript) {
    viewScriptLog(scriptId);
  }
}

function viewScriptLog(scriptId) {
  const script = scriptsData.find(s => s.id === scriptId);
  if (!script) return;
  
  const logContent = document.getElementById('log-content');
  
  logContent.innerHTML = `
    <div class="log-script-info">
      <strong>${script.name}</strong> - ${script.description}
    </div>
    ${script.log.map(entry => `
      <div class="log-entry log-${entry.level}">
        <span class="log-time">${formatTime(entry.time)}</span>
        <span class="log-level">${entry.level.toUpperCase()}</span>
        <span class="log-message">${entry.message}</span>
      </div>
    `).join('')}
  `;
}

function clearLog() {
  const logContent = document.getElementById('log-content');
  logContent.innerHTML = '<div class="log-placeholder">Select a script to view output</div>';
  selectedScript = null;
}

function filterScripts() {
  renderScriptsGrid(scriptsData);
}

async function toggleScript(scriptId) {
  const script = scriptsData.find(s => s.id === scriptId);
  if (!script) return;
  
  console.log(`${script.status === 'running' ? 'Stopping' : 'Starting'} script: ${script.name}`);
  
  // Mock toggle - in real implementation, call API
  script.status = script.status === 'running' ? 'stopped' : 'running';
  script.pid = script.status === 'running' ? Math.floor(Math.random() * 100000) : null;
  script.uptime = script.status === 'running' ? '0m' : '-';
  
  renderScriptsGrid(scriptsData);
  renderScriptsStats(scriptsData);
}

async function restartScript(scriptId) {
  console.log(`Restarting script: ${scriptId}`);
  await toggleScript(scriptId);
  setTimeout(() => toggleScript(scriptId), 1000);
}

// ── REFRESH ──
async function refreshData() {
  console.log('🔄 Refreshing data...');
  
  await Promise.all([
    loadStats(),
    loadAgentList(),
    loadTaskList(),
    loadEventList()
  ]);
  
  if (currentScreen === 'office') loadOffice();
  if (currentScreen === 'tasks') loadTasks();
  if (currentScreen === 'scripts') loadScripts();
  if (currentScreen === 'team') loadTeam();
  
  updateTicker();
}

// ── INIT ──
async function init() {
  console.log('🚀 Mission Control initializing...');
  
  await refreshData();
  
  // Auto-refresh every 30 seconds
  setInterval(refreshData, REFRESH_INTERVAL);
  
  console.log('✅ Mission Control ready!');
}

// Start when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}