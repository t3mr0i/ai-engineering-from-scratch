#!/usr/bin/env python3
import os
import json
import glob
import re
from pathlib import Path

def create_notebook_from_doc(lesson_dir, md_content):
    nb = {
        "cells": [],
        "metadata": {"kernelspec": {"display_name": "Python 3", "language": "python", "name": "python3"}}
    }
    title_match = re.search(r"#\s+(.+?)\s*(\n|$)", md_content)
    lesson_title = title_match.group(1).strip() if title_match else "Lesson"

    nb["cells"].append({"cell_type": "markdown", "source": [f"# {lesson_title} Notebook\n\n> Hands-on Build It and Exercises."]})

    # Extract Build It section
    build_match = re.search(r"##\s+Build It\s*\n(.*?)(?=\n##\s+(Use It|Ship It|The Problem|The Concept|$))", md_content, re.DOTALL)
    if build_match:
        build_content = build_match.group(1).strip()
        nb["cells"].append({"cell_type": "markdown", "source": ["## Build It"]})
        cells_content = build_content.replace("\n\n", "\n").split("\n")
        for part in cells_content:
            if part.strip().startswith("```"):
                nb["cells"].append({"cell_type": "code", "source": [part]})
            else:
                nb["cells"].append({"cell_type": "markdown", "source": [part]})
    else:
        nb["cells"].append({"cell_type": "markdown", "source": ["## Build It (from docs)"]})

    # Extract Exercises section
    exercise_match = re.search(r"##\s+Exercises\s*\n(.*?)(?=\n##\s+|$)", md_content, re.DOTALL)
    if exercise_match:
        exercises_content = exercise_match.group(1).strip()
        nb["cells"].append({"cell_type": "markdown", "source": ["## Exercises"]})
        nb["cells"].append({"cell_type": "code", "source": [exercises_content]})
    else:
        nb["cells"].append({"cell_type": "markdown", "source": ["## Exercises"]})

    nb_path = Path(lesson_dir) / "notebook" / "lesson.ipynb"
    nb_path.parent.mkdir(parents=True, exist_ok=True)
    with open(nb_path, "w") as f:
        json.dump(nb, f, indent=2)
    print(f"Enhanced {nb_path} with full content")

# Process all lessons (overwrite existing)
for md_file in glob.glob("phases/**/*.md", recursive=True):
    if "docs/en.md" in md_file:
        lesson_path = "/".join(md_file.split("/")[:-1])
        with open(md_file) as f:
            content = f.read()
            if "## Build It" in content or "## Exercises" in content:
                create_notebook_from_doc(lesson_path, content)
print("Enhanced notebook batch complete.")
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
