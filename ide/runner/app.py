"""Runner — the HTTP server that runs inside each sandboxed Dynamic Session.

One instance per user session (Hyper-V isolated). It receives a set of files
and an entry point, writes them to a scratch dir, runs the entry with a fresh
Python interpreter, and returns captured stdout/stderr.

It does NOT hold any secret. LLM access is reached by the lesson code over the
network (egress is locked by the surrounding VNet/NSG to the internal gateway
only). See ide/README.md for the trust boundary.
"""

import os
import shutil
import subprocess
import sys
import tempfile
import time

from fastapi import FastAPI
from pydantic import BaseModel, Field

# Hard ceiling so a runaway snippet can't pin a session forever. Lessons here
# are API/RAG glue, so this is generous.
RUN_TIMEOUT_S = int(os.environ.get("RUN_TIMEOUT_S", "120"))
MAX_OUTPUT_BYTES = int(os.environ.get("MAX_OUTPUT_BYTES", str(256 * 1024)))

app = FastAPI(title="lesson-runner")


class RunRequest(BaseModel):
    # filename -> file contents. Written verbatim into the run dir.
    files: dict[str, str] = Field(default_factory=dict)
    # which file to execute (must be a key in `files`)
    entry: str = "main.py"


class RunResult(BaseModel):
    ok: bool
    output: str            # combined stdout+stderr, truncated
    exit_code: int | None
    duration_ms: int
    timed_out: bool = False
    truncated: bool = False


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/run", response_model=RunResult)
def run(req: RunRequest) -> RunResult:
    started = time.monotonic()
    work = tempfile.mkdtemp(prefix="run-")
    try:
        # Materialize the files. Reject path traversal — names stay flat-ish.
        for name, content in req.files.items():
            safe = os.path.normpath(name)
            if safe.startswith("..") or os.path.isabs(safe):
                continue
            dest = os.path.join(work, safe)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with open(dest, "w", encoding="utf-8") as fh:
                fh.write(content)

        entry = os.path.normpath(req.entry)
        if entry not in req.files:
            return RunResult(
                ok=False, output=f"entry file not found: {req.entry}",
                exit_code=None, duration_ms=_ms(started),
            )

        timed_out = False
        try:
            # No -I: isolated mode drops the script dir from sys.path, which
            # would break local imports between lesson files (from helper import
            # ...). We run with cwd=work so sibling modules resolve, and pass a
            # clean env plus PYTHONPATH=work so multi-file lessons work.
            env = dict(os.environ)
            env["PYTHONPATH"] = work
            env["PYTHONDONTWRITEBYTECODE"] = "1"
            proc = subprocess.run(
                [sys.executable, entry],
                cwd=work,
                env=env,
                capture_output=True,
                text=True,
                timeout=RUN_TIMEOUT_S,
            )
            combined = proc.stdout + proc.stderr
            exit_code = proc.returncode
        except subprocess.TimeoutExpired as e:
            # On timeout, subprocess returns stdout/stderr as bytes even with
            # text=True, so decode defensively.
            timed_out = True
            combined = _as_text(e.stdout) + _as_text(e.stderr)
            combined += f"\n[timed out after {RUN_TIMEOUT_S}s]"
            exit_code = None

        truncated = len(combined.encode("utf-8")) > MAX_OUTPUT_BYTES
        if truncated:
            combined = combined.encode("utf-8")[:MAX_OUTPUT_BYTES].decode(
                "utf-8", "ignore"
            ) + "\n[output truncated]"

        return RunResult(
            ok=(exit_code == 0),
            output=combined,
            exit_code=exit_code,
            duration_ms=_ms(started),
            timed_out=timed_out,
            truncated=truncated,
        )
    finally:
        shutil.rmtree(work, ignore_errors=True)


def _ms(started: float) -> int:
    return int((time.monotonic() - started) * 1000)


def _as_text(v) -> str:
    if v is None:
        return ""
    if isinstance(v, bytes):
        return v.decode("utf-8", "ignore")
    return v
