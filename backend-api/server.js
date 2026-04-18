// Backend API server for College Event Registration System
// Runs on port 5000 and serves JSON APIs for student and admin portals.
const path = require('path');
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const localOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:4000',
];

const configuredOrigins = String(process.env.CORS_ORIGINS || process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...localOrigins, ...configuredOrigins]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
app.use(express.json());

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'database', 'college_events.db');
const db = new sqlite3.Database(dbPath, (error) => {
  if (error) {
    console.error('Database connection failed:', error.message);
  } else {
    console.log('Connected to SQLite:', dbPath);
  }
});

function parseJsonSafe(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }

  if (typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function normalizeCustomFieldList(customFieldsInput) {
  const list = Array.isArray(customFieldsInput)
    ? customFieldsInput
    : parseJsonSafe(customFieldsInput, []);

  return list
    .map((field, index) => {
      const key = String(field.key || field.name || `field_${index + 1}`).trim();
      const label = String(field.label || field.name || `Field ${index + 1}`).trim();
      const type = ['text', 'number', 'date', 'textarea', 'select'].includes(field.type) ? field.type : 'text';
      const options = Array.isArray(field.options)
        ? field.options.map((option) => String(option).trim()).filter(Boolean)
        : String(field.options || '')
            .split(',')
            .map((option) => option.trim())
            .filter(Boolean);

      if (!label || !key) {
        return null;
      }

      return {
        key,
        label,
        type,
        required: Boolean(field.required),
        options,
      };
    })
    .filter(Boolean);
}

function normalizeCustomAnswers(customAnswersInput) {
  const answers = parseJsonSafe(customAnswersInput, {});
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
    return {};
  }

  return answers;
}

function decorateEvent(row) {
  return {
    ...row,
    seat_capacity: Number(row.seat_capacity || 0),
    enable_waitlist: Number(row.enable_waitlist || 0),
    custom_fields: parseJsonSafe(row.custom_fields_json, []),
  };
}

function decorateRegistration(row) {
  return {
    ...row,
    registration_status: row.registration_status || 'confirmed',
    feedback_status: Number(row.feedback_count || 0) > 0 ? 'submitted' : 'not_submitted',
    custom_answers: parseJsonSafe(row.custom_answers_json, {}),
  };
}

function toCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function buildCsv(columns, rows) {
  const headerRow = columns.join(',');
  const bodyRows = rows.map((row) => columns.map((column) => toCsvValue(row[column])).join(','));
  return [headerRow, ...bodyRows].join('\n');
}

function buildDummyAnswers(fieldList, eventIndex) {
  const answers = {};

  fieldList.forEach((field, fieldIndex) => {
    if (field.type === 'select' && field.options.length > 0) {
      answers[field.key] = field.options[(eventIndex + fieldIndex) % field.options.length];
      return;
    }

    if (field.type === 'number') {
      answers[field.key] = String(((eventIndex + fieldIndex) % 4) + 2);
      return;
    }

    if (field.type === 'date') {
      const day = String(((eventIndex + fieldIndex) % 20) + 1).padStart(2, '0');
      answers[field.key] = `2026-05-${day}`;
      return;
    }

    if (field.type === 'textarea') {
      answers[field.key] = `${field.label} details ${eventIndex + 1}`;
      return;
    }

    answers[field.key] = `${field.label} ${eventIndex + 1}`;
  });

  return answers;
}

const demoEvents = [
  {
    name: 'Tech Fest 2026',
    date: '2026-05-10',
    location: 'Main Auditorium',
    description: 'Annual technology festival showcasing student projects and innovation.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 6,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'project_title', label: 'Project Title', type: 'text', required: true },
      { key: 'team_size', label: 'Team Size', type: 'number', required: true },
    ],
  },
  {
    name: 'Coding Competition',
    date: '2026-05-15',
    location: 'Computer Lab 1',
    description: 'Competitive programming contest for all students.',
    eligibility_criteria: 'CSE and IT Students',
    seat_capacity: 5,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'preferred_language', label: 'Preferred Language', type: 'select', required: true, options: ['C', 'C++', 'Java', 'Python'] },
      { key: 'problem_solving_level', label: 'Problem Solving Level', type: 'select', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
    ],
  },
  {
    name: 'AI Workshop',
    date: '2026-05-22',
    location: 'Seminar Hall',
    description: 'Hands-on workshop on Artificial Intelligence and Machine Learning.',
    eligibility_criteria: 'CSE Department Only',
    seat_capacity: 20,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'ai_experience', label: 'Prior AI Experience', type: 'select', required: true, options: ['Beginner', 'Some Experience', 'Advanced'] },
      { key: 'laptop_available', label: 'Laptop Available', type: 'select', required: true, options: ['Yes', 'No'] },
    ],
  },
  {
    name: 'Cyber Security Seminar',
    date: '2026-05-28',
    location: 'Conference Room A',
    description: 'Seminar on cyber safety, phishing awareness, and secure digital habits.',
    eligibility_criteria: 'IT and CSE Students',
    seat_capacity: 4,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'security_interest', label: 'Security Interest', type: 'select', required: true, options: ['Beginner', 'Intermediate', 'Advanced'] },
      { key: 'topic_choice', label: 'Topic Choice', type: 'select', required: true, options: ['Phishing', 'Malware', 'Password Safety', 'Network Security'] },
    ],
  },
  {
    name: 'Sports Day',
    date: '2026-06-05',
    location: 'Sports Stadium',
    description: 'Annual inter-class sports competition and athletic events.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 12,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'game_interest', label: 'Game Interest', type: 'select', required: true, options: ['Cricket', 'Football', 'Athletics'] },
      { key: 'house_name', label: 'House Name', type: 'text', required: false },
    ],
  },
  {
    name: 'Cultural Night',
    date: '2026-06-15',
    location: 'Open Air Theatre',
    description: 'Evening showcase of cultural performances and talent.',
    eligibility_criteria: 'Final Year Students',
    seat_capacity: 10,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'performance_type', label: 'Performance Type', type: 'select', required: true, options: ['Dance', 'Singing', 'Drama', 'Speech'] },
      { key: 'stage_name', label: 'Stage Name', type: 'text', required: false },
    ],
  },
  {
    name: 'Hackathon',
    date: '2026-06-20',
    location: 'Innovation Lab',
    description: '24-hour team hackathon for solving real college problems.',
    eligibility_criteria: 'CSE, IT, and Cyber Security Students',
    seat_capacity: 7,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'team_name', label: 'Team Name', type: 'text', required: true },
      { key: 'project_area', label: 'Project Area', type: 'select', required: true, options: ['Web App', 'Mobile App', 'AI', 'IoT'] },
    ],
  },
  {
    name: 'Poster Presentation',
    date: '2026-06-24',
    location: 'Seminar Hall B',
    description: 'Poster showcase on academic and technical ideas.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 4,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'poster_topic', label: 'Poster Topic', type: 'text', required: true },
      { key: 'participants', label: 'Number of Participants', type: 'number', required: true },
    ],
  },
  {
    name: 'Robotics Demo',
    date: '2026-06-27',
    location: 'Mechanical Lab',
    description: 'Live robotics demonstration with student-built models.',
    eligibility_criteria: 'Mechanical, Electrical and IT Students',
    seat_capacity: 6,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'robot_name', label: 'Robot Name', type: 'text', required: true },
      { key: 'category', label: 'Category', type: 'select', required: true, options: ['Autonomous', 'Line Follower', 'Arm Robot', 'Drone'] },
    ],
  },
  {
    name: 'Career Guidance Session',
    date: '2026-07-02',
    location: 'Placement Cell Hall',
    description: 'Guidance on resumes, interviews, and career planning.',
    eligibility_criteria: 'Final Year Students',
    seat_capacity: 15,
    enable_waitlist: 1,
    custom_fields: [
      { key: 'career_interest', label: 'Career Interest', type: 'select', required: true, options: ['Higher Studies', 'Placement', 'Startup', 'Government Jobs'] },
      { key: 'resume_ready', label: 'Resume Ready', type: 'select', required: true, options: ['Yes', 'No'] },
    ],
  },
];

