# Głupia Gra

Gra na telefon z matematyką ze szkoły podstawowej, od 1. do 8. klasy. Do wersji 4 nazywała się „Armia Liczb”.

Armia biegnie po moście. Przed każdą bramką pojawia się działanie, a na bramkach dwie odpowiedzi.
Wbiegasz w bramkę z dobrym wynikiem i dostajesz tylu żołnierzy, ile pokazuje zielona liczba (na przykład +14).
Zła odpowiedź zabiera tyle samo. Między bramkami czekają oddziały wroga i beczki z nagrodą.

Na końcu mostu walczysz z potworem. Walka idzie w rundach: na dole ekranu pojawia się zadanie,
a każda odpowiedź to jedna runda. Dobra odpowiedź przynosi posiłki, potem armia strzela, a na końcu potwór oddaje cios.
Zła albo spóźniona odpowiedź: nie ma posiłków, a potwór dorzuca kulę ognia. Szybkość odpowiedzi nie ma znaczenia,
liczy się tylko to, czy jest dobra (i czy zmieści się w czasie).

## Nauka po błędzie

Po złej odpowiedzi gra się zatrzymuje i pokazuje krok po kroku, jak to policzyć w pamięci.
Potem są 2 zadania tego samego rodzaju. Po dwóch dobrych odpowiedziach gra toczy się dalej.
Przy złej odpowiedzi lecą kciuki w dół i słychać „uuuuu”, a gra pokazuje rozwiązanie i daje kolejne zadanie (najwyżej 5).
Naukę można wyłączyć w menu albo w pauzie: „Nauka po błędzie: wył.”.

## Jak trudny jest potwór

Siła potwora jest liczona osobno dla każdej gry. Według symulacji (tysiące rozegranych gier):

- wszystkie bramki dobrze, a w walce odpowiedzi na chybił trafił: wygrana średnio w około 32% gier,
- wszystkie odpowiedzi w walce dobre: wygrana zawsze, niezależnie od tego, jak szybko się odpowiada.
  Cios potwora nigdy nie zabiera więcej żołnierzy, niż daje dobra odpowiedź.

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

## Dźwięk

Muzyka i efekty są tworzone przez samą grę, bez plików dźwiękowych. W menu i w pauzie można osobno wyłączyć muzykę i dźwięki.

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
- `manifest.webmanifest`, `ikona-180.png`, `ikona-512.png` – ikona i nazwa na ekranie telefonu
