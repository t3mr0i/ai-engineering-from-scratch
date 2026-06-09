# Singleuser notebook image for the JupyterHub lesson environment.
# Each user gets their own server running this image, with the lesson
# libraries preinstalled. Based on the official jupyter docker-stacks.
FROM quay.io/jupyter/scipy-notebook:2024-12-23

# Lesson libraries (light: API/RAG glue). numpy/pandas/matplotlib already in base.
# jupytext lets JupyterLab open the lesson .py files directly as notebooks.
RUN pip install --no-cache-dir \
    openai==1.59.6 \
    anthropic==0.42.0 \
    httpx==0.28.1 \
    tiktoken==0.8.0 \
    jupytext==1.16.6

# Bake the lessons in: every user server starts with all lessons available as
# code/main.py under ~/lessons/<phase>/<lesson>/. jupytext opens them as
# notebooks. No git auth / nbgitpuller needed (the repo is private).
COPY lessons /opt/lessons

# Copy lessons into each user's home on first start (home is a fresh volume).
# Jupyter images run as non-root 'jovyan'; switch to root to install the script,
# then back. COPY --chmod sets the executable bit without a separate chmod.
USER root
COPY start-lessons.sh /usr/local/bin/start-lessons.sh
RUN chmod 0755 /usr/local/bin/start-lessons.sh
USER ${NB_UID}

WORKDIR /home/jovyan