const registrationDepartments = ['IT', 'CSE', 'Cyber Security', 'Mechanical', 'Civil', 'Electrical'];
const registrationFirstNames = ['Aditi', 'Arjun', 'Kavya', 'Rohan', 'Sneha', 'Ankit', 'Pooja', 'Nikhil', 'Meera', 'Yash'];
const registrationLastNames = ['Sharma', 'Patel', 'Singh', 'Verma', 'Iyer'];
const registrationEventPlan = [
  'Tech Fest 2026', 'Tech Fest 2026', 'Tech Fest 2026', 'Tech Fest 2026', 'Tech Fest 2026',
  'Tech Fest 2026', 'Tech Fest 2026', 'Tech Fest 2026',
  'Coding Competition', 'Coding Competition', 'Coding Competition', 'Coding Competition',
  'Coding Competition', 'Coding Competition', 'Coding Competition',
  'Cyber Security Seminar', 'Cyber Security Seminar', 'Cyber Security Seminar',
  'Cyber Security Seminar', 'Cyber Security Seminar',
  'AI Workshop', 'AI Workshop', 'AI Workshop', 'AI Workshop', 'AI Workshop', 'AI Workshop', 'AI Workshop', 'AI Workshop',
  'Sports Day', 'Sports Day', 'Sports Day', 'Sports Day',
  'Cultural Night', 'Cultural Night', 'Cultural Night', 'Cultural Night',
  'Hackathon', 'Hackathon', 'Hackathon', 'Hackathon',
  'Poster Presentation', 'Poster Presentation', 'Poster Presentation',
  'Robotics Demo', 'Robotics Demo', 'Robotics Demo',
  'Career Guidance Session', 'Career Guidance Session',
];

function getDepartmentCode(department) {
  const departmentCodeMap = {
    IT: 'IT',
    CSE: 'CSE',
    'Cyber Security': 'CYB',
    Mechanical: 'ME',
    Civil: 'CE',
    Electrical: 'EE',
  };

  return departmentCodeMap[department] || 'GEN';
}

function buildRegistrationSeedTemplates() {
  return registrationEventPlan.map((eventName, index) => {
    const firstName = registrationFirstNames[index % registrationFirstNames.length];
    const lastName = registrationLastNames[Math.floor(index / registrationFirstNames.length) % registrationLastNames.length];
    const department = registrationDepartments[index % registrationDepartments.length];

    return {
      student_name: `${firstName} ${lastName}`,
      enrollment_no: `SOU26-${getDepartmentCode(department)}-${String(101 + index).padStart(3, '0')}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index + 1}@student.silveroak.edu`,
      department,
      phone: `98765${String(10000 + index).slice(-5)}`,
      event_name: eventName,
    };
  });
}

