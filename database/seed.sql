USE expense_manager;

TRUNCATE `transaction-categories`;

INSERT INTO `transaction-categories` (code, name, description, type)
VALUES ('salary', 'Wynagrodzenie', 'Stałe wynagrodzenie z pracy.', 0),
       ('bonus', 'Premia', 'Premie, nagrody i dodatkowe wypłaty od pracodawcy.', 0),
       ('freelance', 'Praca dodatkowa', 'Dochody z pracy dodatkowej, zleceń i usług.', 0),
       ('business_income', 'Działalność', 'Dochody z działalności gospodarczej lub sprzedaży usług.', 0),
       ('investment_income', 'Inwestycje', 'Dochody z inwestycji, lokat, odsetek lub dywidend.', 0),
       ('gift_income', 'Darowizny', 'Otrzymane pieniądze, prezenty i darowizny.', 0),
       ('refund', 'Zwroty', 'Zwroty pieniędzy, reklamacje i korekty płatności.', 0),
       ('other_income', 'Pozostałe dochody', 'Dochody niepasujące do pozostałych kategorii.', 0),

       ('food', 'Jedzenie', 'Zakupy spożywcze, posiłki i podstawowe produkty żywnościowe.', 1),
       ('housing', 'Mieszkanie', 'Czynsz, najem, media i opłaty mieszkaniowe.', 1),
       ('transport', 'Transport', 'Paliwo, bilety, komunikacja miejska, taksówki i przejazdy.', 1),
       ('health', 'Zdrowie', 'Leki, wizyty lekarskie, badania i inne koszty zdrowotne.', 1),
       ('education', 'Edukacja', 'Szkoła, studia, kursy, szkolenia i materiały edukacyjne.', 1),
       ('entertainment', 'Rozrywka', 'Kino, gry, wydarzenia, hobby i inne formy rozrywki.', 1),
       ('clothes', 'Odzież', 'Ubrania, obuwie, dodatki i akcesoria osobiste.', 1),
       ('electronics', 'Elektronika', 'Sprzęt elektroniczny, komputerowy i akcesoria.', 1),
       ('subscriptions', 'Subskrypcje', 'Abonamenty, platformy streamingowe i usługi cykliczne.', 1),
       ('travel', 'Podróże', 'Wyjazdy, noclegi, bilety, wakacje i koszty podróży.', 1),
       ('sport', 'Sport', 'Siłownia, zajęcia sportowe, sprzęt sportowy i aktywność fizyczna.', 1),
       ('family', 'Rodzina', 'Wydatki związane z rodziną, dziećmi i opieką.', 1),
       ('pets', 'Zwierzęta', 'Karma, weterynarz, akcesoria i utrzymanie zwierząt.', 1),
       ('taxes', 'Podatki i opłaty', 'Podatki, mandaty, opłaty urzędowe i administracyjne.', 1),
       ('insurance', 'Ubezpieczenia', 'Ubezpieczenia zdrowotne, komunikacyjne, mieszkaniowe i inne.', 1),
       ('home_equipment', 'Wyposażenie domu', 'Meble, sprzęty domowe, dekoracje i wyposażenie mieszkania.', 1),
       ('hygiene', 'Higiena i kosmetyki', 'Kosmetyki, środki czystości i produkty higieniczne.', 1),
       ('goals', 'Cele oszczędnościowe', 'Wpłaty na cele finansowe użytkownika.', 1),
       ('uncategorized', 'Nieskategoryzowane', 'Transakcje bez przypisanej szczegółowej kategorii.', 1);