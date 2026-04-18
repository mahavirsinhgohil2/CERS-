// Shared student portal helpers
const STUDENT_API_BASE = window.STUDENT_API_BASE;
const DEMO_STUDENT_PROFILE = {
  student_name: 'Aditi Sharma',
  email: 'aditi.sharma1@student.silveroak.edu',
  enrollment_no: 'SOU26-IT-101',
  department: 'IT',
  program: 'BCA',
  year: '3rd Year',
  semester: '6th Semester',
  mentor: 'Dr. R. Mehta',
  profile_type: 'Demo Student',
};
const FORCE_DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1';

const DUMMY_EVENTS = [
  {
    id: 1,
    name: 'Tech Fest 2026',
    date: '2026-05-10',
    location: 'Silver Oak Auditorium',
    description: 'A college technology festival with project showcases and competitions.',
    eligibility_criteria: 'Open to All',
  },
  {
    id: 2,
    name: 'Coding Competition',
    date: '2026-05-15',
    location: 'Lab 3',
    description: 'A coding contest for diploma and degree students.',
    eligibility_criteria: 'Open to All',
  },
  {
    id: 3,
    name: 'AI Seminar',
    date: '2026-05-20',
    location: 'Conference Hall',
    description: 'An expert session on artificial intelligence and future careers.',
    eligibility_criteria: 'Open to All',
  },
  {
    id: 4,
    name: 'Poster Presentation',
    date: '2026-05-25',
    location: 'Main Campus',
    description: 'Students present posters on technical and social innovation topics.',
    eligibility_criteria: 'Open to All',
  },
];

const DUMMY_REGISTRATIONS = [
  {
    id: 101,
    event_id: 1,
    student_name: 'Mahavirsinh Gohil',
    enrollment_no: 'SOUIT101',
    email: 'mahavir@example.com',
    department: 'Information Technology',
    phone: '9876543210',
    event_name: 'Tech Fest 2026',
    event_date: '2026-05-10',
    event_location: 'Silver Oak Auditorium',
    registration_status: 'confirmed',
    feedback_count: 0,
  },
  {
    id: 102,
    event_id: 2,
    student_name: 'Priya Patel',
    enrollment_no: 'SOUIT102',
    email: 'priya@example.com',
    department: 'Computer Engineering',
    phone: '9123456780',
    event_name: 'Coding Competition',
    event_date: '2026-05-15',
    event_location: 'Lab 3',
    registration_status: 'confirmed',
    feedback_count: 0,
  },
  {
    id: 103,
    event_id: 3,
    student_name: 'Rahul Shah',
    enrollment_no: 'SOUIT103',
    email: 'rahul@example.com',
    department: 'Mechanical Engineering',
    phone: '9988776655',
    event_name: 'AI Seminar',
    event_date: '2026-05-20',
    event_location: 'Conference Hall',
    registration_status: 'waitlisted',
    feedback_count: 0,
  },
];

function loadSavedStudentProfile() {
  try {
    const saved = localStorage.getItem('studentProfile');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

function getActiveStudentProfile() {
  const saved = loadSavedStudentProfile();

  if (saved) {
    return saved;
  }

  saveStudentProfile(DEMO_STUDENT_PROFILE);
  return DEMO_STUDENT_PROFILE;
}

function saveStudentProfile(profile) {
  localStorage.setItem('studentProfile', JSON.stringify(profile));
}

function escapeStudentHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatStudentDate(dateText) {
  const dateObject = new Date(dateText);
  if (Number.isNaN(dateObject.getTime())) {
    return dateText || '--';
  }

  return dateObject.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function isStudentPastDate(dateText) {
  return String(dateText || '') < new Date().toISOString().split('T')[0];
}

function filterStudentRegistrations(registrations, email, enrollmentNo) {
  return registrations.filter((item) => {
    const itemEmail = String(item.email || '').toLowerCase();
    const itemEnrollment = String(item.enrollment_no || '').toLowerCase();
    return (email && itemEmail === email.toLowerCase()) || (enrollmentNo && itemEnrollment === enrollmentNo.toLowerCase());
  });
}

function getStudentDemoData(activeProfile) {
  const profile = {
    ...DEMO_STUDENT_PROFILE,
    ...activeProfile,
  };

  const studentRegistrations = filterStudentRegistrations(DUMMY_REGISTRATIONS, profile.email || '', profile.enrollment_no || '');

  return {
    profile,
    events: DUMMY_EVENTS,
    registrations: studentRegistrations,
  };
}

async function fetchStudentPortalData() {
  const activeProfile = getActiveStudentProfile();
  const email = activeProfile?.email || '';
  const enrollmentNo = activeProfile?.enrollment_no || '';

  if (FORCE_DEMO_MODE) {
    return getStudentDemoData(activeProfile);
  }

  if (!STUDENT_API_BASE) {
    return getStudentDemoData(activeProfile);
  }

  try {
    const [eventsResponse, registrationsResponse] = await Promise.all([
      fetch(`${STUDENT_API_BASE}/events`),
      fetch(`${STUDENT_API_BASE}/registrations`),
    ]);

    if (!eventsResponse.ok || !registrationsResponse.ok) {
      throw new Error('Failed to load student data.');
    }

    const events = await eventsResponse.json();
    const registrations = await registrationsResponse.json();
    const studentRegistrations = filterStudentRegistrations(registrations, email, enrollmentNo);

    if (!Array.isArray(events) || events.length === 0 || !Array.isArray(studentRegistrations) || studentRegistrations.length === 0) {
      return getStudentDemoData(activeProfile);
    }

    return {
      profile: activeProfile,
      events,
      registrations: studentRegistrations,
    };
  } catch (error) {
    return getStudentDemoData(activeProfile);
  }
}

function buildEventTheme(event) {
  const text = `${event?.name || event?.event_name || ''} ${event?.description || event?.event_description || ''}`.toLowerCase();

  if (/cultur|dance|music|drama|poster/.test(text)) {
    return 'culture';
  }

  if (/sport|athlet/.test(text)) {
    return 'sports';
  }

  if (/career|placement|guidance|resume/.test(text)) {
    return 'career';
  }

  if (/ai|cyber|hackathon|code|coding|tech|robot/.test(text)) {
    return 'tech';
  }

  return 'general';
}

function buildThemeLabel(themeKey) {
  const labels = {
    tech: 'Tech event',
    culture: 'Culture event',
    sports: 'Sports event',
    career: 'Career event',
    general: 'Campus event',
  };

  return labels[themeKey] || 'Campus event';
}

function buildRecommendationReason(event, profile, recentThemes, isTrending) {
  const themeKey = buildEventTheme(event);
  const department = String(profile?.department || '').toLowerCase();

  if ((department.includes('it') || department.includes('cse') || department.includes('cyber')) && themeKey === 'tech') {
    return 'Recommended for IT/CSE students';
  }

  if ((department.includes('mechanical') || department.includes('electrical')) && (themeKey === 'tech' || themeKey === 'sports')) {
    return 'Matches your department interest';
  }

  if (recentThemes.includes(themeKey)) {
    return 'Similar to your recent registrations';
  }

  if (isTrending) {
    return 'Trending event';
  }

  if (themeKey === 'career') {
    return 'Useful for career growth';
  }

  return 'Suggested from campus activity';
}