function seedDemoEvents(done) {
    db.all('SELECT id, name FROM events', [], (error, existingRows) => {
      if (error) {
        console.error('Error checking existing events for seeding:', error.message);
        if (done) {
          done();
        }
        return;
      }

      const existingEventMap = new Map(existingRows.map((row) => [row.name, row.id]));
      let remaining = demoEvents.length;

      demoEvents.forEach((demoEvent) => {
        const params = [
          demoEvent.name,
          demoEvent.date,
          demoEvent.location,
          demoEvent.description,
          demoEvent.eligibility_criteria,
          Number(demoEvent.seat_capacity || 100),
          Number(demoEvent.enable_waitlist || 0),
          JSON.stringify(demoEvent.custom_fields),
        ];

        const query = existingEventMap.has(demoEvent.name)
          ? 'UPDATE events SET date = ?, location = ?, description = ?, eligibility_criteria = ?, seat_capacity = ?, enable_waitlist = ?, custom_fields_json = ? WHERE name = ?'
          : 'INSERT INTO events (name, date, location, description, eligibility_criteria, seat_capacity, enable_waitlist, custom_fields_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

        const finalParams = existingEventMap.has(demoEvent.name)
          ? [
              demoEvent.date,
              demoEvent.location,
              demoEvent.description,
              demoEvent.eligibility_criteria,
              Number(demoEvent.seat_capacity || 100),
              Number(demoEvent.enable_waitlist || 0),
              JSON.stringify(demoEvent.custom_fields),
              demoEvent.name,
            ]
          : params;

        db.run(query, finalParams, (runError) => {
          if (runError) {
            console.error('Error saving demo event:', runError.message);
          }

          remaining -= 1;
          if (remaining === 0 && done) {
            done();
          }
        });
      });
    });
  }

  function seedDemoRegistrations(done) {
    const targetRegistrationCount = 50;

    db.get('SELECT COUNT(*) AS count FROM registrations', [], (error, row) => {
      if (error) {
        console.error('Error checking registrations table:', error.message);
        if (done) {
          done();
        }
        return;
      }

      const needed = Math.max(targetRegistrationCount - Number(row.count || 0), 0);
      if (needed === 0) {
        if (done) {
          done();
        }
        return;
      }

      const candidates = buildRegistrationSeedTemplates();

      db.all('SELECT enrollment_no FROM registrations', [], (existingError, registrationRows) => {
        if (existingError) {
          console.error('Error loading existing registrations for seeding:', existingError.message);
          if (done) {
            done();
          }
          return;
        }

        db.all('SELECT id, name, custom_fields_json, seat_capacity, enable_waitlist FROM events ORDER BY date ASC', [], (eventsError, eventRows) => {
          if (eventsError) {
            console.error('Error loading events for registration seeding:', eventsError.message);
            if (done) {
              done();
            }
            return;
          }

          const existingEnrollmentSet = new Set(registrationRows.map((registrationRow) => registrationRow.enrollment_no));
          const eventMap = new Map(eventRows.map((eventRow) => [eventRow.name, eventRow]));

          function insertNext(candidateIndex, insertedCount) {
            if (insertedCount >= needed || candidateIndex >= candidates.length) {
              if (done) {
                done();
              }
              return;
            }

            const candidate = candidates[candidateIndex];

            if (existingEnrollmentSet.has(candidate.enrollment_no)) {
              insertNext(candidateIndex + 1, insertedCount);
              return;
            }

            const eventRow = eventMap.get(candidate.event_name);
            if (!eventRow) {
              insertNext(candidateIndex + 1, insertedCount);
              return;
            }

            const fieldList = parseJsonSafe(eventRow.custom_fields_json, []);
            const customAnswers = buildDummyAnswers(fieldList, candidateIndex);

            db.get(
              'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND registration_status = ?',
              [eventRow.id, 'confirmed'],
              (countError, countRow) => {
                if (countError) {
                  console.error('Error checking event confirmed count during seeding:', countError.message);
                  insertNext(candidateIndex + 1, insertedCount);
                  return;
                }

                const seatCapacity = Number(eventRow.seat_capacity || 0);
                const waitlistEnabled = Number(eventRow.enable_waitlist || 0) === 1;
                let registrationStatus = 'confirmed';

                if (seatCapacity > 0 && Number(countRow.count || 0) >= seatCapacity) {
                  registrationStatus = waitlistEnabled ? 'waitlisted' : 'confirmed';
                }

                db.run(
                  'INSERT INTO registrations (student_name, enrollment_no, email, department, phone, event_id, custom_answers_json, registration_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  [
                    candidate.student_name,
                    candidate.enrollment_no,
                    candidate.email,
                    candidate.department,
                    candidate.phone,
                    eventRow.id,
                    JSON.stringify(customAnswers),
                    registrationStatus,
                  ],
                  (insertError) => {
                    if (insertError) {
                      console.error('Error seeding demo registration:', insertError.message);
                      insertNext(candidateIndex + 1, insertedCount);
                      return;
                    }

                    existingEnrollmentSet.add(candidate.enrollment_no);
                    insertNext(candidateIndex + 1, insertedCount + 1);
                  }
                );
              }
            );
          }

          insertNext(0, 0);
        });
      });
    });
  }

  function seedDemoFeedback(done) {
    const targetFeedbackCount = 12;

    db.get('SELECT COUNT(*) AS count FROM feedback', [], (feedbackError, feedbackRow) => {
      if (feedbackError) {
        console.error('Error checking feedback table:', feedbackError.message);
        if (done) {
          done();
        }
        return;
      }

      const needed = Math.max(targetFeedbackCount - Number(feedbackRow.count || 0), 0);
      if (needed === 0) {
        if (done) {
          done();
        }
        return;
      }

      const feedbackComments = [
        'Very well organised and informative.',
        'Good event with clear instructions.',
        'The workshop was useful for students.',
        'Nice interaction and practical session.',
        'Well managed and easy to follow.',
        'A helpful event for learning new skills.',
        'The team coordinated everything nicely.',
        'Content was relevant and easy to understand.',
        'Good student participation and presentation.',
        'Overall a positive experience.',
        'The session helped me learn a lot.',
        'Simple but very useful event.',
      ];

      db.all(
        `
          SELECT r.id AS registration_id, r.event_id, r.student_name
          FROM registrations r
          LEFT JOIN feedback f ON f.registration_id = r.id
          WHERE r.registration_status = 'confirmed' AND f.id IS NULL
          ORDER BY r.id ASC
        `,
        [],
        (registrationsError, candidates) => {
          if (registrationsError) {
            console.error('Error selecting feedback seed registrations:', registrationsError.message);
            if (done) {
              done();
            }
            return;
          }

          let insertedCount = 0;

          function insertFeedbackNext(index) {
            if (insertedCount >= needed || index >= candidates.length) {
              if (done) {
                done();
              }
              return;
            }

            const candidate = candidates[index];
            const rating = (index % 5) + 1;

            db.run(
              'INSERT INTO feedback (registration_id, event_id, student_name, rating, comments, created_at) VALUES (?, ?, ?, ?, ?, ?)',
              [
                candidate.registration_id,
                candidate.event_id,
                candidate.student_name,
                rating,
                feedbackComments[index % feedbackComments.length],
                new Date().toISOString(),
              ],
              (insertError) => {
                if (insertError) {
                  console.error('Error seeding feedback:', insertError.message);
                  insertFeedbackNext(index + 1);
                  return;
                }

                insertedCount += 1;
                insertFeedbackNext(index + 1);
              }
            );
          }

          insertFeedbackNext(0);
        }
      );
    });
  }

  function seedAllDemoData() {
    seedDemoEvents(() => {
      seedDemoRegistrations(() => {
        seedDemoFeedback();
      });
    });
  }

