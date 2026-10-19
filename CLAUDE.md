# Armia Liczb: zasady pracy w tym repozytorium

Gra na telefon z matematyką dla klas 1–8 szkoły podstawowej. Właściciel nie jest programistą:
rozmawiaj po polsku, prosto, bez technicznego żargonu.

## Każda nowa wersja gry

Gdy zmiany w grze są gotowe i zapisywane w repozytorium:

1. Podnieś numer `WERSJA` na początku `gra.js` o 1.
2. Dopisz na górze `ZMIANY.md` nową sekcję „Wersja N (data)” z podziałem na **Dodane**, **Zmienione**, **Usunięte**
   (i ewentualnie **Do sprawdzenia**), prostym językiem, tak jak w poprzednich wpisach.
3. Zrób commit i oznacz go tagiem `vN` (`git tag vN`, potem `git push origin vN`).

## Zadania matematyczne

- Zadania są w `zadania.js`: 8 klas × 8 tematów × 4 stopnie trudności.
- Po każdej zmianie w zadaniach sprawdź je automatycznie, przeliczając wyniki niezależnie od gry,
  i upewnij się, że błędna odpowiedź na bramce nigdy nie jest równa dobrej.
- Przydział tematów do klas: podstawa programowa 2017 ze zmianami z 2024 oraz rozkłady materiału GWO („Matematyka z plusem”)
  i Nowej Ery („Matematyka z kluczem”).
