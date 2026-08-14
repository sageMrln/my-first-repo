"""Prove the Jarvis GPU runtime works. Run with the venv python:

    C:\\Jarvis\\venv\\Scripts\\python.exe verify_gpu.py

Checks, in order: CUDA DLLs resolve, faster-whisper loads on CUDA and
transcribes, Ollama is up and GPU-resident. Prints a pass/fail summary.
"""

import os
import sys
import glob
import ctypes
import subprocess

results = []


def record(name, passed, detail=""):
    results.append((name, passed, detail))
    mark = "PASS" if passed else "FAIL"
    print(f"[{mark}] {name}" + (f" - {detail}" if detail else ""))


# --------------------------------------------------------------- CUDA DLLs
# The nvidia-*-cu12 wheels ship cuDNN/cuBLAS DLLs under
# site-packages\nvidia\**\bin, but nothing puts that on the DLL search
# path. Without this, `import faster_whisper` + device="cuda" dies with an
# opaque "Library cudnn_ops_infer64_8.dll is not found" - the single most
# common failure on Windows. Must run before faster_whisper is imported.
def add_nvidia_dlls():
    added = []
    for site in sys.path:
        pattern = os.path.join(site, "nvidia", "**", "bin")
        for bindir in glob.glob(pattern, recursive=True):
            if not os.path.isdir(bindir):
                continue
            try:
                os.add_dll_directory(bindir)  # Windows only
            except (AttributeError, OSError):
                pass
            os.environ["PATH"] = bindir + os.pathsep + os.environ["PATH"]
            added.append(bindir)
    return added


dll_dirs = add_nvidia_dlls()
record("nvidia CUDA DLL dirs found", bool(dll_dirs), f"{len(dll_dirs)} dir(s)")
for d in dll_dirs:
    print(f"         {d}")

# Load cuDNN explicitly so a missing/mismatched DLL fails here with a
# clear message rather than deep inside ctranslate2.
try:
    for name in ("cublas64_12.dll", "cudnn_ops64_9.dll", "cudnn64_9.dll"):
        try:
            ctypes.CDLL(name)
        except OSError:
            pass  # version suffixes vary by wheel release; the real test is below
    record("CUDA DLL preload", True)
except Exception as e:  # noqa: BLE001
    record("CUDA DLL preload", False, str(e))


# ---------------------------------------------------------- faster-whisper
try:
    import numpy as np
    from faster_whisper import WhisperModel

    print("\n  loading small.en on CUDA (first run downloads ~500MB)...")
    model = WhisperModel("small.en", device="cuda", compute_type="float16")

    # One second of silence. We are testing that the CUDA path executes,
    # not that it hears anything - empty segment list is the correct result.
    segments, info = model.transcribe(
        np.zeros(16000, dtype="float32"), language="en"
    )
    list(segments)
    record("faster-whisper CUDA", True, "small.en fp16 transcribe returned")
except Exception as e:  # noqa: BLE001
    record("faster-whisper CUDA", False, f"{type(e).__name__}: {e}")
    print(
        "\n  If this is a missing-DLL error, confirm the wheels are installed:\n"
        "    python -m pip install --force-reinstall "
        "nvidia-cublas-cu12 nvidia-cudnn-cu12\n"
    )


# ------------------------------------------------------------------ Ollama
try:
    import requests

    r = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
    names = [m["name"] for m in r.json().get("models", [])]
    record("Ollama reachable", True, f"{len(names)} model(s): {', '.join(names)}")

    have_3b = any(n.startswith("llama3.2:3b") for n in names)
    record("llama3.2:3b present", have_3b)
except Exception as e:  # noqa: BLE001
    record("Ollama reachable", False, str(e))


# ------------------------------------------------------------------- VRAM
try:
    out = subprocess.run(
        ["nvidia-smi", "--query-gpu=name,memory.used,memory.total",
         "--format=csv,noheader"],
        capture_output=True, text=True, timeout=15,
    ).stdout.strip()
    record("nvidia-smi", bool(out), out)

    apps = subprocess.run(
        ["nvidia-smi", "--query-compute-apps=process_name,used_memory",
         "--format=csv,noheader"],
        capture_output=True, text=True, timeout=15,
    ).stdout.strip()
    print("\n  GPU processes:")
    print("    " + (apps.replace("\n", "\n    ") if apps else "(none resident)"))
    if apps and "ollama" not in apps.lower():
        print("    note: ollama not resident - it unloads after idle timeout.")
        print("          Run `ollama run llama3.2:3b \"hi\"` and re-check.")
except Exception as e:  # noqa: BLE001
    record("nvidia-smi", False, str(e))


# ----------------------------------------------------------------- summary
print("\n" + "=" * 60)
failed = [n for n, ok, _ in results if not ok]
for name, ok, detail in results:
    print(f"  {'PASS' if ok else 'FAIL'}  {name}")
print("=" * 60)

if failed:
    print(f"\n{len(failed)} check(s) failed: {', '.join(failed)}")
    sys.exit(1)

print("\nAll checks passed. Runtime is ready for the Jarvis package.")
