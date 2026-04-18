-- College Event Registration System schema (backend-api)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  eligibility_criteria TEXT NOT NULL DEFAULT 'Open to All',
  seat_capacity INTEGER NOT NULL DEFAULT 100,
  enable_waitlist INTEGER NOT NULL DEFAULT 0,
  custom_fields_json TEXT NOT NULL DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_name TEXT NOT NULL,
  enrollment_no TEXT NOT NULL,
  email TEXT NOT NULL,
  department TEXT NOT NULL,
  phone TEXT NOT NULL,
  event_id INTEGER NOT NULL,
  registration_status TEXT NOT NULL DEFAULT 'confirmed',
  custom_answers_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY (event_id) REFERENCES events(id)
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  registration_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  student_name TEXT NOT NULL,
  rating INTEGER NOT NULL,
  comments TEXT,
  created_at TEXT,
  FOREIGN KEY (registration_id) REFERENCES registrations(id),
  FOREIGN KEY (event_id) REFERENCES events(id)
);
