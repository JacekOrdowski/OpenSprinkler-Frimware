# Śmierdzipacha

Gra na telefon z matematyką ze szkoły podstawowej, od 1. do 8. klasy. Nazwę wybrały dzieci.
Wcześniej gra nazywała się „Armia Liczb” (wersje 1–4) i „Głupia Gra” (wersja 5).

Armia biegnie przez różne światy. Przed każdą bramką pojawia się działanie, a na bramkach dwie odpowiedzi.
Wbiegasz w bramkę z dobrym wynikiem i dostajesz tylu żołnierzy, ile pokazuje zielona liczba (na przykład +14).
Zła odpowiedź zabiera tyle samo.

Armia strzela sama. Między bramkami idą hordy zombie (od 11. gry także duże zombie z większą liczbą żyć),
a po bokach drogi stoją rzeczy do zestrzelenia. Liczba na każdej mówi, ile trafień potrzeba:

- **klatka z jeńcami:** po rozbiciu jeńcy dołączają do armii,
- **skrzynia z bronią:** lepsza broń do końca gry (Blaster, Turboblaster, Plazma, Działko, Laser),
- **zepsuty most:** każde trafienie kładzie deskę, a naprawiony daje moc: Olbrzymy albo Szybki ogień.

W biegu armia nigdy nie traci ostatniego żołnierza, więc zawsze dochodzi do potwora.

Na końcu drogi walczysz z potworem. Walka idzie w rundach: na dole ekranu pojawia się zadanie,
a każda odpowiedź to jedna runda. Dobra odpowiedź przynosi posiłki, potem armia strzela, a na końcu potwór oddaje cios.
Zła albo spóźniona odpowiedź: nie ma posiłków, a potwór dorzuca kulę ognia. Szybkość odpowiedzi nie ma znaczenia,
liczy się tylko to, czy jest dobra (i czy zmieści się w czasie).

## Nauka po błędzie

Po złej odpowiedzi gra się zatrzymuje i pokazuje krok po kroku, jak to policzyć w pamięci.
Potem są 2 zadania tego samego rodzaju. Po dwóch dobrych odpowiedziach gra toczy się dalej.
Przy złej odpowiedzi gra pisze „Prawie!”, pokazuje rozwiązanie i daje kolejne zadanie (najwyżej 5).
Za każde dobrze rozwiązane zadanie jest +3 złota.

## Złoto i Zbrojownia

Złoto dostaje się za dobre odpowiedzi (+5), za zadania po błędzie (+3), za duże zombie (+2) i za każdą gwiazdkę (+10).
W Zbrojowni kupuje się za nie ulepszenia na stałe (broń na start, więcej żołnierzy na start, szybsze strzelanie)
i kolor armii. Ceny są znane z góry. Nic się nie losuje, nie ma reklam ani zakupów za prawdziwe pieniądze.
Naukę można wyłączyć w menu albo w pauzie: „Nauka po błędzie: wył.”.

## Jak trudny jest potwór

Siła potwora jest liczona osobno dla każdej gry. Według symulacji (tysiące rozegranych gier):

- wszystkie odpowiedzi w walce dobre: wygrana zawsze, niezależnie od tego, jak szybko się odpowiada.
  Cios potwora nigdy nie zabiera więcej żołnierzy, niż daje dobra odpowiedź,
- wszystkie bramki dobrze, a w walce odpowiedzi na chybił trafił (gracz celuje w skrzynie): wygrana w około 38% gier,
- to samo z połową ulepszeń ze Zbrojowni: około 58%, ze wszystkimi: około 68%.

## Levele i gry

8 leveli, a każdy level to jedna klasa: level 1 to 1. klasa, level 8 to 8. klasa.
W każdym levelu jest 40 gier (razem 320) i 8 tematów. Każdy temat to 4 gry o rosnącej trudności i jedna powtórka.
Gra 40 to sprawdzian z całego levelu. Pierwsza gra każdego levelu jest od razu otwarta, następne otwierają się po wygranej.