// Create required tables if not already created.
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  db.run(`
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
    )
  `);

  db.run(`
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
    )
  `);

  db.run(`
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
    )
  `);

  db.all('PRAGMA table_info(events)', [], (error, columns) => {
    if (error) {
      console.error('Error checking events table structure:', error.message);
      return;
    }

    const hasEligibilityColumn = columns.some((column) => column.name === 'eligibility_criteria');
    const hasCustomFieldsColumn = columns.some((column) => column.name === 'custom_fields_json');
    const hasSeatCapacityColumn = columns.some((column) => column.name === 'seat_capacity');
    const hasEnableWaitlistColumn = columns.some((column) => column.name === 'enable_waitlist');

    if (!hasEligibilityColumn) {
      db.run(
        "ALTER TABLE events ADD COLUMN eligibility_criteria TEXT NOT NULL DEFAULT 'Open to All'",
        (alterError) => {
          if (alterError) {
            console.error('Error adding eligibility column:', alterError.message);
            return;
          }

          db.run("UPDATE events SET eligibility_criteria = 'Open to All' WHERE eligibility_criteria IS NULL OR TRIM(eligibility_criteria) = ''");
        }
      );
    } else {
      db.run("UPDATE events SET eligibility_criteria = 'Open to All' WHERE eligibility_criteria IS NULL OR TRIM(eligibility_criteria) = ''");
    }

    if (!hasCustomFieldsColumn) {
      db.run(
        "ALTER TABLE events ADD COLUMN custom_fields_json TEXT NOT NULL DEFAULT '[]'",
        (alterError) => {
          if (alterError) {
            console.error('Error adding custom fields column:', alterError.message);
            return;
          }

          db.run("UPDATE events SET custom_fields_json = '[]' WHERE custom_fields_json IS NULL OR TRIM(custom_fields_json) = ''");
        }
      );
    } else {
      db.run("UPDATE events SET custom_fields_json = '[]' WHERE custom_fields_json IS NULL OR TRIM(custom_fields_json) = ''");
    }

    if (!hasSeatCapacityColumn) {
      db.run('ALTER TABLE events ADD COLUMN seat_capacity INTEGER NOT NULL DEFAULT 100', (alterError) => {
        if (alterError) {
          console.error('Error adding seat capacity column:', alterError.message);
          return;
        }

        db.run('UPDATE events SET seat_capacity = 100 WHERE seat_capacity IS NULL OR seat_capacity <= 0');
      });
    } else {
      db.run('UPDATE events SET seat_capacity = 100 WHERE seat_capacity IS NULL OR seat_capacity <= 0');
    }

    if (!hasEnableWaitlistColumn) {
      db.run('ALTER TABLE events ADD COLUMN enable_waitlist INTEGER NOT NULL DEFAULT 0', (alterError) => {
        if (alterError) {
          console.error('Error adding enable waitlist column:', alterError.message);
          return;
        }

        db.run('UPDATE events SET enable_waitlist = 0 WHERE enable_waitlist IS NULL');
      });
    } else {
      db.run('UPDATE events SET enable_waitlist = 0 WHERE enable_waitlist IS NULL');
    }

    db.run(`
      UPDATE events
      SET eligibility_criteria = CASE name
        WHEN 'Tech Fest 2026' THEN 'Open to All'
        WHEN 'Coding Competition' THEN 'CSE and IT Students'
        WHEN 'AI Workshop' THEN 'CSE Department Only'
        WHEN 'Sports Day' THEN 'Open to All'
        WHEN 'Cultural Night' THEN 'Final Year Students'
        ELSE eligibility_criteria
      END
      WHERE name IN ('Tech Fest 2026', 'Coding Competition', 'AI Workshop', 'Sports Day', 'Cultural Night')
    `);

    seedAllDemoData();
  });

  db.all('PRAGMA table_info(registrations)', [], (registrationError, registrationColumns) => {
    if (registrationError) {
      console.error('Error checking registrations table structure:', registrationError.message);
      return;
    }

    const hasCustomAnswersColumn = registrationColumns.some((column) => column.name === 'custom_answers_json');
    const hasRegistrationStatusColumn = registrationColumns.some((column) => column.name === 'registration_status');

    if (!hasCustomAnswersColumn) {
      db.run(
        "ALTER TABLE registrations ADD COLUMN custom_answers_json TEXT NOT NULL DEFAULT '{}'",
        (alterError) => {
          if (alterError) {
            console.error('Error adding custom answers column:', alterError.message);
            return;
          }

          db.run("UPDATE registrations SET custom_answers_json = '{}' WHERE custom_answers_json IS NULL OR TRIM(custom_answers_json) = ''");
        }
      );
    } else {
      db.run("UPDATE registrations SET custom_answers_json = '{}' WHERE custom_answers_json IS NULL OR TRIM(custom_answers_json) = ''");
    }

    if (!hasRegistrationStatusColumn) {
      db.run("ALTER TABLE registrations ADD COLUMN registration_status TEXT NOT NULL DEFAULT 'confirmed'", (alterError) => {
        if (alterError) {
          console.error('Error adding registration status column:', alterError.message);
          return;
        }

        db.run("UPDATE registrations SET registration_status = 'confirmed' WHERE registration_status IS NULL OR TRIM(registration_status) = ''");
      });
    } else {
      db.run("UPDATE registrations SET registration_status = 'confirmed' WHERE registration_status IS NULL OR TRIM(registration_status) = ''");
    }
  });

  db.get('SELECT COUNT(*) as count FROM events', [], (error, row) => {
    if (error) {
      console.error('Error checking events table:', error.message);
      return;
    }

    seedAllDemoData();
  });
});

