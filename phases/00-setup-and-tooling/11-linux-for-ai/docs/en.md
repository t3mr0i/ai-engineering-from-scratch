# Linux for AI

> Operate a remote Linux box by checking paths, permissions, processes, and disk before changing anything.

**Type:** Learn
**Languages:** None
**Prerequisites:** Phase 0, Lesson 01
**Time:** ~45 minutes

## Learning Objectives

- Navigate from `/` to a home or project directory with `pwd`, `ls`, `cd`, and `find`.
- Create, inspect, copy, and remove files while checking the exact path before destructive operations.
- Read permission bits with `ls -l` and choose `chmod` or an authorized `chown` change for a specific failure.
- Install or inspect system packages with `apt` only on a Debian/Ubuntu machine where you have permission.
- Monitor processes, disk, GPU, and persistent sessions with `ps`, `df`, `du`, `nvidia-smi`, and `tmux`.
- Transfer files with `scp` or `rsync` and account for macOS, Windows/WSL, and Linux command differences.

## The machine model

This lesson has no `code/main.*` entrypoint. Its notebook and [`outputs/artifact-card.md`](../outputs/artifact-card.md) form a command-line runbook. Linux exposes one directory tree rooted at `/`; common locations in the notebook are `/home/<user>` for work, `/tmp` for disposable files, `/var/log` for service logs, `/mnt` or `/media` for mounted storage, and `/proc`/`/sys` for kernel and hardware views.

```mermaid
flowchart TD
    R[/] --> H[/home/<user>]
    R --> T[/tmp]
    R --> U[/usr and /etc]
    R --> V[/var/log]
    R --> M[/mnt or /media]
    R --> P[/proc and /sys]
```

## Build It

Use a disposable directory on Linux, WSL2, or a local shell:

```bash
tmp_dir=$(mktemp -d)
cd "$tmp_dir"
printf '%s\n' 'run=1' > train.log
mkdir project
touch project/config.yaml project/train.py project/README.md
ls -la project
find project -maxdepth 1 -type f -print
rm -rf "$tmp_dir"
```

The exact `rm -rf` target is the temporary directory captured in `tmp_dir`; never substitute `/`, `$HOME`, or an unexpanded wildcard. The notebook's first exercise asks for the same create/list evidence on a Linux or WSL2 machine.

## Use It

Permissions are a diagnosis, not a command to paste blindly. `chmod +x train.sh` changes the executable bit for the file owner/group/others according to the existing mode; `chmod 644 config.yaml` makes a conventional non-executable configuration mode. `chown user:group file.txt` requires authorization and changes ownership, so inspect `ls -l` and the current user with `whoami` first. `sudo` should be limited to the one package or ownership operation that needs it.

For a fresh Ubuntu-style GPU host, the notebook uses `sudo apt update` followed by packages such as `git`, `curl`, `tmux`, `htop`, `unzip`, and `python3-venv`. Package names and privileges are distribution-specific; an `apt` command is not a portable macOS command. `df -h` and `du -sh` locate storage pressure, while `ps aux`, `htop`, and `nvidia-smi` show process/resource state when those tools are installed.

Long training should run inside a named tmux session:

```bash
tmux new -s train
# launch the job, then press Ctrl+B followed by D
tmux ls
tmux attach -t train
```

`scp` copies a path once; `rsync -avz --progress` can resume and transfers changed data. Test a small file before syncing a checkpoint tree.

## Ship It

The artifact card should contain a command, the host/distribution assumption, the observed path or permission bits, and the smallest authorized change. Add a transfer source/destination and a checksum or file listing when moving a result. Do not store credentials or real hostnames in the card.

## Exercises

1. Complete the temporary-directory run and capture `pwd`, `ls -la`, and `find` output before cleanup.
2. Create `run.sh` with mode 644, observe the failed execution, then apply `chmod +x run.sh` and verify with `ls -l`.
3. Run `df -h` and `du -sh` on a cache you own. If `apt` is unavailable, record the distribution and the package-manager equivalent instead of forcing an Ubuntu command.
4. Start `sleep 60` in a named tmux session, detach, confirm it with `tmux ls`, reattach, and end the session. Transfer a small file with `scp` or `rsync` only to a host you control.

## Reference Solution

The evidence is a safe file operation, a permission change tied to an observed mode, a package/process/disk check appropriate to the host, and a detached/reattached tmux session. A correct runbook names where a command is Linux-specific and does not turn `sudo`, `rm -rf`, `kill -9`, or `chown` into default fixes. Remote transfer is accepted only when the destination and result are verified.
