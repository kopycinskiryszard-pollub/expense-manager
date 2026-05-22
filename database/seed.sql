USE expense_manager;

INSERT INTO transactionCategories (name, description, type) VALUES
                                                                ('salary', 'Wynagrodzenie', 0),
                                                                ('bonus', 'Premia lub dodatkowy dochód', 0),
                                                                ('gift', 'Prezent lub otrzymane środki', 0),
                                                                ('other_income', 'Inny dochód', 0),

                                                                ('food', 'Jedzenie i zakupy spożywcze', 1),
                                                                ('housing', 'Mieszkanie, czynsz, opłaty', 1),
                                                                ('transport', 'Transport, paliwo, bilety', 1),
                                                                ('health', 'Zdrowie i leki', 1),
                                                                ('education', 'Edukacja i kursy', 1),
                                                                ('entertainment', 'Rozrywka', 1),
                                                                ('clothes', 'Odzież i obuwie', 1),
                                                                ('electronics', 'Elektronika', 1),
                                                                ('subscriptions', 'Subskrypcje i usługi cykliczne', 1),
                                                                ('travel', 'Podróże', 1),
                                                                ('sport', 'Sport i aktywność fizyczna', 1),
                                                                ('family', 'Rodzina i dzieci', 1),
                                                                ('pets', 'Zwierzęta', 1),
                                                                ('taxes', 'Podatki i opłaty urzędowe', 1),
                                                                ('goals', 'Wpłaty na cele finansowe', 1),
                                                                ('other', 'Inne wydatki', 1);