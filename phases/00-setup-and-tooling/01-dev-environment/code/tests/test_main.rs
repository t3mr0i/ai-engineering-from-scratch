// Contract and executable-behavior tests for this lesson demo.
use std::fs;
use std::path::PathBuf;
use std::process::Command;

fn code_dir() -> PathBuf { PathBuf::from(env!("CARGO_MANIFEST_DIR")).parent().unwrap().to_path_buf() }
fn source() -> String { fs::read_to_string(code_dir().join("main.rs")).unwrap() }
fn binary() -> PathBuf { std::env::temp_dir().join(format!("lesson-demo-{}", std::process::id())) }
fn compile_demo() -> std::process::Output { Command::new("rustc").args(["--edition", "2021", "main.rs", "-o"]).arg(binary()).current_dir(code_dir()).output().unwrap() }

#[test]
fn source_is_nonempty() { assert!(!source().trim().is_empty()); }

#[test]
fn source_has_main_entrypoint() { assert!(source().contains("fn main(")); }

#[test]
fn source_uses_stdlib_only() { assert!(!source().contains("extern crate ")); }

#[test]
fn demo_compiles() { let result = compile_demo(); assert!(result.status.success(), "{}", String::from_utf8_lossy(&result.stderr)); }

#[test]
fn demo_runs_and_emits_bounded_output() {
    let built = compile_demo(); assert!(built.status.success(), "{}", String::from_utf8_lossy(&built.stderr));
    let result = Command::new(binary()).current_dir(code_dir()).output().unwrap();
    assert!(result.status.success(), "{}", String::from_utf8_lossy(&result.stderr));
    assert!(!result.stdout.is_empty() || !result.stderr.is_empty());
    assert!(result.stdout.len() + result.stderr.len() < 1_000_000);
    let _ = fs::remove_file(binary());
}
