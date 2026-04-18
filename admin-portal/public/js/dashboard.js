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

const API_BASE = window.API_BASE;

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

async function loadDashboardSummary() {
  try {
    const [eventsResponse, registrationsResponse] = await Promise.all([
      fetch(`${API_BASE}/events`),
      fetch(`${API_BASE}/registrations`),
    ]);

    if (!eventsResponse.ok || !registrationsResponse.ok) {
      throw new Error('Failed to load dashboard data.');
    }

    const events = await eventsResponse.json();
    const registrations = await registrationsResponse.json();

    const registrationCountMap = getRegistrationCountMap(registrations);

    updateKpiCards(events, registrations, registrationCountMap);
    updateInsights(events, registrations, registrationCountMap);
    renderRecentRegistrations(registrations);
    renderEventPerformance(events, registrationCountMap);

    dashboardMessage.style.display = 'none';
  } catch (error) {
    showMessage(error.message || 'Something went wrong.', 'error');
    systemStatus.textContent = 'System Status: Unable to sync data';
  }
}

setHeaderDateAndStatus();
loadDashboardSummary();
