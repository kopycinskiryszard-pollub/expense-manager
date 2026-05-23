create table blockades
(
    id          int auto_increment
        primary key,
    identifier  varchar(100)                         not null,
    count       int      default 1                   not null,
    createdAt   datetime default current_timestamp() not null,
    lockedUntil datetime                             null,
    constraint identifier
        unique (identifier)
);

create table transactioncategories
(
    id          int auto_increment
        primary key,
    code        varchar(50)  not null,
    name        varchar(50)  not null,
    description varchar(255) null,
    type        tinyint(1)   not null,
    constraint code
        unique (code),
    constraint name
        unique (name)
);

create table users
(
    id        int auto_increment
        primary key,
    login     varchar(50)                                        not null,
    email     varchar(100)                                       not null,
    password  varchar(255)                                       not null,
    role      enum ('user', 'admin') default 'user'              not null,
    name      varchar(50)                                        null,
    surname   varchar(50)                                        null,
    birthdate date                                               null,
    city      varchar(100)                                       null,
    country   varchar(100)                                       null,
    createdAt datetime               default current_timestamp() not null,
    constraint email
        unique (email),
    constraint login
        unique (login)
);

create table budgets
(
    id          int auto_increment
        primary key,
    ownerId     int                                  not null,
    month       tinyint                              not null,
    year        smallint                             not null,
    limitAmount decimal(10, 2)                       not null,
    createdAt   datetime default current_timestamp() not null,
    constraint ownerId
        unique (ownerId, month, year),
    constraint `1`
        foreign key (ownerId) references users (id)
            on delete cascade,
    check (`month` between 1 and 12),
    check (`limitAmount` >= 0)
);

create table goals
(
    id            int auto_increment
        primary key,
    ownerId       int                                        not null,
    name          varchar(100)                               not null,
    targetAmount  decimal(10, 2)                             not null,
    currentAmount decimal(10, 2) default 0.00                not null,
    deadline      date                                       null,
    createdAt     datetime       default current_timestamp() not null,
    constraint `1`
        foreign key (ownerId) references users (id)
            on delete cascade,
    check (`targetAmount` > 0),
    check (`currentAmount` >= 0)
);

create index ownerId
    on goals (ownerId);

create table sessions
(
    sessionID varchar(128) not null
        primary key,
    userId    int          not null,
    expiresAt datetime     not null,
    constraint `1`
        foreign key (userId) references users (id)
            on delete cascade
);

create index userId
    on sessions (userId);

create table transactions
(
    id          int auto_increment
        primary key,
    categoryId  int                                  not null,
    name        varchar(31)                          not null,
    date        date                                 not null,
    amount      decimal(10, 2)                       not null,
    description varchar(255)                         null,
    ownerId     int                                  not null,
    createdAt   datetime default current_timestamp() not null,
    constraint `1`
        foreign key (categoryId) references transactioncategories (id),
    constraint `2`
        foreign key (ownerId) references users (id)
            on delete cascade,
    check (`amount` > 0)
);

create index categoryId
    on transactions (categoryId);

create index ownerId
    on transactions (ownerId);

