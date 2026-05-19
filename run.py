from pathlib import Path
import os
import subprocess
import sys

ROOT = Path(__file__).resolve().parent
VENV = ROOT / ".venv"
PY = VENV / "bin" / "python"

if not VENV.exists():
    subprocess.check_call([sys.executable, "-m", "venv", str(VENV)])

subprocess.check_call([sys.executable, "-m", "pip", "install", "--break-system-packages", "-q", "-r", str(ROOT / "backend" / "requirements.txt")])

backend = subprocess.Popen([
    str(PY), "-m", "uvicorn", "backend.server:app", "--host", "0.0.0.0", "--port", "8000"
], cwd=str(ROOT), env={**os.environ, "PYTHONPATH": str(ROOT / "backend")})

try:
    subprocess.check_call(["bun", "install", "--no-save"], cwd=str(ROOT / "frontend"))
    subprocess.check_call(["bun", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"], cwd=str(ROOT / "frontend"))
finally:
    backend.terminate()
