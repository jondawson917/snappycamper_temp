INSERT INTO users (username, password, fullName, state, is_admin)
VALUES ('testadmin',
        '$2b$12$ARsrVQBHATeA2WJBe0MvdOBXOxo8fcgAXH8NUm5FhTJxcLhWXGw.u',
        'Mark Bigham',
        'GA',
        TRUE),
       ('testuser',
        '$2b$12$ARsrVQBHATeA2WJBe0MvdOBXOxo8fcgAXH8NUm5FhTJxcLhWXGw.u', 'Tom Harrison',
        'CA',
        FALSE);

INSERT INTO camps (parkName, parkCode, cost, image_url)
VALUES ('Alley Spring Campground','ozar', 30.00, 
'https://www.nps.gov/common/uploads/structured_data/97D6C606-E0E0-0E3E-658D4B56D865604D.jpg'),

('Anacapa Island Campground', 'chis', 15.00, 
'https://www.nps.gov/common/uploads/structured_data/3C7AB470-1DD8-B71B-0B72BD9A775B0E8C.jpg');

-- INSERT INTO facility (id, cellPhoneReception, toilets, boat_access, rv_access, wheelchair_access, camp_id)
-- VALUES (1, true, 'Vault Toilets - year round', true, true, true), (2, false, 'No Toilets', false, false, false);

-- INSERT INTO reservations (id, user_id, camp_id, commentary) 
-- VALUES ('testadmin', 'ozar', 'Kinda lame'), ('testuser', 'chis', 'It was a blast!');