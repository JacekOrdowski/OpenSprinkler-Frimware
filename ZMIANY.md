# Historia wersji: Armia Liczb

Najnowsza wersja jest na górze. Numer wersji widać w grze, na dole menu.
Do każdej wersji można wrócić: przy każdej podany jest identyfikator zapisu w repozytorium (np. `64a4bae`).

---

## Wersja 4 (20 października 2026)

### Dodane
- **Nauka po błędzie.** Po złej odpowiedzi gra się zatrzymuje i pokazuje krok po kroku, jak to łatwo policzyć w pamięci.
  Dotyczy to bramek i walki, także sytuacji, gdy zabraknie czasu.
  Przykład: 40% z 280. Najpierw 10% z 280 to 280 : 10 = 28. 40% to 4 razy po 10%, czyli 4 · 28 = 112.
- Po objaśnieniu są **2 zadania tego samego rodzaju**. Dobra odpowiedź: „Dobrze!”. Po dwóch dobrych gra toczy się dalej.
- Zła odpowiedź w ćwiczeniu: **lecą kciuki w dół 👎 i słychać „uuuuu”**. Gra pokazuje, jak policzyć to zadanie, i daje następne.
  Najwyżej 5 zadań. Jeśli dalej nie wychodzi, gra wraca do biegu z radą, żeby ten temat jeszcze poćwiczyć.
- Objaśnienia do wszystkich rodzajów zadań w klasach 1–8.
- Przełącznik **„Nauka po błędzie: wł./wył.”** w menu i w pauzie.
- W menu czwarta wskazówka: po pomyłce gra pokaże, jak to policzyć.

### Zmienione
- Podczas nauki gra stoi: czas nie ucieka, a potwór nie atakuje. Ćwiczenia nie zmieniają liczby żołnierzy.
  Szanse w walce są takie same jak w wersji 3 (symulacja: około 33% przy wszystkich bramkach dobrze i zgadywaniu w walce).
- Klasa 7, wyrażenia algebraiczne: zamiast „1x” jest teraz „x”, tak jak w zeszycie (np. 6x + 5x − x).
- Klasa 7, twierdzenie Pitagorasa, najłatwiejsza gra: 3 różne trójkąty zamiast 2, żeby było z czego ćwiczyć.
- Klasa 6, równania: liczba ujemna po prawej stronie miała krótki myślnik zamiast minusa (np. „-2”). Teraz jest „−2”.
- Klasa 8, nierówności: rozwiązanie po błędzie zapisuje się „x + 8 > 3, więc x > −5”. Wcześniej było niezgrabne „x = x > −5”.
- Sprawdzanie zadań rozszerzone. Osobny program przelicza teraz także każdy krok objaśnień.
  Wynik: ponad 200 000 obliczeń w objaśnieniach i 256 000 zadań, zero błędów.

### Usunięte
- Nic.

### Do sprawdzenia
- Jak brzmi „uuuuu” i jak wyglądają kciuki na prawdziwym iPhonie.
- Czy objaśnienia są zrozumiałe dla młodszych dzieci. Najlepiej przejrzeć kilka razem z dzieckiem.

---

## Wersja 3 (20 października 2026)

Zapis w repozytorium: `dde3488`

### Zmienione
- **Walka z potworem idzie w rundach.** Każda odpowiedź to jedna runda: najpierw posiłki (po dobrej odpowiedzi), potem strzał armii, a na końcu cios potwora. Po złej albo spóźnionej odpowiedzi potwór dorzuca kulę ognia.
- **Szybkość odpowiedzi nie ma już znaczenia**, liczy się tylko to, czy jest dobra (i czy zmieści się w czasie).
  Powód: w wersji 2 potwór atakował co ok. 2 sekundy bez względu na odpowiedzi. Kto liczył spokojnie, mógł przegrać mimo samych dobrych odpowiedzi. Zgłoszony przypadek: klasa 6, gra 1, 11 dobrych odpowiedzi na 11, a mimo to przegrana. W symulacji takie przegrane zdarzały się w 14–25% gier przy odpowiedziach po 8–10 s.
- **Same dobre odpowiedzi w walce zawsze dają wygraną.** Cios potwora nigdy nie zabiera więcej żołnierzy, niż daje dobra odpowiedź.
- Siła potwora dobrana na nowo. Przy wszystkich bramkach dobrze i zgadywaniu w walce wygrywa się średnio w 32% gier (symulacja 4000 gier we wszystkich klasach).

### Dodane
- Liczba obrażeń nad paskiem życia potwora po każdym strzale armii (np. −101) i dźwięk trafienia.
- Na początku walki wyjaśnienie: „Każda odpowiedź to runda: armia strzela, potem atakuje potwór”.

### Usunięte
- Ciągłe strzelanie do potwora i jego ataki co kilka sekund, niezależne od odpowiedzi.

---

## Wersja 2 (20 października 2026)

Zapis w repozytorium: `ca6c2ff`

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

## Wersja 1 (20 października 2026)

Zapis w repozytorium: `64a4bae`

Pierwsza grywalna wersja.

### Dodane
- Bieg po moście. Armię przesuwa się palcem w lewo i w prawo.
- Przed bramkami pojawia się działanie, a na dwóch bramkach dwie odpowiedzi. Dobra daje +20 żołnierzy, zła zabiera 20.
- 40 poziomów w 4 światach: 5–7 lat, 8–10 lat, 11–14 lat i dorośli.
- Oddziały wroga po drodze, beczki z nagrodą, armia wroga na końcu mostu.
- Gwiazdki za wynik i lista „Do powtórki” z błędami.
- Proste dźwięki (bez muzyki).
- Ikona i możliwość dodania gry do ekranu początkowego iPhone'a.
