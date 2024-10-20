-- Migration number: 0000 	 2024-10-20T22:39:29.549Z
CREATE TABLE reservations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    reservation_date DATE NOT NULL,
    reservation_time TIME NOT NULL,
    number_of_guests INTEGER NOT NULL,
    special_requests TEXT,
    allergy TEXT,
    communication_consent BOOLEAN NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE blocked_days (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    block_date DATE NOT NULL
);