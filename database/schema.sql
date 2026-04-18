-- =====================================================
-- College Event Registration System - SQLite Schema
-- Save this file as: database/schema.sql
-- =====================================================

-- Turn on foreign key support in SQLite.
-- (Required so event_id must match an existing event.)
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------
-- Table 1: events
-- Stores all events created by admin.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique event ID
    name TEXT NOT NULL,                   -- Event name
    date TEXT NOT NULL,                   -- Event date (YYYY-MM-DD)
    location TEXT NOT NULL,               -- Event location
    description TEXT,                     -- Optional description
    eligibility_criteria TEXT NOT NULL DEFAULT 'Open to All', -- Eligibility rule
    seat_capacity INTEGER NOT NULL DEFAULT 100,               -- Total confirmed seats
    enable_waitlist INTEGER NOT NULL DEFAULT 0,               -- 1 = waitlist enabled
    custom_fields_json TEXT NOT NULL DEFAULT '[]'             -- Custom form fields
);

-- -----------------------------------------------------
-- Table 2: registrations
-- Stores student registrations for events.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- Unique registration ID
    student_name TEXT NOT NULL,           -- Student full name
    enrollment_no TEXT NOT NULL,          -- Enrollment number
    email TEXT NOT NULL,                  -- Student email
    department TEXT NOT NULL,             -- Student department
    phone TEXT NOT NULL,                  -- Student phone number
    event_id INTEGER NOT NULL,            -- Linked event ID
    registration_status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed / waitlisted
    custom_answers_json TEXT NOT NULL DEFAULT '{}',        -- Answers for custom fields

    -- Foreign key: each registration must belong to one event.
    -- ON DELETE CASCADE: if an event is deleted, related registrations are deleted too.
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Table 3: feedback
-- Stores event feedback from registered students.
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    student_name TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comments TEXT,
    created_at TEXT,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);
