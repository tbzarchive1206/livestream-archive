# THE BOYZ — LIVESTREAM ARCHIVE

Statyczna strona przygotowana dla GitHub Pages. Dane są generowane automatycznie z publicznego arkusza:

https://docs.google.com/spreadsheets/d/1GmZQa24xkS7cPjhWgwYOXGc4SxwR9Eev-eN6rlWRk90/edit

## Automatyczna aktualizacja

Workflow `.github/workflows/sync-livestreams.yml` codziennie:

1. pobiera aktualny eksport XLSX z Google Sheets;
2. odczytuje zakładki nazwane latami;
3. pomija linki Twitter/X i informacje o napisach;
4. generuje `data/livestreams.js`;
5. publikuje gotową stronę przez GitHub Pages.

Można go uruchomić natychmiast przez **Actions → Sync Livestreams from Google Sheets → Run workflow**. Nie jest potrzebny klucz Google API ani sekret, dopóki arkusz pozostaje dostępny jako „Każda osoba mająca link”.

## GitHub Pages

W **Settings → Pages → Build and deployment** ustaw **Source: GitHub Actions**.

## Miniatury

Miniatury YouTube są generowane automatycznie z adresu filmu. Własny adres można podać w kolumnie `Thumbnail`/`Thumbnail URL`, jeśli arkusz taką wartość zawiera.

Nie edytuj ręcznie `data/livestreams.js`, ponieważ kolejne uruchomienie workflow zastąpi zmiany.
