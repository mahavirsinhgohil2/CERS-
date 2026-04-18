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

async function fetchStudentPortalData() {
  const activeProfile = getActiveStudentProfile();
  const email = activeProfile?.email || '';
  const enrollmentNo = activeProfile?.enrollment_no || '';

  const [eventsResponse, registrationsResponse] = await Promise.all([
    fetch(`${STUDENT_API_BASE}/events`),
    fetch(`${STUDENT_API_BASE}/registrations`),
  ]);

  if (!eventsResponse.ok || !registrationsResponse.ok) {
    throw new Error('Failed to load student data.');
  }

  const events = await eventsResponse.json();
  const registrations = await registrationsResponse.json();

  const studentRegistrations = registrations.filter((item) => {
    const itemEmail = String(item.email || '').toLowerCase();
    const itemEnrollment = String(item.enrollment_no || '').toLowerCase();
    return (email && itemEmail === email.toLowerCase()) || (enrollmentNo && itemEnrollment === enrollmentNo.toLowerCase());
  });

  return {
    profile: activeProfile,
    events,
    registrations: studentRegistrations,
  };
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
