---
name: workspace-index
description: Build a small progressive-disclosure map before an agent reads or edits a repository.
version: 1.0.0
phase: 14
lesson: 46
tags: [workspace, progressive-disclosure, context, routing]
---

Create a deterministic index with one bounded summary per relevant file:

- include the root router and README when present;
- skip generated, cache, and VCS directories;
- rank paths by overlap with the current task terms;
- cap the first read set and open source files only after the map is clear.

The map controls context. It does not replace the repository's authoritative files.
