#!/usr/bin/env python3
"""Validate capstone evidence and emit a deterministic verification receipt."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
CHALLENGE_PATH = ROOT / "challenges" / "verified-capstone" / "challenge.json"
LEADERBOARD_PATH = ROOT / "challenges" / "verified-capstone" / "leaderboard.json"
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")
COMMIT_RE = re.compile(r"^[0-9a-f]{7,40}$")


def load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return data


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for block in iter(lambda: handle.read(65536), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_artifact_path(submission_dir: Path, relative: str) -> Path | None:
    candidate = Path(relative)
    if candidate.is_absolute() or ".." in candidate.parts:
        return None
    resolved = (submission_dir / candidate).resolve()
    try:
        resolved.relative_to(submission_dir.resolve())
    except ValueError:
        return None
    return resolved


def challenge_issues(spec: dict[str, Any]) -> list[str]:
    issues: list[str] = []
    tracks = spec.get("tracks")
    if not isinstance(tracks, list) or not tracks:
        issues.append("challenge tracks must be a non-empty list")
        return issues
    ids = [track.get("id") for track in tracks if isinstance(track, dict)]
    if len(ids) != len(tracks) or any(not isinstance(track_id, str) or not track_id for track_id in ids):
        issues.append("every track requires a non-empty id")
    if len(set(ids)) != len(ids):
        issues.append("track ids must be unique")
    covered: list[int] = []
    for track in tracks:
        if not isinstance(track, dict) or not isinstance(track.get("lessons"), list):
            issues.append("every track requires lessons[]")
            continue
        lessons = track["lessons"]
        if any(not isinstance(number, int) or not 20 <= number <= 87 for number in lessons):
            issues.append(f"track {track.get('id')} contains an invalid Phase 19 lesson number")
        covered.extend(lessons)
    expected = [number for number in range(20, 88) if number not in {18, 19}]
    if sorted(covered) != expected:
        issues.append("tracks must cover every Phase 19 deep-build lesson 20–87 exactly once")
    return issues


def validate_submission(submission_dir: Path, spec: dict[str, Any]) -> tuple[list[str], dict[str, Any]]:
    issues = challenge_issues(spec)
    manifest_path = submission_dir / "submission.json"
    if not manifest_path.is_file():
        return issues + ["missing submission.json"], {}
    try:
        manifest = load_json(manifest_path)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        return issues + [f"invalid submission.json: {error}"], {}

    if manifest.get("challenge") != spec.get("id"):
        issues.append("submission challenge id does not match challenge.json")
    track_ids = {track["id"] for track in spec["tracks"]}
    if manifest.get("track") not in track_ids:
        issues.append("unknown track id")
    if not isinstance(manifest.get("candidate"), str) or not manifest["candidate"].strip():
        issues.append("candidate must be a non-empty string")
    if not isinstance(manifest.get("commit"), str) or not COMMIT_RE.fullmatch(manifest["commit"]):
        issues.append("commit must be 7–40 lowercase hexadecimal characters")

    artifacts = manifest.get("artifacts")
    artifact_names: set[str] = set()
    if not isinstance(artifacts, list):
        issues.append("artifacts must be a list")
        artifacts = []
    for artifact in artifacts:
        if not isinstance(artifact, dict) or not isinstance(artifact.get("path"), str):
            issues.append("each artifact requires a path and sha256")
            continue
        relative = artifact["path"]
        artifact_names.add(relative)
        path = safe_artifact_path(submission_dir, relative)
        if path is None:
            issues.append(f"unsafe artifact path: {relative}")
            continue
        if not path.is_file():
            issues.append(f"missing artifact: {relative}")
            continue
        expected_digest = artifact.get("sha256")
        if not isinstance(expected_digest, str) or not SHA256_RE.fullmatch(expected_digest):
            issues.append(f"invalid sha256 for {relative}")
        elif sha256_file(path) != expected_digest:
            issues.append(f"sha256 mismatch for {relative}")
    for required in spec["required_files"]:
        if required not in artifact_names:
            issues.append(f"required artifact not declared: {required}")

    tests = manifest.get("tests")
    if not isinstance(tests, list) or not tests:
        issues.append("tests must record at least one command")
    else:
        for test in tests:
            if not isinstance(test, dict) or not isinstance(test.get("command"), str) or test.get("exit_code") != 0:
                issues.append("every recorded test needs a command and exit_code 0")

    metrics = manifest.get("metrics")
    if not isinstance(metrics, dict):
        issues.append("metrics must be an object")
        metrics = {}
    for name, minimum in spec["minimum_metrics"].items():
        value = metrics.get(name)
        if not isinstance(value, (int, float)) or not minimum <= value <= 1.0:
            issues.append(f"metric {name} must be between {minimum} and 1.0")
    for name, maximum in spec["maximum_metrics"].items():
        value = metrics.get(name)
        if not isinstance(value, (int, float)) or not 0.0 <= value <= maximum:
            issues.append(f"metric {name} must be between 0.0 and {maximum}")

    attestations = manifest.get("attestations")
    if not isinstance(attestations, dict):
        issues.append("attestations must be an object")
        attestations = {}
    for name in spec["required_attestations"]:
        if attestations.get(name) is not True:
            issues.append(f"required attestation is not true: {name}")

    canonical = json.dumps(manifest, sort_keys=True, separators=(",", ":")).encode()
    receipt = {
        "challenge": spec.get("id"),
        "track": manifest.get("track"),
        "candidate": manifest.get("candidate"),
        "commit": manifest.get("commit"),
        "status": "verified" if not issues else "rejected",
        "manifest_sha256": hashlib.sha256(canonical).hexdigest(),
        "issue_count": len(issues),
    }
    receipt["receipt_sha256"] = hashlib.sha256(
        json.dumps(receipt, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    return issues, receipt


def self_check() -> list[str]:
    try:
        spec = load_json(CHALLENGE_PATH)
        leaderboard = load_json(LEADERBOARD_PATH)
    except (OSError, ValueError, json.JSONDecodeError) as error:
        return [str(error)]
    issues = challenge_issues(spec)
    if leaderboard.get("challenge") != spec.get("id") or not isinstance(leaderboard.get("entries"), list):
        issues.append("leaderboard.json must match the challenge id and contain entries[]")
    return issues


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("submission", nargs="?", type=Path)
    parser.add_argument("--self-check", action="store_true")
    parser.add_argument("--write-receipt", action="store_true")
    args = parser.parse_args(argv)
    if args.self_check:
        issues = self_check()
        print(f"verify_capstone.py self-check — {len(issues)} issue(s)")
        for issue in issues:
            print(f"  - {issue}")
        return 1 if issues else 0
    if args.submission is None:
        parser.error("submission directory is required unless --self-check is used")
    spec = load_json(CHALLENGE_PATH)
    issues, receipt = validate_submission(args.submission.resolve(), spec)
    if args.write_receipt and receipt:
        (args.submission / "verification-receipt.json").write_text(
            json.dumps(receipt, indent=2) + "\n", encoding="utf-8"
        )
    json.dump({"issues": issues, "receipt": receipt}, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 1 if issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
