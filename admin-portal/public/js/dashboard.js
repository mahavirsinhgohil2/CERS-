// Admin dashboard script
// Keeps logic simple while calculating rich insights from existing APIs.
const totalEventsEl = document.getElementById('totalEvents');
const totalRegistrationsEl = document.getElementById('totalRegistrations');
const upcomingEventsEl = document.getElementById('upcomingEvents');
const eventsWithRegistrationsEl = document.getElementById('eventsWithRegistrations');
const openToAllEventsEl = document.getElementById('openToAllEvents');
const departmentSpecificEventsEl = document.getElementById('departmentSpecificEvents');

const mostPopularEventEl = document.getElementById('mostPopularEvent');
const leastPopularEventEl = document.getElementById('leastPopularEvent');
const nextUpcomingEventEl = document.getElementById('nextUpcomingEvent');
const uniqueDepartmentsEl = document.getElementById('uniqueDepartments');

const recentRegistrationsBody = document.getElementById('recentRegistrationsBody');
const eventPerformanceContainer = document.getElementById('eventPerformanceContainer');
const currentDateText = document.getElementById('currentDateText');
const systemStatus = document.getElementById('systemStatus');
const dashboardMessage = document.getElementById('dashboardMessage');
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
  },
];

function showMessage(text, type) {
  dashboardMessage.textContent = text;
  dashboardMessage.className = `message ${type}`;
  dashboardMessage.style.display = 'block';
}

