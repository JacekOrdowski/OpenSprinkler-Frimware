# Historia wersji: Armia Liczb

Najnowsza wersja jest na górze. Numer wersji widać w grze, na dole menu.
Do każdej wersji można wrócić: w repozytorium jest oznaczona jako `v1`, `v2` itd.

---

## Wersja 2 (19 października 2026)

### Dodane
- **8 klas po 40 gier (razem 320 gier).** Każda klasa ma 8 tematów zgodnych z programem nauczania tej klasy. Każdy temat to 4 gry coraz trudniejsze i jedna powtórka. Gra 40 to sprawdzian z całej klasy.
- **Tematy, których nie było:** liczby rzymskie, pieniądze, obwody figur, jednostki (m, cm, kg, dag, h, min), połowa i ćwierć, dzielenie z resztą, NWD i NWW, skracanie ułamków, kąty w trójkącie, pola figur, ułamki okresowe i zaokrąglanie, prędkość, droga i czas, objętość, notacja wykładnicza, układ współrzędnych, nierówności, średnia i mediana, prawdopodobieństwo, symetria, graniastosłupy i ostrosłupy, koło i okrąg.
- **Potwór na końcu mostu** z paskiem życia. W każdej klasie jest inny: Glutek, Kudłacz, Ropuchor, Głazor, Płomyk, Lodowiec, Trójoki, Liczożerca.
- **Zadania w trakcie walki** z dwoma dużymi przyciskami. Dobra odpowiedź to posiłki, zła albo spóźniona to atak potwora.
- **Różne nagrody za bramki**, np. +14. Liczba jest widoczna nad bramką i na karcie z zadaniem.
- **Muzyka:** osobny utwór do menu, do biegu i do walki. Do tego nowe efekty: ryk i tupnięcie potwora, kula ognia, posiłki.
- Osobne włączniki **muzyki** i **dźwięków** (w menu i w pauzie).
- Sposób na dźwięk przy wyciszonym iPhonie. **Nie sprawdzono jeszcze na prawdziwym telefonie.**
- **Ułamki zapisane piętrowo**, jak w zeszycie, także liczby mieszane (np. 1 i 3/16).
- **Wybór klasy** zakładkami 1–8, a pod nimi gry pogrupowane według tematów. Powtórki są oznaczone na niebiesko.
- Numer wersji na dole menu.

### Zmienione
- **Więcej wrogów** między bramkami: oddział między każdymi bramkami, od 21. gry po dwa. Ich liczba rośnie z każdą grą.
- **Siła potwora** jest liczona osobno dla każdej gry. Przy wszystkich bramkach dobrze i zgadywaniu w walce wygrywa się średnio w 31% gier. Przy wszystkich odpowiedziach dobrych wygrywa się zawsze. Sprawdzono to symulacją tysięcy gier.
- Przydział tematów do klas oparto na podstawie programowej (2017, ze zmianami z 2024) i podręcznikach „Matematyka z plusem” oraz „Matematyka z kluczem”.
- Lista „Do powtórki” pokazuje ułamki piętrowo i informację „Za późno”, gdy zabrakło czasu w walce.
- Gra podzielona na trzy pliki: wygląd (`index.html`), zadania (`zadania.js`) i silnik gry (`gra.js`).
- Wszystkie rodzaje zadań sprawdzono automatycznie. 640 000 wylosowanych zadań, zero błędów.

### Usunięte
- **4 światy po 10 poziomów** (5–7 lat, 8–10 lat, 11–14 lat, dorośli). Zastąpiły je klasy 1–8.
- **Zadania dla dorosłych spoza szkoły podstawowej**, np. mnożenie dwucyfrowe w pamięci, dodawanie liczb czterocyfrowych w pamięci, długie działania z potęgami.
- **Stała nagroda +20 / −20.**
- **Czerwona armia z kapitanem na końcu mostu.** Zastąpił ją potwór.
- Prawdopodobieństwo przy rzucie dwiema kostkami lub dwiema monetami (usunięte z podstawy programowej w 2024).
- Jeden wspólny przycisk „Dźwięk” (teraz są dwa osobne).
- Zapis postępu z wersji 1 (gwiazdki liczą się od nowa, bo gry są inne).

### Do sprawdzenia
- Czy na iPhonie słychać muzykę, także przy wyciszonym telefonie.
- Od 1 września 2026 w klasach 1 i 4 obowiązuje nowa podstawa programowa. Tematy tych klas nie są jeszcze do niej dopasowane.

---

## Wersja 1 (19 października 2026)

Pierwsza grywalna wersja.

### Dodane
- Bieg po moście. Armię przesuwa się palcem w lewo i w prawo.
- Przed bramkami pojawia się działanie, a na dwóch bramkach dwie odpowiedzi. Dobra daje +20 żołnierzy, zła zabiera 20.
- 40 poziomów w 4 światach: 5–7 lat, 8–10 lat, 11–14 lat i dorośli.
- Oddziały wroga po drodze, beczki z nagrodą, armia wroga na końcu mostu.
- Gwiazdki za wynik i lista „Do powtórki” z błędami.
- Proste dźwięki (bez muzyki).
- Ikona i możliwość dodania gry do ekranu początkowego iPhone'a.
