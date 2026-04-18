// Student dashboard page script
const dashboardMessage = document.getElementById('dashboardMessage');
const dashboardIntro = document.getElementById('dashboardIntro');
const studentProfileForm = document.getElementById('studentProfileForm');
const studentNameInput = document.getElementById('studentNameInput');
const studentEmailInput = document.getElementById('studentEmailInput');
const studentEnrollmentInput = document.getElementById('studentEnrollmentInput');
const studentDepartmentInput = document.getElementById('studentDepartmentInput');
const studentProfileAvatar = document.getElementById('studentProfileAvatar');
const studentProfileName = document.getElementById('studentProfileName');
const studentProfileMeta = document.getElementById('studentProfileMeta');
const studentProfileEnrollment = document.getElementById('studentProfileEnrollment');
const studentProfileEmail = document.getElementById('studentProfileEmail');
const studentProfileMentor = document.getElementById('studentProfileMentor');
const studentProfileStatus = document.getElementById('studentProfileStatus');
const totalRegisteredEventsEl = document.getElementById('totalRegisteredEvents');
const upcomingEventsCountEl = document.getElementById('upcomingEventsCount');
const waitlistedEventsCountEl = document.getElementById('waitlistedEventsCount');
const completedEventsCountEl = document.getElementById('completedEventsCount');
const recentRegistrationsContainer = document.getElementById('recentRegistrationsContainer');

function showDashboardMessage(text, type = 'info') {
  dashboardMessage.textContent = text;
  dashboardMessage.className = `message ${type}`;
  dashboardMessage.style.display = 'block';
}

function hideDashboardMessage() {
  dashboardMessage.style.display = 'none';
  dashboardMessage.textContent = '';
}

function isPastDate(dateText) {
  return String(dateText || '') < new Date().toISOString().split('T')[0];
}

function buildAvatarText(profile) {
  const name = String(profile?.student_name || '').trim();
  if (!name) {
    return 'SO';
  }

  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

function renderProfileSummary(profile) {
  const activeProfile = profile || getActiveStudentProfile();
  const academicText = [activeProfile.program, activeProfile.year, activeProfile.semester]
    .filter(Boolean)
    .join(' | ');

  studentProfileAvatar.textContent = buildAvatarText(activeProfile);
  studentProfileName.textContent = activeProfile.student_name || 'Student Profile';
  studentProfileMeta.textContent = academicText || activeProfile.department || 'Student portal profile';
  studentProfileEnrollment.textContent = activeProfile.enrollment_no || '--';
  studentProfileEmail.textContent = activeProfile.email || '--';
  studentProfileMentor.textContent = `Mentor: ${activeProfile.mentor || 'Not assigned'}`;
  studentProfileStatus.textContent = activeProfile.profile_type || 'Active profile';
}

function renderRecentCards(registrations) {
  recentRegistrationsContainer.innerHTML = '';
  const recentItems = [...registrations].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 4);

  if (recentItems.length === 0) {
    recentRegistrationsContainer.innerHTML = '<div class="empty-state">No registrations found yet.</div>';
    return;
  }

  recentItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${escapeStudentHtml(item.event_name)}</h3>
      <div class="card-meta">
        <div><strong>Date:</strong> ${formatStudentDate(item.event_date)}</div>
        <div><strong>Location:</strong> ${escapeStudentHtml(item.event_location || '--')}</div>
        <div><strong>Status:</strong> ${escapeStudentHtml(item.registration_status)}</div>
      </div>
    `;
    recentRegistrationsContainer.appendChild(card);
  });
}

async function loadDashboard() {
  const savedProfile = getActiveStudentProfile();
  if (savedProfile) {
    studentNameInput.value = savedProfile.student_name || '';
    studentEmailInput.value = savedProfile.email || '';
    studentEnrollmentInput.value = savedProfile.enrollment_no || '';
    studentDepartmentInput.value = savedProfile.department || '';
  }

  try {
    const { profile, events, registrations } = await fetchStudentPortalData();
    const studentProfile = profile || savedProfile;

    studentNameInput.value = studentProfile?.student_name || studentNameInput.value;
    studentEmailInput.value = studentProfile?.email || studentEmailInput.value;
    studentEnrollmentInput.value = studentProfile?.enrollment_no || studentEnrollmentInput.value;
    studentDepartmentInput.value = studentProfile?.department || studentDepartmentInput.value;

    const confirmed = registrations.filter((item) => item.registration_status === 'confirmed');
    const waitlisted = registrations.filter((item) => item.registration_status === 'waitlisted');
    const completed = confirmed.filter((item) => isPastDate(item.event_date));
    const upcoming = confirmed.filter((item) => !isPastDate(item.event_date));

    totalRegisteredEventsEl.textContent = String(registrations.length);
    upcomingEventsCountEl.textContent = String(upcoming.length);
    waitlistedEventsCountEl.textContent = String(waitlisted.length);
    completedEventsCountEl.textContent = String(completed.length);
    dashboardIntro.textContent = studentProfile?.student_name
      ? `Welcome back, ${studentProfile.student_name}. Your registrations, QR passes, and waitlist are synced below.`
      : 'Your student dashboard is synced with live event data.';
    renderProfileSummary(studentProfile);

    renderRecentCards(registrations);
    saveStudentProfile(studentProfile);
    hideDashboardMessage();
  } catch (error) {
    showDashboardMessage(error.message || 'Unable to load dashboard.', 'error');
  }
}

studentProfileForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const profile = {
    student_name: studentNameInput.value.trim(),
    email: studentEmailInput.value.trim(),
    enrollment_no: studentEnrollmentInput.value.trim(),
    department: studentDepartmentInput.value.trim(),
  };

  if (!profile.email && !profile.enrollment_no) {
    showDashboardMessage('Enter email or enrollment number to load your dashboard.', 'error');
    return;
  }

  saveStudentProfile(profile);
  loadDashboard();
});

renderProfileSummary(getActiveStudentProfile());
loadDashboard();
