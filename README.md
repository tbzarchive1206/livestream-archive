# THE BOYZ — LIVESTREAM ARCHIVE
Dane są generowane automatycznie z publicznego arkusza:

https://docs.google.com/spreadsheets/d/1GmZQa24xkS7cPjhWgwYOXGc4SxwR9Eev-eN6rlWRk90/edit

## Automatyczna aktualizacja
Workflow `.github/workflows/sync-livestreams.yml` codziennie:

1. pobiera aktualny eksport XLSX z Google Sheets;
2. odczytuje zakładki nazwane latami;
3. pomija linki Twitter/X i informacje o napisach;
4. generuje `data/livestreams.js`;
5. publikuje gotową stronę przez GitHub Pages.

Nie edytuj ręcznie `data/livestreams.js`, ponieważ kolejne uruchomienie workflow zastąpi zmiany.