// GET /events
app.get('/events', (req, res) => {
  const query = `
    SELECT
      e.*,
      COALESCE(SUM(CASE WHEN r.registration_status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed_count,
      COALESCE(SUM(CASE WHEN r.registration_status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlist_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    GROUP BY e.id
    ORDER BY e.date ASC
  `;

  db.all(query, [], (error, rows) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch events.' });
    }

    const result = rows.map((row) => {
      const eventData = decorateEvent(row);
      const confirmedCount = Number(row.confirmed_count || 0);
      const waitlistCount = Number(row.waitlist_count || 0);
      const seatCapacity = Number(row.seat_capacity || 0);

      return {
        ...eventData,
        confirmed_count: confirmedCount,
        waitlist_count: waitlistCount,
        available_seats: seatCapacity > 0 ? Math.max(seatCapacity - confirmedCount, 0) : 0,
      };
    });

    res.json(result);
  });
});

// POST /events
app.post('/events', (req, res) => {
  const { name, date, location, description, eligibility_criteria, seat_capacity, enable_waitlist, custom_fields } = req.body;

  if (!name || !date || !location) {
    return res.status(400).json({ message: 'Name, date, and location are required.' });
  }

  const eligibility = eligibility_criteria || 'Open to All';
  const seatCapacityValue = Number(seat_capacity);
  const normalizedSeatCapacity = Number.isFinite(seatCapacityValue) && seatCapacityValue > 0 ? Math.floor(seatCapacityValue) : 100;
  const normalizedEnableWaitlist = Number(enable_waitlist) === 1 ? 1 : 0;
  const customFieldsJson = JSON.stringify(normalizeCustomFieldList(custom_fields));

  db.run(
    'INSERT INTO events (name, date, location, description, eligibility_criteria, seat_capacity, enable_waitlist, custom_fields_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, date, location, description || '', eligibility, normalizedSeatCapacity, normalizedEnableWaitlist, customFieldsJson],
    function onInsert(error) {
      if (error) {
        return res.status(500).json({ message: 'Failed to add event.' });
      }

      res.status(201).json({
        message: 'Event added successfully.',
        event: {
          id: this.lastID,
          name,
          date,
          location,
          description: description || '',
          eligibility_criteria: eligibility,
          seat_capacity: normalizedSeatCapacity,
          enable_waitlist: normalizedEnableWaitlist,
          confirmed_count: 0,
          waitlist_count: 0,
          available_seats: normalizedSeatCapacity,
          custom_fields: parseJsonSafe(customFieldsJson, []),
        },
      });
    }
  );
});

