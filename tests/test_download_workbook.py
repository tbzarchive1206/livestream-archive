import io
import tempfile
import unittest
import zipfile
from pathlib import Path
from unittest.mock import patch

from scripts import download_workbook


def xlsx_bytes() -> bytes:
    output = io.BytesIO()
    with zipfile.ZipFile(output, "w") as workbook:
        workbook.writestr("[Content_Types].xml", "<Types />")
        workbook.writestr("xl/workbook.xml", "<workbook />")
    return output.getvalue()


class DownloadWorkbookTests(unittest.TestCase):
    def test_download_once_validates_and_atomically_replaces_destination(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as directory:
            destination = Path(directory) / "Livestreams.xlsx"
            destination.write_bytes(b"old workbook")

            with patch(
                "scripts.download_workbook.urllib.request.urlopen",
                return_value=io.BytesIO(xlsx_bytes()),
            ):
                size = download_workbook.download_once(
                    "https://example.test/workbook", destination, timeout=10
                )

            self.assertEqual(size, len(xlsx_bytes()))
            self.assertEqual(destination.read_bytes(), xlsx_bytes())
            self.assertEqual(list(destination.parent.glob("*.part")), [])

    def test_invalid_download_does_not_replace_existing_destination(self):
        with tempfile.TemporaryDirectory(dir=Path(__file__).parent) as directory:
            destination = Path(directory) / "Livestreams.xlsx"
            destination.write_bytes(b"old workbook")

            with patch(
                "scripts.download_workbook.urllib.request.urlopen",
                return_value=io.BytesIO(b"incomplete response"),
            ):
                with self.assertRaises(ValueError):
                    download_workbook.download_once(
                        "https://example.test/workbook", destination, timeout=10
                    )

            self.assertEqual(destination.read_bytes(), b"old workbook")

    @patch("scripts.download_workbook.time.sleep")
    @patch("scripts.download_workbook.random.random", return_value=0)
    @patch("scripts.download_workbook.download_once")
    def test_transient_failure_is_retried(self, download_once, _random, sleep):
        download_once.side_effect = [
            download_workbook.http.client.IncompleteRead(b"partial"),
            123,
        ]

        result = download_workbook.download_with_retries(
            "https://example.test/workbook", Path("workbook.xlsx"), attempts=2
        )

        self.assertEqual(result, 123)
        self.assertEqual(download_once.call_count, 2)
        sleep.assert_called_once_with(1)


if __name__ == "__main__":
    unittest.main()
