# Install Mission Control Backend as Windows Service
# Requires Administrator privileges

$serviceName = "MissionControlBackend"
$displayName = "Mission Control Backend"
$description = "Secure backend API for Mission Control dashboard"

$backendPath = "C:\Users\fredr\.openclaw\workspace\mission-control\backend"
$nodePath = "C:\Program Files\nodejs\node.exe"
$serverScript = Join-Path $backendPath "server.js"

# Check if running as admin
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Error "Please run this script as Administrator!"
    exit 1
}

# Check if Node.js exists
if (-Not (Test-Path $nodePath)) {
    # Try to find node in PATH
    $nodeInPath = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeInPath) {
        $nodePath = $nodeInPath.Source
    } else {
        Write-Error "Node.js not found! Please install Node.js first."
        exit 1
    }
}

# Remove existing service if exists
$existingService = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($existingService) {
    Write-Host "Removing existing service..."
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    sc.exe delete $serviceName | Out-Null
    Start-Sleep -Seconds 2
}

# Create service using nssm (Non-Sucking Service Manager) if available, otherwise use sc.exe
$nssmPath = Join-Path $backendPath "nssm.exe"
if (Test-Path $nssmPath) {
    # Use nssm for better control
    & $nssmPath install $serviceName $nodePath $serverScript
    & $nssmPath set $serviceName DisplayName $displayName
    & $nssmPath set $serviceName Description $description
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    & $nssmPath set $serviceName AppDirectory $backendPath
    & $nssmPath set $serviceName AppEnvironmentExtra "MC_API_KEY=mission-control-local"
} else {
    # Use sc.exe (less flexible but built-in)
    $binPath = `"$nodePath`" `"$serverScript`"
    sc.exe create $serviceName binPath= $binPath start= auto DisplayName= `"$displayName`"
    sc.exe description $serviceName `"$description`"
}

# Start the service
Start-Service -Name $serviceName -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Mission Control Backend service installed!"
Write-Host "   Service Name: $serviceName"
Write-Host "   Node.js Path: $nodePath"
Write-Host "   Script Path: $serverScript"
Write-Host "   API URL: http://127.0.0.1:3333"
Write-Host ""
Write-Host "To start manually: net start $serviceName"
Write-Host "To stop: net stop $serviceName"
Write-Host "To uninstall: sc.exe delete $serviceName"
