"""Reliably download and validate a public Google Sheets XLSX export."""

import argparse
import http.client
import os
import random
import shutil
import socket
import tempfile
import time
import urllib.error
import urllib.request
import zipfile
from pathlib import Path


USER_AGENT = "tbzarchive-github-sync/1.1"
RETRYABLE_ERRORS = (
    http.client.IncompleteRead,
    http.client.RemoteDisconnected,
    urllib.error.URLError,
    TimeoutError,
    ConnectionError,
    socket.timeout,
)


def validate_xlsx(path: Path) -> None:
    """Reject incomplete/error-page downloads before they reach openpyxl."""
    try:
        with zipfile.ZipFile(path) as workbook:
            names = set(workbook.namelist())
            required = {"[Content_Types].xml", "xl/workbook.xml"}
            missing = required - names
            if missing:
                raise ValueError(
                    "download is not a valid XLSX workbook; missing "
                    + ", ".join(sorted(missing))
                )
    except zipfile.BadZipFile as error:
        raise ValueError("download is not a valid or complete XLSX file") from error


def download_once(url: str, destination: Path, timeout: int) -> int:
    """Stream one download to a temporary file and atomically publish it."""
    destination.parent.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    temporary_path = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="wb", prefix=f".{destination.name}.", suffix=".part",
            dir=destination.parent, delete=False
        ) as temporary:
            temporary_path = Path(temporary.name)
            with urllib.request.urlopen(request, timeout=timeout) as response:
                shutil.copyfileobj(response, temporary, length=1024 * 1024)

        validate_xlsx(temporary_path)
        size = temporary_path.stat().st_size
        os.replace(temporary_path, destination)
        return size
    finally:
        if temporary_path is not None:
            temporary_path.unlink(missing_ok=True)


def download_with_retries(
    url: str,
    destination: Path,
    attempts: int = 5,
    timeout: int = 300,
) -> int:
    if attempts < 1:
        raise ValueError("attempts must be at least 1")

    for attempt in range(1, attempts + 1):
        try:
            print(f"Download attempt {attempt}/{attempts}...")
            size = download_once(url, destination, timeout)
            print(f"Downloaded and validated {size:,} bytes to {destination}")
            return size
        except RETRYABLE_ERRORS + (ValueError,) as error:
            if attempt == attempts:
                raise RuntimeError(
                    f"workbook download failed after {attempts} attempts"
                ) from error
            delay = min(30, 2 ** (attempt - 1)) + random.random()
            print(
                f"Attempt {attempt} failed ({type(error).__name__}: {error}). "
                f"Retrying in {delay:.1f}s..."
            )
            time.sleep(delay)

    raise AssertionError("unreachable")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sheet-id", required=True)
    parser.add_argument("--destination", type=Path, required=True)
    parser.add_argument("--attempts", type=int, default=5)
    parser.add_argument("--timeout", type=int, default=300)
    args = parser.parse_args()

    url = (
        f"https://docs.google.com/spreadsheets/d/{args.sheet_id}/"
        "export?format=xlsx"
    )
    download_with_retries(url, args.destination, args.attempts, args.timeout)


if __name__ == "__main__":
    main()