| Level (klasa) | Tematy |
|---|---|
| 1 | dodawanie i odejmowanie do 10 i do 20, z przekroczeniem progu, porównywanie liczb, okienka, pieniądze do 20 zł |
| 2 | dziesiątki, dodawanie i odejmowanie do 100, mnożenie i dzielenie do 30, okienka, pieniądze i miary, liczby rzymskie do XII |
| 3 | tabliczka mnożenia, dzielenie, liczby do 1000, mnożenie przez 10 i 2, obwody figur, jednostki, połowa i ćwierć |
| 4 | rachunki w pamięci, dzielenie z resztą, kwadraty i sześciany, kolejność działań, liczby rzymskie, działania pisemne, ułamki zwykłe i dziesiętne |
| 5 | potęgi, podzielność, liczby pierwsze, NWD i NWW, działania na ułamkach, ułamki dziesiętne, kąty i pola figur, liczby całkowite |
| 6 | ułamki zwykłe i dziesiętne razem, ułamki okresowe i zaokrąglanie, liczby całkowite, procenty, wyrażenia algebraiczne, równania, prędkość, objętość |
| 7 | procenty, potęgi, notacja wykładnicza, pierwiastki, wyrażenia algebraiczne, równania, twierdzenie Pitagorasa, układ współrzędnych |
| 8 | średnia i mediana, prawdopodobieństwo, nierówności, równania i proporcje, procenty w praktyce, trójkąty i symetria, graniastosłupy i ostrosłupy, koło |

Przydział tematów do klas oparto na podstawie programowej z 2017 r. (po zmianach z 2024 r.) oraz na rozkładach materiału
podręczników „Matematyka z plusem” (GWO) i „Matematyka z kluczem” (Nowa Era). Tam, gdzie oba podręczniki się różnią
(np. liczby ujemne, procenty, Pitagoras), gra idzie za jednym z nich.

Uwaga: od 1 września 2026 r. w klasach 1 i 4 obowiązuje nowa podstawa programowa. Tematy tych klas nie zostały jeszcze do niej dopasowane.

Każde zadanie losuje się na nowo. Wszystkie rodzaje zadań zostały sprawdzone automatycznie: osobny program przeliczył
ponad 600 000 wylosowanych zadań i nie znalazł błędnego wyniku ani błędnej bramki, która byłaby jednocześnie dobra.
Sprawdzone są też objaśnienia: każde obliczenie w każdym kroku (ponad 200 000 obliczeń, zero błędów).

## Światy

Każdy temat w levelu to inny świat: Most nad morzem, Las, Kanion, Śnieżne góry, Wulkan, Miasto nocą i Kosmos.
Młodsze levele mają więcej jasnych światów, starsze więcej miasta nocą, wulkanu i kosmosu.

## Dźwięk

Muzyka jest zagrana prawdziwymi brzmieniami instrumentów (zestaw FluidR3_GM, licencja MIT) i ma kilka stylów:
Wesoła, Przygoda, Chill, Elektro, a do tego Retro (dawne melodie tworzone przez samą grę). Każdy styl ma wersję do biegu i do walki.
Przy ustawieniu „Auto” levele 1–3 mają Wesołą, 4–6 Przygodę, a 7–8 Elektro. Przycisk „Muzyka” w menu i w pauzie zmienia styl
albo wyłącza muzykę. Efekty dźwiękowe tworzy sama gra; można je wyłączyć osobno.

Utwory są w folderze `muzyka/`. Tworzy je program `narzedzia/muzyka.py`: nuty są zapisane w kodzie,
program gra je instrumentami i zapisuje pętle MP3. Bez internetu gra używa dawnych melodii.

## Jak zagrać na iPhonie

Gra działa w przeglądarce Safari, bez instalowania ze sklepu.
Po otwarciu strony gry: przycisk „Udostępnij” → „Dodaj do ekranu początkowego”.
Na ekranie pojawi się ikona i gra otwiera się jak zwykła aplikacja.

Postęp (gwiazdki, otwarte gry) zapisuje się w telefonie, na którym grasz.

## Pliki

- `ZMIANY.md` – historia wersji: co dodano, zmieniono i usunięto
- `index.html` – wygląd ekranów
- `zadania.js` – wszystkie zadania dla klas 1–8 i objaśnienia, jak je policzyć
- `gra.js` – sama gra: bieg, walka z potworem, grafika, muzyka
- `muzyka/` – utwory w kilku stylach (MP3), `narzedzia/muzyka.py` – program, który je tworzy
- `manifest.webmanifest`, `ikona-180.png`, `ikona-512.png` – ikona i nazwa na ekranie telefonu