function formatDate(dateText) {
  const dateObject = new Date(dateText);
  if (Number.isNaN(dateObject.getTime())) {
    return dateText;
  }
  return dateObject.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function setHeaderDateAndStatus() {
  const now = new Date();
  currentDateText.textContent = `Date: ${now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })}`;
  systemStatus.textContent = 'System Status: Online and synchronized';
}

function getRegistrationCountMap(registrations) {
  const countMap = {};

  registrations.forEach((registration) => {
    const eventId = Number(registration.event_id);
    countMap[eventId] = (countMap[eventId] || 0) + 1;
  });

  return countMap;
}

function getEventInterestStatus(registrationCount) {
  if (registrationCount === 0) {
    return { label: 'No registrations', className: 'status-none' };
  }

  if (registrationCount <= 3) {
    return { label: 'Few registrations', className: 'status-few' };
  }

  return { label: 'High interest', className: 'status-high' };
}

function renderRecentRegistrations(registrations) {
  recentRegistrationsBody.innerHTML = '';

  const recentItems = [...registrations]
    .sort((a, b) => Number(b.id) - Number(a.id))
    .slice(0, 6);

  if (recentItems.length === 0) {
    recentRegistrationsBody.innerHTML = '<tr><td colspan="4" class="empty-state">No registrations available.</td></tr>';
    return;
  }

  recentItems.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.student_name}</td>
      <td>${item.event_name || 'Unknown Event'}</td>
      <td>${item.department}</td>
      <td>#${item.id}</td>
    `;
    recentRegistrationsBody.appendChild(row);
  });
}

function renderEventPerformance(events, registrationCountMap) {
  eventPerformanceContainer.innerHTML = '';

  if (events.length === 0) {
    eventPerformanceContainer.innerHTML = '<div class="empty-state">No events available for performance tracking.</div>';
    return;
  }

  events.forEach((eventItem) => {
    const totalRegistrations = registrationCountMap[eventItem.id] || 0;
    const status = getEventInterestStatus(totalRegistrations);

    const card = document.createElement('article');
    card.className = 'performance-card card-glass';
    card.innerHTML = `
      <h4>${eventItem.name}</h4>
      <div class="performance-meta">
        <div><strong>Date:</strong> ${formatDate(eventItem.date)}</div>
        <div><strong>Eligibility:</strong> <span class="eligibility-badge">${eventItem.eligibility_criteria || 'Open to All'}</span></div>
        <div><strong>Total Registrations:</strong> ${totalRegistrations}</div>
      </div>
      <span class="status-chip ${status.className}">${status.label}</span>
    `;

    eventPerformanceContainer.appendChild(card);
  });
}

function updateKpiCards(events, registrations, registrationCountMap) {
  const today = new Date();
  const todayText = today.toISOString().split('T')[0];

  const upcomingEvents = events.filter((eventItem) => eventItem.date >= todayText);
  const eventsWithRegistrations = events.filter((eventItem) => (registrationCountMap[eventItem.id] || 0) > 0);
  const openToAllEvents = events.filter((eventItem) => (eventItem.eligibility_criteria || 'Open to All') === 'Open to All');
  const departmentSpecificEvents = events.length - openToAllEvents.length;

  totalEventsEl.textContent = String(events.length);
  totalRegistrationsEl.textContent = String(registrations.length);
  upcomingEventsEl.textContent = String(upcomingEvents.length);
  eventsWithRegistrationsEl.textContent = String(eventsWithRegistrations.length);
  openToAllEventsEl.textContent = String(openToAllEvents.length);
  departmentSpecificEventsEl.textContent = String(departmentSpecificEvents);
}

function updateInsights(events, registrations, registrationCountMap) {
  const eventsSortedByCount = [...events].sort((a, b) => {
    const aCount = registrationCountMap[a.id] || 0;
    const bCount = registrationCountMap[b.id] || 0;
    return bCount - aCount;
  });

  const mostPopular = eventsSortedByCount[0];
  const leastPopular = eventsSortedByCount[eventsSortedByCount.length - 1];

  const todayText = new Date().toISOString().split('T')[0];
  const nextUpcoming = [...events]
    .filter((eventItem) => eventItem.date >= todayText)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const uniqueDepartments = new Set(
    registrations
      .map((item) => String(item.department || '').trim())
      .filter(Boolean)
      .map((value) => value.toUpperCase())
  );

  mostPopularEventEl.textContent = mostPopular
    ? `${mostPopular.name} (${registrationCountMap[mostPopular.id] || 0})`
    : '--';

  leastPopularEventEl.textContent = leastPopular
    ? `${leastPopular.name} (${registrationCountMap[leastPopular.id] || 0})`
    : '--';

  nextUpcomingEventEl.textContent = nextUpcoming
    ? `${nextUpcoming.name} (${formatDate(nextUpcoming.date)})`
    : 'No upcoming events';

  uniqueDepartmentsEl.textContent = String(uniqueDepartments.size);
}

function renderDashboard(events, registrations) {
  const registrationCountMap = getRegistrationCountMap(registrations);

  updateKpiCards(events, registrations, registrationCountMap);
  updateInsights(events, registrations, registrationCountMap);
  renderRecentRegistrations(registrations);
  renderEventPerformance(events, registrationCountMap);
}

function useFallbackDashboard(messageText) {
  renderDashboard(DUMMY_EVENTS, DUMMY_REGISTRATIONS);
  showMessage(messageText, 'info');
  systemStatus.textContent = 'System Status: Demo data mode';
}

async function loadDashboardSummary() {
  if (FORCE_DEMO_MODE) {
    useFallbackDashboard('Demo mode is ON. Showing sample dashboard data.');
    return;
  }

  try {
    if (!window.API_BASE) {
      throw new Error('API base is not available.');
    }

    const [eventsResponse, registrationsResponse] = await Promise.all([
      fetch(`${window.API_BASE}/events`),
      fetch(`${window.API_BASE}/registrations`),
    ]);

    if (!eventsResponse.ok || !registrationsResponse.ok) {
      throw new Error('Failed to load dashboard data.');
    }

    const events = await eventsResponse.json();
    const registrations = await registrationsResponse.json();

    if (!Array.isArray(events) || events.length === 0 || !Array.isArray(registrations) || registrations.length === 0) {
      useFallbackDashboard('API returned empty data. Showing demo dashboard data.');
      return;
    }

    renderDashboard(events, registrations);

    dashboardMessage.style.display = 'none';
  } catch (error) {
    useFallbackDashboard('API not available. Showing demo dashboard data.');
  }
}

setHeaderDateAndStatus();
loadDashboardSummary();
