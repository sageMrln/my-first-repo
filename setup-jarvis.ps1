<#
    Jarvis runtime setup - Python + GPU, no application code.

    Creates C:\Jarvis, a dedicated venv, installs the speech/audio stack,
    and pulls the Ollama models. Proves nothing on its own - run
    verify_gpu.py afterwards for that.

    Usage:  powershell -ExecutionPolicy Bypass -File .\setup-jarvis.ps1

    Does not touch system Python and does not change Windows security
    settings. -ExecutionPolicy Bypass applies to this one invocation only.
#>

$ErrorActionPreference = 'Stop'

$JarvisRoot = 'C:\Jarvis'
$VenvPath   = Join-Path $JarvisRoot 'venv'
$VenvPython = Join-Path $VenvPath 'Scripts\python.exe'

function Step($n, $msg) { Write-Host "`n[$n] $msg" -ForegroundColor Cyan }
function Ok($msg)       { Write-Host "    OK  $msg" -ForegroundColor Green }
function Warn($msg)     { Write-Host "    !!  $msg" -ForegroundColor Yellow }

# ---------------------------------------------------------------- 1. Python
Step 1 'Checking Python'

$pythonExe = $null
foreach ($candidate in @('py -3.12', 'py -3.11', 'python')) {
    $parts = $candidate -split ' '
    try {
        $ver = & $parts[0] $parts[1..($parts.Length - 1)] --version 2>&1
    } catch { continue }
    if ($LASTEXITCODE -ne 0) { continue }

    Write-Host "    found: $ver  (via '$candidate')"
    if ($ver -match '3\.(11|12)\.') {
        $pythonExe = $candidate
        break
    }
}

if (-not $pythonExe) {
    Warn 'No Python 3.11 or 3.12 found.'
    Warn 'faster-whisper/ctranslate2 wheels are unreliable outside 3.11/3.12.'
    Warn 'Install 3.12 from https://www.python.org/downloads/release/python-3129/'
    Warn '(check "Add python.exe to PATH"), then re-run this script.'
    exit 1
}
Ok "using $pythonExe for the venv"

# ------------------------------------------------------------------ 2. venv
Step 2 "Creating $JarvisRoot and venv"

New-Item -ItemType Directory -Force -Path $JarvisRoot | Out-Null

if (Test-Path $VenvPython) {
    Ok 'venv already exists, reusing'
} else {
    $parts = $pythonExe -split ' '
    & $parts[0] $parts[1..($parts.Length - 1)] -m venv $VenvPath
    if (-not (Test-Path $VenvPython)) { throw "venv creation failed at $VenvPath" }
    Ok "created $VenvPath"
}

& $VenvPython -m pip install --upgrade pip --quiet
Ok "venv python: $(& $VenvPython --version)"

# --------------------------------------------------------------- 3. GPU/driver
Step 3 'Checking NVIDIA driver'

$smi = Get-Command nvidia-smi -ErrorAction SilentlyContinue
if (-not $smi) {
    Warn 'nvidia-smi not found. Install the NVIDIA driver for the RTX 2060:'
    Warn '  https://www.nvidia.com/Download/index.aspx'
    Warn 'Reboot, then re-run this script.'
    exit 1
}

$smiOut = & nvidia-smi
$smiOut | Write-Host
if ($smiOut -match '2060') {
    Ok 'RTX 2060 detected'
} else {
    Warn 'nvidia-smi ran but no RTX 2060 in the output - check the driver.'
}

# ---------------------------------------------------------------- 4. Ollama
Step 4 'Pulling Ollama models'

if (-not (Get-Command ollama -ErrorAction SilentlyContinue)) {
    Warn 'ollama not found on PATH. Install from https://ollama.com/download'
    exit 1
}

# llama3.2:3b (~2GB) is the always-loaded conversational model.
# qwen2.5-coder:7b (~4.7GB) will NOT co-reside with it on a 6GB card -
# it is a swap-in, pulled here so it is on disk when needed.
& ollama pull llama3.2:3b
Ok 'llama3.2:3b pulled'

& ollama pull qwen2.5-coder:7b
Ok 'qwen2.5-coder:7b pulled (on-demand only - see VRAM note in README)'

Write-Host "`n    warming llama3.2:3b so nvidia-smi can see it..."
& ollama run llama3.2:3b 'say hi'

Write-Host "`n    VRAM while loaded:"
& nvidia-smi --query-compute-apps=pid,process_name,used_memory --format=csv

# ------------------------------------------------------------- 5. pip installs
Step 5 'Installing Python packages into the venv'

$packages = @(
    'faster-whisper',
    'nvidia-cublas-cu12',
    'nvidia-cudnn-cu12',
    'sounddevice',
    'soundfile',
    'numpy',
    'requests'
)
& $VenvPython -m pip install @packages
Ok 'packages installed'

# ------------------------------------------------------------------- 6. done
Step 6 'Setup complete'
Write-Host @"

Next, prove the GPU path actually works:

    $VenvPython verify_gpu.py

That is the step that matters - pip succeeding does not mean CUDA loads.
"@ -ForegroundColor Cyan
