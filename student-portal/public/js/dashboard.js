// Student dashboard script
// Loads student-specific portal data and renders dashboard sections.
const studentProfileForm = document.getElementById('studentProfileForm');
const studentNameInput = document.getElementById('studentNameInput');
const studentEmailInput = document.getElementById('studentEmailInput');
const studentEnrollmentInput = document.getElementById('studentEnrollmentInput');
const studentDepartmentInput = document.getElementById('studentDepartmentInput');
const dashboardMessage = document.getElementById('dashboardMessage');
const dashboardIntro = document.getElementById('dashboardIntro');
const profileChip = document.getElementById('profileChip');
const totalRegisteredEventsEl = document.getElementById('totalRegisteredEvents');
const upcomingEventsCountEl = document.getElementById('upcomingEventsCount');
const waitlistedEventsCountEl = document.getElementById('waitlistedEventsCount');
const completedEventsCountEl = document.getElementById('completedEventsCount');
const recentRegistrationsContainer = document.getElementById('recentRegistrationsContainer');
const qrWalletContainer = document.getElementById('qrWalletContainer');
const recommendationsContainer = document.getElementById('recommendationsContainer');
const waitlistContainer = document.getElementById('waitlistContainer');
const timelineContainer = document.getElementById('timelineContainer');
const feedbackContainer = document.getElementById('feedbackContainer');
const emptyStudentState = document.getElementById('emptyStudentState');
const qrModal = document.getElementById('qrModal');
const qrModalBody = document.getElementById('qrModalBody');
const closeQrModalButton = document.getElementById('closeQrModalButton');
const downloadQrButton = document.getElementById('downloadQrButton');
const FORCE_DEMO_MODE = new URLSearchParams(window.location.search).get('demo') === '1';

