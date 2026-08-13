import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from main import build_index, progressive_read_set


class WorkspaceIndexTests(unittest.TestCase):
    def make_workspace(self):
        directory = TemporaryDirectory()
        root = Path(directory.name)
        (root / "AGENTS.md").write_text("# Router\nRead the source.\n", encoding="utf-8")
        (root / "README.md").write_text("# Service\nValidation service.\n", encoding="utf-8")
        (root / "src").mkdir()
        (root / "src" / "validator.py").write_text("# Validation rules\n", encoding="utf-8")
        (root / "docs").mkdir()
        (root / "docs" / "acceptance.md").write_text("# Acceptance\nRun tests.\n", encoding="utf-8")
        return directory, root

    def test_index_requires_a_directory(self):
        with TemporaryDirectory() as directory:
            file_path = Path(directory) / "file"
            file_path.write_text("x", encoding="utf-8")
            with self.assertRaises(ValueError):
                build_index(file_path)

    def test_index_is_sorted_and_summaries_are_bounded(self):
        directory, root = self.make_workspace()
        self.addCleanup(directory.cleanup)
        index = build_index(root)
        paths = [entry.path for entry in index.entries]
        self.assertEqual(paths, sorted(paths))
        self.assertTrue(all(len(entry.summary) <= 140 for entry in index.entries))

    def test_generated_directories_are_not_indexed(self):
        directory, root = self.make_workspace()
        self.addCleanup(directory.cleanup)
        (root / "dist").mkdir()
        (root / "dist" / "bundle.js").write_text("generated", encoding="utf-8")
        (root / ".git").mkdir()
        (root / ".git" / "config").write_text("generated", encoding="utf-8")
        paths = {entry.path for entry in build_index(root).entries}
        self.assertNotIn("dist/bundle.js", paths)
        self.assertNotIn(".git/config", paths)

    def test_router_is_always_ranked_first_when_present(self):
        directory, root = self.make_workspace()
        self.addCleanup(directory.cleanup)
        selected = progressive_read_set(build_index(root), "unrelated task", limit=2)
        self.assertEqual(selected[0].path, "AGENTS.md")

    def test_task_terms_rank_relevant_files(self):
        directory, root = self.make_workspace()
        self.addCleanup(directory.cleanup)
        selected = progressive_read_set(build_index(root), "validation acceptance", limit=4)
        paths = [entry.path for entry in selected]
        self.assertIn("src/validator.py", paths)
        self.assertIn("docs/acceptance.md", paths)

    def test_limit_and_invalid_limit_are_enforced(self):
        directory, root = self.make_workspace()
        self.addCleanup(directory.cleanup)
        index = build_index(root)
        self.assertEqual(len(progressive_read_set(index, "service", limit=1)), 1)
        with self.assertRaises(ValueError):
            progressive_read_set(index, "service", limit=0)


if __name__ == "__main__":
    unittest.main()
