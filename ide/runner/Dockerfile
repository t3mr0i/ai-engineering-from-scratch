# Custom container image for Azure Container Apps Dynamic Sessions.
# One of these runs per user session, Hyper-V isolated. It exposes /run on
# port 8000; the session pool forwards <POOL_ENDPOINT>/run?identifier=<oid>
# to this port.
FROM python:3.12-slim

# Non-root: untrusted code must not run as root inside the sandbox.
RUN useradd --create-home --uid 10001 runner

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

USER runner
EXPOSE 8000

# Single worker: each session serves one user; the pool gives concurrency by
# allocating more sessions, not more workers per session.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
