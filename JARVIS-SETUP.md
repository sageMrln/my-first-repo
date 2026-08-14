# Jarvis runtime setup — ASUS TUF A15 (RTX 2060 6GB)

Gets Python + GPU ready and **proven**. No Jarvis application code here.

## Step 0 — get a local Claude Code session

These scripts must run on the laptop. A cloud session (claude.ai/code) runs in
a Linux container with no GPU and no `C:\`, so it cannot do this work.

Open PowerShell on the laptop:

```powershell
# Node 18+ required; get it from https://nodejs.org if `node -v` fails
npm install -g @anthropic-ai/claude-code

git clone https://github.com/sagemrln/my-first-repo C:\Jarvis-setup
cd C:\Jarvis-setup
git checkout claude/jarvis-python-gpu-setup-7n1vs3

claude
```

First launch prompts for browser sign-in. After that you have a session with
real access to the machine — GPU, drives, PATH, all of it.

## Step 1 — run the setup

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-jarvis.ps1
```

`-ExecutionPolicy Bypass` applies to that single invocation. It does not
change any machine-wide security setting.

The script picks Python 3.12 or 3.11 (never 3.14 — ctranslate2 wheels lag),
creates `C:\Jarvis\venv`, checks the driver, pulls the Ollama models, and
installs the speech stack into the venv only.

## Step 2 — prove it

```powershell
C:\Jarvis\venv\Scripts\python.exe verify_gpu.py
```

This is the step that matters. pip succeeding does not mean CUDA loads.
Expect a pass/fail table; exit code 1 if anything failed.

## VRAM budget — read this

6GB is the binding constraint on this build.

| Component | VRAM |
|---|---|
| llama3.2:3b (Q4) | ~2.5 GB |
| faster-whisper small.en fp16 | ~0.5 GB |
| Windows desktop | ~0.7 GB |
| **Working total** | **~3.7 GB** |

`qwen2.5-coder:7b` is ~4.7GB and will **not** co-reside with the 3b. Treat it
as a swap-in: Ollama unloads the 3b first, serves the coder model, then
reloads. Forcing both resident causes CPU offload and a large latency hit.

Tune the unload delay with `OLLAMA_KEEP_ALIVE` (default 5m).

## Known failure — cuDNN DLL not found

The most common Windows failure. `nvidia-cudnn-cu12` ships the DLLs under
`site-packages\nvidia\**\bin`, but nothing adds that to the DLL search path,
so `device="cuda"` dies with `Library cudnn_ops_infer64_8.dll is not found`.

`verify_gpu.py` handles this with `os.add_dll_directory()` before importing
faster_whisper. Any code that loads a Whisper model needs the same shim —
it is the `add_nvidia_dlls()` function at the top of that file.