// PUT /events/:id
app.put('/events/:id', (req, res) => {
  const eventId = Number(req.params.id);
  const { name, date, location, description, eligibility_criteria, seat_capacity, enable_waitlist, custom_fields } = req.body;

  if (!eventId) {
    return res.status(400).json({ message: 'Valid event ID is required.' });
  }

  if (!name || !date || !location) {
    return res.status(400).json({ message: 'Name, date, and location are required.' });
  }

  const eligibility = eligibility_criteria || 'Open to All';
  const seatCapacityValue = Number(seat_capacity);
  const normalizedSeatCapacity = Number.isFinite(seatCapacityValue) && seatCapacityValue > 0 ? Math.floor(seatCapacityValue) : 100;
  const normalizedEnableWaitlist = Number(enable_waitlist) === 1 ? 1 : 0;
  const customFieldsJson = JSON.stringify(normalizeCustomFieldList(custom_fields));

  db.run(
    'UPDATE events SET name = ?, date = ?, location = ?, description = ?, eligibility_criteria = ?, seat_capacity = ?, enable_waitlist = ?, custom_fields_json = ? WHERE id = ?',
    [name, date, location, description || '', eligibility, normalizedSeatCapacity, normalizedEnableWaitlist, customFieldsJson, eventId],
    function onUpdate(error) {
      if (error) {
        return res.status(500).json({ message: 'Failed to update event.' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Event not found.' });
      }

      res.json({
        message: 'Event updated successfully.',
        event: {
          id: eventId,
          name,
          date,
          location,
          description: description || '',
          eligibility_criteria: eligibility,
          seat_capacity: normalizedSeatCapacity,
          enable_waitlist: normalizedEnableWaitlist,
          custom_fields: parseJsonSafe(customFieldsJson, []),
        },
      });
    }
  );
});

// DELETE /events/:id
app.delete('/events/:id', (req, res) => {
  const eventId = Number(req.params.id);

  if (!eventId) {
    return res.status(400).json({ message: 'Valid event ID is required.' });
  }

  // Delete linked registrations first to keep beginner-friendly behavior reliable.
  db.run('BEGIN TRANSACTION', (beginError) => {
    if (beginError) {
      return res.status(500).json({ message: 'Failed to start delete transaction.' });
    }

    db.run('DELETE FROM feedback WHERE event_id = ?', [eventId], (feedbackDeleteError) => {
      if (feedbackDeleteError) {
        db.run('ROLLBACK');
        return res.status(500).json({ message: 'Failed to delete related feedback.' });
      }

      db.run('DELETE FROM registrations WHERE event_id = ?', [eventId], (registrationDeleteError) => {
        if (registrationDeleteError) {
          db.run('ROLLBACK');
          return res.status(500).json({ message: 'Failed to delete related registrations.' });
        }

        db.run('DELETE FROM events WHERE id = ?', [eventId], function onDelete(eventDeleteError) {
          if (eventDeleteError) {
            db.run('ROLLBACK');
            return res.status(500).json({ message: 'Failed to delete event.' });
          }

          if (this.changes === 0) {
            db.run('ROLLBACK');
            return res.status(404).json({ message: 'Event not found.' });
          }

          db.run('COMMIT', (commitError) => {
            if (commitError) {
              db.run('ROLLBACK');
              return res.status(500).json({ message: 'Failed to finalize delete transaction.' });
            }
            res.json({ message: 'Event deleted successfully.' });
          });
        });
      });
    });
  });
});

// POST /register
app.post('/register', (req, res) => {
  const { student_name, enrollment_no, email, department, phone, event_id, custom_answers } = req.body;

  if (!student_name || !enrollment_no || !email || !department || !phone || !event_id) {
    return res.status(400).json({ message: 'All registration fields are required.' });
  }

  db.get('SELECT * FROM events WHERE id = ?', [event_id], (eventError, eventRow) => {
    if (eventError) {
      return res.status(500).json({ message: 'Failed to validate event.' });
    }

    if (!eventRow) {
      return res.status(400).json({ message: 'Selected event does not exist.' });
    }

    const eventCustomFields = parseJsonSafe(eventRow.custom_fields_json, []);
    const answers = normalizeCustomAnswers(custom_answers);

    for (const field of eventCustomFields) {
      if (!field.required) {
        continue;
      }

      const answerValue = answers[field.key];
      if (answerValue === undefined || answerValue === null || String(answerValue).trim() === '') {
        return res.status(400).json({ message: `${field.label} is required.` });
      }
    }

    db.get(
      'SELECT COUNT(*) AS count FROM registrations WHERE event_id = ? AND registration_status = ?',
      [Number(event_id), 'confirmed'],
      (countError, countRow) => {
        if (countError) {
          return res.status(500).json({ message: 'Failed to check seat availability.' });
        }

        const confirmedCount = Number(countRow.count || 0);
        const seatCapacity = Number(eventRow.seat_capacity || 0);
        const waitlistEnabled = Number(eventRow.enable_waitlist || 0) === 1;

        let registrationStatus = 'confirmed';
        if (seatCapacity > 0 && confirmedCount >= seatCapacity) {
          if (waitlistEnabled) {
            registrationStatus = 'waitlisted';
          } else {
            return res.status(409).json({ message: 'Registration closed. Event is full.' });
          }
        }

        db.run(
          'INSERT INTO registrations (student_name, enrollment_no, email, department, phone, event_id, custom_answers_json, registration_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [student_name, enrollment_no, email, department, phone, Number(event_id), JSON.stringify(answers), registrationStatus],
          function onRegister(insertError) {
            if (insertError) {
              return res.status(500).json({ message: 'Failed to register student.' });
            }

            const message = registrationStatus === 'waitlisted'
              ? 'Event is full. Student has been added to waitlist.'
              : 'Registration successful.';

            res.status(201).json({
              message,
              registration: {
                id: this.lastID,
                student_name,
                enrollment_no,
                email,
                department,
                phone,
                event_id: Number(event_id),
                registration_status: registrationStatus,
                custom_answers: answers,
              },
            });
          }
        );
      }
    );
  });
});

// GET /registrations
app.get('/registrations', (req, res) => {
  const search = String(req.query.search || '').trim().toLowerCase();
  const eventFilter = String(req.query.event_id || '').trim();
  const departmentFilter = String(req.query.department || '').trim().toLowerCase();
  const statusFilter = String(req.query.status || '').trim().toLowerCase();
  const eligibilityFilter = String(req.query.eligibility || '').trim().toLowerCase();
  const feedbackFilter = String(req.query.feedback || '').trim().toLowerCase();

  const query = `
    SELECT
      registrations.id,
      registrations.student_name,
      registrations.enrollment_no,
      registrations.email,
      registrations.department,
      registrations.phone,
      registrations.event_id,
      registrations.registration_status,
      registrations.custom_answers_json,
      events.name AS event_name,
      events.date AS event_date,
      events.eligibility_criteria AS eligibility_criteria,
      COALESCE(fb.feedback_count, 0) AS feedback_count
    FROM registrations
    LEFT JOIN events ON events.id = registrations.event_id
    LEFT JOIN (
      SELECT registration_id, COUNT(*) AS feedback_count
      FROM feedback
      GROUP BY registration_id
    ) fb ON fb.registration_id = registrations.id
    ORDER BY events.date ASC, registrations.id ASC
  `;

  db.all(query, [], (error, rows) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch registrations.' });
    }

    let mappedRows = rows.map(decorateRegistration);

    if (search) {
      mappedRows = mappedRows.filter((row) => {
        const student = String(row.student_name || '').toLowerCase();
        const enrollment = String(row.enrollment_no || '').toLowerCase();
        const eventName = String(row.event_name || '').toLowerCase();
        return student.includes(search) || enrollment.includes(search) || eventName.includes(search);
      });
    }

    if (eventFilter) {
      mappedRows = mappedRows.filter((row) => String(row.event_id) === eventFilter);
    }

    if (departmentFilter) {
      mappedRows = mappedRows.filter((row) => String(row.department || '').toLowerCase() === departmentFilter);
    }

    if (statusFilter) {
      mappedRows = mappedRows.filter((row) => String(row.registration_status || '').toLowerCase() === statusFilter);
    }

    if (eligibilityFilter) {
      mappedRows = mappedRows.filter((row) => String(row.eligibility_criteria || '').toLowerCase() === eligibilityFilter);
    }

    if (feedbackFilter === 'submitted') {
      mappedRows = mappedRows.filter((row) => row.feedback_status === 'submitted');
    }

    if (feedbackFilter === 'not_submitted') {
      mappedRows = mappedRows.filter((row) => row.feedback_status === 'not_submitted');
    }

    res.json(mappedRows);
  });
});