const DUMMY_EVENTS = [
  {
    id: 1,
    name: 'Tech Fest 2026',
    date: '2026-05-10',
    location: 'Silver Oak Auditorium',
    description: 'A college technology festival with project showcases and competitions.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 250,
    confirmed_count: 120,
    waitlist_count: 8,
    enable_waitlist: 1,
    available_seats: 122,
  },
  {
    id: 2,
    name: 'Coding Competition',
    date: '2026-05-15',
    location: 'Lab 3',
    description: 'A coding contest for diploma and degree students.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 120,
    confirmed_count: 92,
    waitlist_count: 4,
    enable_waitlist: 1,
    available_seats: 28,
  },
  {
    id: 3,
    name: 'AI Seminar',
    date: '2026-05-20',
    location: 'Conference Hall',
    description: 'An expert session on artificial intelligence and future careers.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 180,
    confirmed_count: 130,
    waitlist_count: 0,
    enable_waitlist: 0,
    available_seats: 50,
  },
  {
    id: 4,
    name: 'Poster Presentation',
    date: '2026-05-25',
    location: 'Main Campus',
    description: 'Students present posters on technical and social innovation topics.',
    eligibility_criteria: 'Open to All',
    seat_capacity: 200,
    confirmed_count: 75,
    waitlist_count: 0,
    enable_waitlist: 0,
    available_seats: 125,
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

const DEMO_PROFILE = {
  student_name: 'Mahavirsinh Gohil',
  email: 'mahavir@example.com',
  enrollment_no: 'SOUIT101',
  department: 'Information Technology',
};

let currentPortalData = null;
let currentQrPayload = null;
let currentQrLabel = 'QR Pass';

function loadSavedProfile() {
  try {
    const saved = localStorage.getItem('studentProfile');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    return null;
  }
}

function saveProfile(profile) {
  localStorage.setItem('studentProfile', JSON.stringify(profile));
}

function showMessage(text, type = 'info') {
  dashboardMessage.textContent = text;
  dashboardMessage.className = `message ${type}`;
  dashboardMessage.style.display = 'block';
}

function hideMessage() {
  dashboardMessage.style.display = 'none';
  dashboardMessage.textContent = '';
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(dateText) {
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

function isPastDate(dateText) {
  return String(dateText || '') < new Date().toISOString().split('T')[0];
}

function getThemeKey(event) {
  const text = `${event.event_name || event.name || ''} ${event.event_description || event.description || ''}`.toLowerCase();

  if (/cultur|music|dance|drama|poster/.test(text)) {
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

function getThemeLabel(themeKey) {
  const labels = {
    tech: 'Tech event',
    culture: 'Cultural event',
    sports: 'Sports event',
    career: 'Career event',
    general: 'Campus event',
  };

  return labels[themeKey] || 'Campus event';
}

function getRecommendationReason(event, profile, recentThemes, isTrending) {
  const themeKey = getThemeKey(event);
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

function getStatusBadge(status) {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'waitlisted') {
    return '<span class="status-badge status-waitlisted">Waitlisted</span>';
  }
  if (normalized === 'completed') {
    return '<span class="status-badge status-completed">Completed</span>';
  }
  return '<span class="status-badge status-confirmed">Confirmed</span>';
}

function renderStats(registrations) {
  const confirmedRegistrations = registrations.filter((item) => item.registration_status === 'confirmed');
  const waitlistedRegistrations = registrations.filter((item) => item.registration_status === 'waitlisted');
  const completedRegistrations = confirmedRegistrations.filter((item) => isPastDate(item.event_date));
  const upcomingRegistrations = confirmedRegistrations.filter((item) => !isPastDate(item.event_date));

  totalRegisteredEventsEl.textContent = String(registrations.length);
  upcomingEventsCountEl.textContent = String(upcomingRegistrations.length);
  waitlistedEventsCountEl.textContent = String(waitlistedRegistrations.length);
  completedEventsCountEl.textContent = String(completedRegistrations.length);
}

function createCard(html) {
  const wrapper = document.createElement('article');
  wrapper.className = 'glass-card';
  wrapper.innerHTML = html;
  return wrapper;
}

function renderRecentRegistrations(registrations) {
  recentRegistrationsContainer.innerHTML = '';
  const recentItems = [...registrations].sort((a, b) => Number(b.id) - Number(a.id)).slice(0, 4);

  if (recentItems.length === 0) {
    recentRegistrationsContainer.innerHTML = '<div class="empty-state dark-empty">No registrations found yet.</div>';
    return;
  }

  recentItems.forEach((item) => {
    recentRegistrationsContainer.appendChild(createCard(`
      <div class="card-topline">
        <div>
          <p class="card-kicker">Latest registration</p>
          <h3>${escapeHtml(item.event_name)}</h3>
        </div>
        ${getStatusBadge(item.registration_status)}
      </div>
      <div class="card-meta dark-meta">
        <div><strong>Date:</strong> ${escapeHtml(formatDate(item.event_date))}</div>
        <div><strong>Location:</strong> ${escapeHtml(item.event_location || '--')}</div>
        <div><strong>Registration ID:</strong> #${escapeHtml(item.id)}</div>
      </div>
    `));
  });
}

function openQrModal(payload, label) {
  currentQrPayload = payload;
  currentQrLabel = label;
  qrModalBody.innerHTML = '<div class="qr-large" id="qrLargeContainer"></div>';
  const container = document.getElementById('qrLargeContainer');
  container.innerHTML = '';
  if (window.QRCode) {
    new QRCode(container, {
      text: JSON.stringify(payload),
      width: 240,
      height: 240,
      colorDark: '#FFFFFF',
      colorLight: '#07111f',
      correctLevel: QRCode.CorrectLevel.M,
    });
  }
  qrModal.style.display = 'flex';
}

function downloadCurrentQr() {
  const canvas = qrModalBody.querySelector('canvas');
  if (!canvas) {
    showMessage('QR image is not ready for download.', 'error');
    return;
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = `${currentQrLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  link.click();
}

function renderQrWallet(registrations) {
  qrWalletContainer.innerHTML = '';
  const confirmedItems = registrations.filter((item) => item.registration_status === 'confirmed');

  if (confirmedItems.length === 0) {
    qrWalletContainer.innerHTML = '<div class="empty-state dark-empty">No confirmed registrations available for QR passes.</div>';
    return;
  }

  confirmedItems.forEach((item) => {
    const payload = {
      registrationId: item.id,
      eventId: item.event_id,
      studentName: item.student_name,
      eventName: item.event_name,
      eventDate: item.event_date,
      studentEmail: item.email,
    };

    const card = createCard(`
      <div class="card-topline">
        <div>
          <p class="card-kicker">QR Pass</p>
          <h3>${escapeHtml(item.event_name)}</h3>
        </div>
        ${item.event_date && isPastDate(item.event_date) ? '<span class="status-badge status-completed">Completed</span>' : '<span class="status-badge status-confirmed">Active pass</span>'}
      </div>
      <div class="card-meta dark-meta">
        <div><strong>Date:</strong> ${escapeHtml(formatDate(item.event_date))}</div>
        <div><strong>Location:</strong> ${escapeHtml(item.event_location || '--')}</div>
        <div><strong>Status:</strong> ${escapeHtml(item.registration_status)}</div>
      </div>
      <div class="qr-mini" id="qr-mini-${item.id}"></div>
      <div class="actions portal-actions">
        <button class="btn btn-primary" type="button" data-view-qr="${item.id}">View Large QR</button>
      </div>
    `);

    qrWalletContainer.appendChild(card);

    const qrContainer = card.querySelector(`#qr-mini-${item.id}`);
    if (window.QRCode) {
      new QRCode(qrContainer, {
        text: JSON.stringify(payload),
        width: 120,
        height: 120,
        colorDark: '#D8F3FF',
        colorLight: '#09111e',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }

    card.querySelector('[data-view-qr]').addEventListener('click', () => openQrModal(payload, `${item.event_name}-qr-pass`));
  });
}

function renderRecommendations(registrations, events, profile) {
  recommendationsContainer.innerHTML = '';
  const registeredIds = new Set(registrations.map((item) => String(item.event_id)));
  const recentThemes = registrations
    .filter((item) => item.registration_status === 'confirmed')
    .slice(0, 3)
    .map((item) => getThemeKey(item));
  const upcomingEvents = events.filter((event) => !registeredIds.has(String(event.id)) && !isPastDate(event.date));

  const scored = upcomingEvents.map((event) => {
    const themeKey = getThemeKey(event);
    let score = 0;
    const department = String(profile?.department || '').toLowerCase();
    const isTrending = Number(event.confirmed_count || 0) >= 5;

    if ((department.includes('it') || department.includes('cse') || department.includes('cyber')) && themeKey === 'tech') {
      score += 4;
    }

    if ((department.includes('mechanical') || department.includes('electrical')) && (themeKey === 'tech' || themeKey === 'sports')) {
      score += 3;
    }

    if (recentThemes.includes(themeKey)) {
      score += 2;
    }

    if (isTrending) {
      score += 1;
    }

    if (/open to all/i.test(event.eligibility_criteria || '')) {
      score += 1;
    }

    return {
      ...event,
      score,
      reason: getRecommendationReason(event, profile, recentThemes, isTrending),
      themeLabel: getThemeLabel(themeKey),
    };
  });

  const topMatches = scored.sort((a, b) => b.score - a.score).slice(0, 6);

  if (topMatches.length === 0) {
    recommendationsContainer.innerHTML = '<div class="empty-state dark-empty">No upcoming recommendations right now.</div>';
    return;
  }

  topMatches.forEach((event) => {
    recommendationsContainer.appendChild(createCard(`
      <div class="card-topline">
        <div>
          <p class="card-kicker">${escapeHtml(event.themeLabel)}</p>
          <h3>${escapeHtml(event.name)}</h3>
        </div>
        <span class="status-badge status-recommend">Recommended</span>
      </div>
      <div class="card-meta dark-meta">
        <div><strong>Date:</strong> ${escapeHtml(formatDate(event.date))}</div>
        <div><strong>Location:</strong> ${escapeHtml(event.location)}</div>
        <div><strong>Seats:</strong> ${escapeHtml(event.available_seats)} available</div>
      </div>
      <p class="card-note">${escapeHtml(event.reason)}</p>
      <div class="actions portal-actions">
        <a class="btn btn-secondary" href="register.html?eventId=${event.id}">Register Now</a>
      </div>
    `));
  });
}

function renderWaitlist(registrations) {
  waitlistContainer.innerHTML = '';
  const waitlistedItems = registrations.filter((item) => item.registration_status === 'waitlisted');
  const positionMap = new Map();

  waitlistedItems.forEach((item) => {
    const currentCount = positionMap.get(item.event_id) || 0;
    positionMap.set(item.event_id, currentCount + 1);
    item.waitlist_position = currentCount + 1;
  });

  if (waitlistedItems.length === 0) {
    waitlistContainer.innerHTML = '<div class="empty-state dark-empty">You are not on any waitlist right now.</div>';
    return;
  }

  waitlistedItems.forEach((item) => {
    waitlistContainer.appendChild(createCard(`
      <div class="card-topline">
        <div>
          <p class="card-kicker">Waitlist tracker</p>
          <h3>${escapeHtml(item.event_name)}</h3>
        </div>
        <span class="status-badge status-waitlisted">Position #${escapeHtml(item.waitlist_position)}</span>
      </div>
      <div class="card-meta dark-meta">
        <div><strong>Date:</strong> ${escapeHtml(formatDate(item.event_date))}</div>
        <div><strong>Location:</strong> ${escapeHtml(item.event_location || '--')}</div>
        <div><strong>Status:</strong> You are on waitlist</div>
      </div>
      <p class="card-note">Seats may open if confirmed registrations are cancelled.</p>
    `));
  });
}

function renderTimeline(registrations) {
  timelineContainer.innerHTML = '';
  const timelineItems = [...registrations].sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));

  if (timelineItems.length === 0) {
    timelineContainer.innerHTML = '<div class="empty-state dark-empty">No events yet in your timeline.</div>';
    return;
  }

  timelineItems.forEach((item) => {
    const timelineStatus = item.registration_status === 'waitlisted'
      ? 'Waitlisted'
      : isPastDate(item.event_date)
        ? 'Completed'
        : 'Upcoming';

    timelineContainer.appendChild(createCard(`
      <div class="timeline-row">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="card-topline">
            <div>
              <p class="card-kicker">${escapeHtml(timelineStatus)}</p>
              <h3>${escapeHtml(item.event_name)}</h3>
            </div>
            ${getStatusBadge(timelineStatus.toLowerCase())}
          </div>
          <div class="card-meta dark-meta">
            <div><strong>Date:</strong> ${escapeHtml(formatDate(item.event_date))}</div>
            <div><strong>Location:</strong> ${escapeHtml(item.event_location || '--')}</div>
            <div><strong>Registration:</strong> ${escapeHtml(item.registration_status)}</div>
          </div>
        </div>
      </div>
    `));
  });
}

function renderFeedbackCenter(registrations) {
  feedbackContainer.innerHTML = '';
  const feedbackItems = registrations.filter((item) => item.registration_status === 'confirmed' && isPastDate(item.event_date) && Number(item.feedback_count || 0) === 0);

  if (feedbackItems.length === 0) {
    feedbackContainer.innerHTML = '<div class="empty-state dark-empty">No feedback pending right now.</div>';
    return;
  }

  feedbackItems.forEach((item) => {
    const card = createCard(`
      <div class="card-topline">
        <div>
          <p class="card-kicker">Feedback center</p>
          <h3>${escapeHtml(item.event_name)}</h3>
        </div>
        <span class="status-badge status-completed">Ready for feedback</span>
      </div>
      <div class="card-meta dark-meta">
        <div><strong>Date:</strong> ${escapeHtml(formatDate(item.event_date))}</div>
        <div><strong>Location:</strong> ${escapeHtml(item.event_location || '--')}</div>
      </div>
      <form class="feedback-form" data-feedback-form="${item.id}">
        <div class="field">
          <label>Rating</label>
          <select name="rating" required>
            <option value="">Select rating</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
        </div>
        <div class="field">
          <label>Comments</label>
          <textarea name="comments" rows="3" placeholder="Write a short review..."></textarea>
        </div>
        <div class="actions portal-actions">
          <button class="btn btn-primary" type="submit">Submit Feedback</button>
        </div>
      </form>
    `);

    card.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const rating = form.rating.value;
      const comments = form.comments.value.trim();

      try {
        const response = await fetch(`${window.API_BASE}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_id: item.id,
            event_id: item.event_id,
            student_name: item.student_name,
            rating,
            comments,
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Unable to submit feedback.');
        }

        showMessage(result.message || 'Feedback submitted successfully.', 'success');
        loadDashboard();
      } catch (error) {
        showMessage(error.message || 'Unable to submit feedback.', 'error');
      }
    });

    feedbackContainer.appendChild(card);
  });
}

function renderPortal(profile, registrations, events) {
  const confirmed = registrations.filter((item) => item.registration_status === 'confirmed');
  const waitlisted = registrations.filter((item) => item.registration_status === 'waitlisted');
  const nextUpcoming = confirmed.find((item) => !isPastDate(item.event_date)) || registrations[0] || null;

  if (profile) {
    studentNameInput.value = profile.student_name || '';
    studentEmailInput.value = profile.email || '';
    studentEnrollmentInput.value = profile.enrollment_no || '';
    studentDepartmentInput.value = profile.department || '';
    profileChip.textContent = `${profile.student_name || 'Student'} | ${profile.department || 'General'}`;
    dashboardIntro.textContent = `Welcome back, ${profile.student_name || 'Student'}. Your portal is synced with your event registrations.`;
  }

  renderStats(registrations);
  renderRecentRegistrations(registrations);
  renderQrWallet(registrations);
  renderRecommendations(registrations, events, profile);
  renderWaitlist(registrations);
  renderTimeline(registrations);
  renderFeedbackCenter(registrations);

  if (nextUpcoming) {
    emptyStudentState.innerHTML = `
      <div class="mini-summary-grid">
        <div>
          <span class="mini-label">Next event</span>
          <strong>${escapeHtml(nextUpcoming.event_name)}</strong>
        </div>
        <div>
          <span class="mini-label">Date</span>
          <strong>${escapeHtml(formatDate(nextUpcoming.event_date))}</strong>
        </div>
        <div>
          <span class="mini-label">Status</span>
          <strong>${escapeHtml(nextUpcoming.registration_status)}</strong>
        </div>
      </div>
    `;
  }

  if (confirmed.length === 0 && waitlisted.length === 0) {
    showMessage('Save your profile and register for events to see dashboard data.', 'info');
  }
}

function getProfileForDashboard(savedProfile) {
  return {
    student_name: studentNameInput.value.trim() || savedProfile?.student_name || DEMO_PROFILE.student_name,
    email: studentEmailInput.value.trim() || savedProfile?.email || DEMO_PROFILE.email,
    enrollment_no: studentEnrollmentInput.value.trim() || savedProfile?.enrollment_no || DEMO_PROFILE.enrollment_no,
    department: studentDepartmentInput.value.trim() || savedProfile?.department || DEMO_PROFILE.department,
  };
}

function filterRegistrationsByProfile(allRegistrations, profile) {
  const normalizedEmail = String(profile.email || '').toLowerCase();
  const normalizedEnrollment = String(profile.enrollment_no || '').toLowerCase();

  return allRegistrations.filter((item) => {
    const itemEmail = String(item.email || '').toLowerCase();
    const itemEnrollment = String(item.enrollment_no || '').toLowerCase();
    return (normalizedEmail && itemEmail === normalizedEmail) || (normalizedEnrollment && itemEnrollment === normalizedEnrollment);
  });
}

function getFallbackPortalData(profile) {
  return {
    events: DUMMY_EVENTS,
    registrations: filterRegistrationsByProfile(DUMMY_REGISTRATIONS, profile),
  };
}

async function loadDashboard() {
  const savedProfile = loadSavedProfile();
  const profile = getProfileForDashboard(savedProfile);

  if (!savedProfile && !studentEmailInput.value.trim() && !studentEnrollmentInput.value.trim()) {
    saveProfile(profile);
    showMessage('Showing demo profile for quick review.', 'info');
  }

  if (FORCE_DEMO_MODE) {
    const fallbackData = getFallbackPortalData(profile);
    renderPortal(profile, fallbackData.registrations, fallbackData.events);
    showMessage('Demo mode is ON. Showing sample dashboard data.', 'info');
    return;
  }

  hideMessage();

  try {
    if (!window.API_BASE) {
      throw new Error('API base is not available.');
    }

    const [eventsResponse, registrationsResponse] = await Promise.all([
      fetch(`${window.API_BASE}/events`),
      fetch(`${window.API_BASE}/registrations`),
    ]);

    if (!eventsResponse.ok || !registrationsResponse.ok) {
      throw new Error('Failed to load portal data.');
    }

    const events = await eventsResponse.json();
    const allRegistrations = await registrationsResponse.json();
    const portalRegistrations = filterRegistrationsByProfile(allRegistrations, profile);

    const hasApiEvents = Array.isArray(events) && events.length > 0;
    const hasApiRegistrations = Array.isArray(portalRegistrations) && portalRegistrations.length > 0;

    if (!hasApiEvents || !hasApiRegistrations) {
      const fallbackData = getFallbackPortalData(profile);
      renderPortal(profile, fallbackData.registrations, fallbackData.events);
      showMessage('API data was empty. Showing demo dashboard data.', 'info');
      return;
    }

    saveProfile(profile);
    renderPortal(profile, portalRegistrations, events);
  } catch (error) {
    const fallbackData = getFallbackPortalData(profile);
    renderPortal(profile, fallbackData.registrations, fallbackData.events);
    showMessage('API not available. Showing demo dashboard data.', 'info');
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
    showMessage('Enter email or enrollment number to load your portal.', 'error');
    return;
  }

  saveProfile(profile);
  loadDashboard();
});

closeQrModalButton.addEventListener('click', () => {
  qrModal.style.display = 'none';
  qrModalBody.innerHTML = '';
});

downloadQrButton.addEventListener('click', downloadCurrentQr);

window.addEventListener('click', (event) => {
  if (event.target === qrModal) {
    qrModal.style.display = 'none';
    qrModalBody.innerHTML = '';
  }
});

const savedProfile = loadSavedProfile();
if (savedProfile) {
  studentNameInput.value = savedProfile.student_name || '';
  studentEmailInput.value = savedProfile.email || '';
  studentEnrollmentInput.value = savedProfile.enrollment_no || '';
  studentDepartmentInput.value = savedProfile.department || '';
}

loadDashboard();
