import unittest
from pathlib import Path
from tempfile import TemporaryDirectory

from main import Evidence, VerificationReport, file_exists, verify


class SelfVerificationTests(unittest.TestCase):
    def test_all_passing_checks_produce_a_passing_report(self):
        report = verify([("one", lambda: (True, "ok")), ("two", lambda: (True, "also ok"))])
        self.assertIsInstance(report, VerificationReport)
        self.assertTrue(report.passed)
        self.assertEqual([item.name for item in report.evidence], ["one", "two"])

    def test_one_failed_check_fails_the_whole_report(self):
        report = verify([("one", lambda: (True, "ok")), ("two", lambda: (False, "missing"))])
        self.assertFalse(report.passed)
        self.assertEqual(report.evidence[-1], Evidence("two", False, "missing"))

    def test_empty_check_list_fails_closed(self):
        report = verify([])
        self.assertFalse(report.passed)
        self.assertEqual(report.evidence[0].detail, "no checks supplied")

    def test_check_exception_is_recorded_as_failed_evidence(self):
        def broken():
            raise RuntimeError("boom")

        report = verify([("broken", broken)])
        self.assertFalse(report.passed)
        self.assertIn("RuntimeError: boom", report.evidence[0].detail)

    def test_invalid_and_duplicate_names_are_not_silent_passes(self):
        report = verify([("", lambda: (True, "ok")), ("same", lambda: (True, "ok")), ("same", lambda: (True, "ok"))])
        self.assertFalse(report.passed)
        self.assertEqual(len(report.evidence), 3)
        self.assertIn("unique", report.evidence[-1].detail)

    def test_bad_return_shape_is_recorded_as_failure(self):
        report = verify([("bad", lambda: True)])
        self.assertFalse(report.passed)
        self.assertIn("must return", report.evidence[0].detail)

    def test_file_exists_distinguishes_present_missing_and_absolute(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "app.py").write_text("x", encoding="utf-8")
            self.assertEqual(file_exists(root, "app.py"), (True, "app.py: present"))
            self.assertEqual(file_exists(root, "test.py"), (False, "test.py: missing"))
            self.assertFalse(file_exists(root, str(root / "app.py"))[0])

    def test_file_exists_rejects_parent_traversal_even_when_target_exists(self):
        with TemporaryDirectory() as directory:
            container = Path(directory)
            root = container / "root"
            root.mkdir()
            outside = container / "outside.txt"
            outside.write_text("private", encoding="utf-8")
            self.assertFalse(file_exists(root, "../outside.txt")[0])

    def test_file_exists_rejects_symlinked_components(self):
        with TemporaryDirectory() as directory:
            container = Path(directory)
            root = container / "root"
            root.mkdir()
            outside = container / "outside"
            outside.mkdir()
            (outside / "secret.txt").write_text("private", encoding="utf-8")
            link = root / "alias"
            try:
                link.symlink_to(outside, target_is_directory=True)
            except OSError as exc:
                self.skipTest(f"symlinks unavailable: {exc}")
            self.assertFalse(file_exists(root, "alias/secret.txt")[0])

    def test_non_callable_check_fails_closed(self):
        report = verify([("not callable", 123)])
        self.assertFalse(report.passed)
        self.assertIn("not callable", report.evidence[0].detail)


if __name__ == "__main__":
    unittest.main()