// DELETE /registrations/:id
// Deletes one registration. If a confirmed entry is removed, promote first waitlisted student.
app.delete('/registrations/:id', (req, res) => {
  const registrationId = Number(req.params.id);

  if (!registrationId) {
    return res.status(400).json({ message: 'Valid registration ID is required.' });
  }

  db.get(
    'SELECT id, event_id, registration_status FROM registrations WHERE id = ?',
    [registrationId],
    (findError, row) => {
      if (findError) {
        return res.status(500).json({ message: 'Failed to find registration.' });
      }

      if (!row) {
        return res.status(404).json({ message: 'Registration not found.' });
      }

      db.run('DELETE FROM feedback WHERE registration_id = ?', [registrationId], (feedbackDeleteError) => {
        if (feedbackDeleteError) {
          return res.status(500).json({ message: 'Failed to delete related feedback.' });
        }

        db.run('DELETE FROM registrations WHERE id = ?', [registrationId], function onDelete(deleteError) {
          if (deleteError) {
            return res.status(500).json({ message: 'Failed to delete registration.' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ message: 'Registration not found.' });
          }

          if (row.registration_status !== 'confirmed') {
            return res.json({ message: 'Registration deleted successfully.' });
          }

          db.get(
            `
              SELECT id
              FROM registrations
              WHERE event_id = ? AND registration_status = 'waitlisted'
              ORDER BY id ASC
              LIMIT 1
            `,
            [row.event_id],
            (waitlistFindError, waitlistedRow) => {
              if (waitlistFindError) {
                return res.status(500).json({ message: 'Registration deleted, but failed to check waitlist.' });
              }

              if (!waitlistedRow) {
                return res.json({ message: 'Registration deleted successfully.' });
              }

              db.run(
                "UPDATE registrations SET registration_status = 'confirmed' WHERE id = ?",
                [waitlistedRow.id],
                (promoteError) => {
                  if (promoteError) {
                    return res.status(500).json({ message: 'Registration deleted, but failed to promote waitlisted student.' });
                  }

                  res.json({
                    message: 'Registration deleted. First waitlisted student moved to confirmed list.',
                    promoted_registration_id: waitlistedRow.id,
                  });
                }
              );
            }
          );
        });
      });
    }
  );
});

// GET /registrations-by-event
app.get('/registrations-by-event', (req, res) => {
  const query = `
    SELECT
      events.id AS event_id,
      events.name AS event_name,
      events.date AS event_date,
      events.location AS event_location,
      events.description AS event_description,
      events.eligibility_criteria AS eligibility_criteria,
      events.seat_capacity,
      events.enable_waitlist,
      registrations.id AS registration_id,
      registrations.student_name,
      registrations.enrollment_no,
      registrations.email,
      registrations.department,
      registrations.phone,
      registrations.registration_status,
      registrations.custom_answers_json
    FROM events
    LEFT JOIN registrations ON registrations.event_id = events.id
    ORDER BY events.date ASC, registrations.id ASC
  `;

  db.all(query, [], (error, rows) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch registrations by event.' });
    }

    const groupedEvents = [];
    const eventMap = new Map();

    rows.forEach((row) => {
      if (!eventMap.has(row.event_id)) {
        const groupedEvent = {
          event_id: row.event_id,
          event_name: row.event_name,
          event_date: row.event_date,
          event_location: row.event_location,
          event_description: row.event_description,
          eligibility_criteria: row.eligibility_criteria || 'Open to All',
          seat_capacity: Number(row.seat_capacity || 0),
          enable_waitlist: Number(row.enable_waitlist || 0),
          confirmed_registrations: [],
          waitlisted_registrations: [],
          registrations: [],
        };

        eventMap.set(row.event_id, groupedEvent);
        groupedEvents.push(groupedEvent);
      }

      if (row.registration_id) {
        const registrationItem = {
          id: row.registration_id,
          student_name: row.student_name,
          enrollment_no: row.enrollment_no,
          email: row.email,
          department: row.department,
          phone: row.phone,
          registration_status: row.registration_status || 'confirmed',
          custom_answers: parseJsonSafe(row.custom_answers_json, {}),
        };

        const eventItem = eventMap.get(row.event_id);
        eventItem.registrations.push(registrationItem);

        if (registrationItem.registration_status === 'waitlisted') {
          eventItem.waitlisted_registrations.push(registrationItem);
        } else {
          eventItem.confirmed_registrations.push(registrationItem);
        }
      }
    });

    groupedEvents.forEach((groupedEvent) => {
      groupedEvent.confirmed_count = groupedEvent.confirmed_registrations.length;
      groupedEvent.waitlist_count = groupedEvent.waitlisted_registrations.length;
      groupedEvent.available_seats = Math.max(Number(groupedEvent.seat_capacity || 0) - groupedEvent.confirmed_count, 0);
    });

    res.json(groupedEvents);
  });
});

