#!/usr/bin/env python3
import os
import json
import glob
from pathlib import Path

def create_basic_notebook(lesson_dir, lesson_title):
    nb = {
        "cells": [
            {"cell_type": "markdown", "source": [f"# {lesson_title} Notebook\n\n> Hands-on Build It and Exercises."]},
            {"cell_type": "markdown", "source": ["## Build It"]},
            {"cell_type": "code", "source": ["print('Build It code cells go here — extract from docs/en.md')"]},
            {"cell_type": "markdown", "source": ["## Exercises"]},
            {"cell_type": "code", "source": ["print('Exercise 1...')"]},
        ],
        "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}}
    }
    nb_path = Path(lesson_dir) / "notebook" / "lesson.ipynb"
    nb_path.parent.mkdir(parents=True, exist_ok=True)
    with open(nb_path, "w") as f:
        json.dump(nb, f, indent=2)
    print(f"Created {nb_path}")

# Process all lessons
for md_file in glob.glob("phases/**/*.md", recursive=True):
    if "docs/en.md" in md_file:
        lesson_path = "/".join(md_file.split("/")[:-1])  # e.g. phases/NN-phase/NN-lesson
        if os.path.exists(Path(lesson_path) / "notebook" / "lesson.ipynb"):
            continue  # already has one (integrate if exists)
        # Basic extraction from docs to get title
        with open(md_file) as f:
            content = f.read()
            if "## Build It" in content or "## Exercises" in content:
                title = "Lesson"  # fallback
                create_basic_notebook(lesson_path, title)
print("Notebook creation batch complete. Run audit next.")
