# Jak dodawać livestreamy

Źródłem strony jest publiczny Google Sheets:

https://docs.google.com/spreadsheets/d/1GmZQa24xkS7cPjhWgwYOXGc4SxwR9Eev-eN6rlWRk90/edit

## Dodanie transmisji

1. Otwórz zakładkę odpowiadającą rokowi transmisji, np. `2026`.
2. Dodaj kolejny wiersz i uzupełnij tytuł, członków, datę, platformę oraz główny link do nagrania.
3. Zachowaj istniejące nazwy i układ kolumn.
4. Nie trzeba pobierać arkusza ani zmieniać plików strony.

Workflow sprawdza arkusz codziennie około 03:23 UTC. Aby opublikować zmianę od razu, wybierz na GitHubie **Actions → Sync Livestreams from Google Sheets → Run workflow**.

## Zasady importu

- Linki Twitter/X są pomijane.
- Informacje i pliki dotyczące napisów nie są publikowane.
- Dla linków YouTube miniatura powstaje automatycznie.
- Hwall i Haknyeon pozostają w archiwum, ale nie pojawiają się jako opcje filtra.
- `Jacob Birthday Tiktok Live` z datą `2026-05-31` otrzymuje platformę `Tiktok`.
- Nowa zakładka roczna musi mieć nazwę składającą się z czterech cyfr, np. `2027`.

Arkusz musi pozostać udostępniony jako **Każda osoba mająca link → Wyświetlający**, aby GitHub Actions mógł pobrać jego eksport.