// GET /student/portal
// Returns student-specific registrations and all events needed for the portal dashboard.
app.get('/student/portal', (req, res) => {
  const email = String(req.query.email || '').trim().toLowerCase();
  const enrollmentNo = String(req.query.enrollment_no || req.query.enrollment || '').trim().toLowerCase();

  if (!email && !enrollmentNo) {
    return res.status(400).json({ message: 'Email or enrollment number is required.' });
  }

  const filterClause = email
    ? 'LOWER(registrations.email) = ?'
    : 'LOWER(registrations.enrollment_no) = ?';
  const filterValue = email || enrollmentNo;

  const studentQuery = `
    SELECT
      registrations.id,
      registrations.student_name,
      registrations.enrollment_no,
      registrations.email,
      registrations.department,
      registrations.phone,
      registrations.event_id,
      registrations.registration_status,
      registrations.custom_answers_json,
      events.name AS event_name,
      events.date AS event_date,
      events.location AS event_location,
      events.description AS event_description,
      events.eligibility_criteria AS eligibility_criteria,
      events.seat_capacity AS seat_capacity,
      events.enable_waitlist AS enable_waitlist,
      COALESCE(fb.feedback_count, 0) AS feedback_count
    FROM registrations
    LEFT JOIN events ON events.id = registrations.event_id
    LEFT JOIN (
      SELECT registration_id, COUNT(*) AS feedback_count
      FROM feedback
      GROUP BY registration_id
    ) fb ON fb.registration_id = registrations.id
    WHERE ${filterClause}
    ORDER BY events.date ASC, registrations.id ASC
  `;

  const eventsQuery = `
    SELECT
      e.*,
      COALESCE(SUM(CASE WHEN r.registration_status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmed_count,
      COALESCE(SUM(CASE WHEN r.registration_status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlist_count
    FROM events e
    LEFT JOIN registrations r ON r.event_id = e.id
    GROUP BY e.id
    ORDER BY e.date ASC
  `;

  db.all(studentQuery, [filterValue], (studentError, studentRows) => {
    if (studentError) {
      return res.status(500).json({ message: 'Failed to load student portal data.' });
    }

    db.all(eventsQuery, [], (eventsError, eventRows) => {
      if (eventsError) {
        return res.status(500).json({ message: 'Failed to load portal events.' });
      }

      const profileRow = studentRows[0] || null;

      res.json({
        profile: profileRow
          ? {
              student_name: profileRow.student_name,
              enrollment_no: profileRow.enrollment_no,
              email: profileRow.email,
              department: profileRow.department,
            }
          : null,
        registrations: studentRows.map((row) => ({
          ...row,
          registration_status: row.registration_status || 'confirmed',
          custom_answers: parseJsonSafe(row.custom_answers_json, {}),
        })),
        events: eventRows.map((row) => decorateEvent(row)).map((row) => ({
          ...row,
          confirmed_count: Number(row.confirmed_count || 0),
          waitlist_count: Number(row.waitlist_count || 0),
          available_seats: Math.max(Number(row.seat_capacity || 0) - Number(row.confirmed_count || 0), 0),
        })),
      });
    });
  });
});

// GET /registrations/export/csv
app.get('/registrations/export/csv', (req, res) => {
  const query = `
    SELECT
      r.id AS registration_id,
      r.student_name,
      r.enrollment_no,
      r.email,
      r.department,
      r.phone,
      e.name AS event_name,
      e.date AS event_date,
      e.eligibility_criteria,
      r.registration_status,
      CASE WHEN COUNT(f.id) > 0 THEN 'submitted' ELSE 'not_submitted' END AS feedback_status
    FROM registrations r
    LEFT JOIN events e ON e.id = r.event_id
    LEFT JOIN feedback f ON f.registration_id = r.id
    GROUP BY r.id
    ORDER BY e.date ASC, r.id ASC
  `;

  db.all(query, [], (error, rows) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to export CSV.' });
    }

    const columns = [
      'registration_id',
      'student_name',
      'enrollment_no',
      'email',
      'department',
      'phone',
      'event_name',
      'event_date',
      'eligibility_criteria',
      'registration_status',
      'feedback_status',
    ];

    const csvText = buildCsv(columns, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="registrations_export.csv"');
    res.send(csvText);
  });
});

// GET /feedback
app.get('/feedback', (req, res) => {
  const eventId = String(req.query.event_id || '').trim();

  const query = `
    SELECT
      f.id,
      f.registration_id,
      f.event_id,
      f.student_name,
      f.rating,
      f.comments,
      f.created_at,
      e.name AS event_name,
      e.date AS event_date
    FROM feedback f
    LEFT JOIN events e ON e.id = f.event_id
    ORDER BY f.created_at DESC, f.id DESC
  `;

  db.all(query, [], (error, rows) => {
    if (error) {
      return res.status(500).json({ message: 'Failed to fetch feedback.' });
    }

    const filteredRows = eventId
      ? rows.filter((row) => String(row.event_id) === eventId)
      : rows;

    const eventSummaryMap = {};
    filteredRows.forEach((row) => {
      const key = String(row.event_id);
      if (!eventSummaryMap[key]) {
        eventSummaryMap[key] = {
          event_id: row.event_id,
          event_name: row.event_name,
          event_date: row.event_date,
          submission_count: 0,
          total_rating: 0,
        };
      }

      eventSummaryMap[key].submission_count += 1;
      eventSummaryMap[key].total_rating += Number(row.rating || 0);
    });

    const eventSummary = Object.values(eventSummaryMap).map((item) => ({
      event_id: item.event_id,
      event_name: item.event_name,
      event_date: item.event_date,
      submission_count: item.submission_count,
      average_rating: item.submission_count > 0
        ? Number((item.total_rating / item.submission_count).toFixed(2))
        : 0,
    }));

    res.json({
      feedback: filteredRows,
      summary: eventSummary,
    });
  });
});

// POST /feedback
app.post('/feedback', (req, res) => {
  const { registration_id, event_id, student_name, rating, comments } = req.body;

  if (!registration_id || !event_id || !student_name || !rating) {
    return res.status(400).json({ message: 'registration_id, event_id, student_name, and rating are required.' });
  }

  const numericRating = Number(rating);
  if (!Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5) {
    return res.status(400).json({ message: 'Rating should be between 1 and 5.' });
  }

  db.get('SELECT id FROM feedback WHERE registration_id = ?', [Number(registration_id)], (duplicateError, duplicateRow) => {
    if (duplicateError) {
      return res.status(500).json({ message: 'Failed to check existing feedback.' });
    }

    if (duplicateRow) {
      return res.status(409).json({ message: 'Feedback already submitted for this registration.' });
    }

    db.run(
      'INSERT INTO feedback (registration_id, event_id, student_name, rating, comments, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [Number(registration_id), Number(event_id), student_name, numericRating, comments || '', new Date().toISOString()],
      function onFeedbackInsert(error) {
        if (error) {
          return res.status(500).json({ message: 'Failed to save feedback.' });
        }

        res.status(201).json({
          message: 'Feedback submitted successfully.',
          feedback: {
            id: this.lastID,
            registration_id: Number(registration_id),
            event_id: Number(event_id),
            student_name,
            rating: numericRating,
            comments: comments || '',
            created_at: new Date().toISOString(),
          },
        });
      }
    );
  });
});

app.listen(PORT, () => {
  console.log(`Backend API running at http://localhost:${PORT}`);
});
