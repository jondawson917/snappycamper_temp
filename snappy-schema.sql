DROP DATABASE snappycamper;
CREATE DATABASE snappycamper;
\c snappycamper;


DROP TABLE camps;
DROP TABLE users;

    CREATE TABLE camps (
    id serial PRIMARY KEY,
    parkCode VARCHAR(4) CHECK (parkCode = lower(parkCode)),
    parkName VARCHAR(45) NOT NULL,
    cost FLOAT CHECK (cost >=0) NOT NULL DEFAULT 0,
    image_url TEXT
    );

CREATE TABLE users (
    id serial PRIMARY KEY,
    username VARCHAR(25) UNIQUE,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    state VARCHAR(20),
    is_admin BOOLEAN NOT NULL DEFAULT false
);
CREATE TABLE reservations (
id serial PRIMARY KEY,
user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
camp_id INTEGER REFERENCES camps (id) ON DELETE CASCADE
);


-- CREATE TABLE facility (
--     id serial PRIMARY KEY,
--     parkCode VARCHAR(4),
--     cellPhoneReception TEXT NOT NULL,
--     toilets TEXT NOT NULL,
--     boat_access BOOLEAN,
--     rv_access BOOLEAN,
--     wheelchair_access BOOLEAN,
--     camp_id INTEGER REFERENCES camps (id) ON DELETE CASCADE
-- );
/* Future Expansion */
-- CREATE TABLE alerts (
--     parkName VARCHAR(25) NOT NULL,
--     description TEXT NOT NULL,
--     title TEXT NOT NULL,
--     category TEXT NOT NULL,
--     datetime TIMESTAMP DEFAULT NOW(),
--     PRIMARY KEY(parkName),
--     FOREIGN KEY(parkName) REFERENCES campsite ON DELETE CASCADE 
-- );

/*
CREATE SCHEMA shire;

CREATE TABLE shire.clans (
    id serial PRIMARY KEY,
    clan varchar
);

CREATE TABLE shire.hobbits (
    id serial PRIMARY KEY,
    hobbit varchar,
    clan_id integer REFERENCES shire.clans (id) ON DELETE CASCADE
);
*/



 