# Orchestrator: the only trusted backend. Runs as a regular ACA app behind
# EasyAuth (Entra). Holds the Session Executor role via managed identity.
FROM python:3.12-slim

RUN useradd --create-home --uid 10001 app
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

USER app
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
