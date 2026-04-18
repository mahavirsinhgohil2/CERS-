// Student events page script
// Loads events from backend API and shows cards.
const eventsContainer = document.getElementById('eventsContainer');
const eventsMessage = document.getElementById('eventsMessage');
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

function showMessage(text) {
  eventsMessage.textContent = text;
  eventsMessage.style.display = 'block';
}

function createEventCard(event) {
  const card = document.createElement('article');
  card.className = 'card';
  const waitlistText = Number(event.enable_waitlist || 0) === 1 ? 'Yes' : 'No';
  const availabilityText = Number(event.available_seats || 0) > 0 ? `${event.available_seats} seats left` : 'Full';

  card.innerHTML = `
    <h3>${event.name}</h3>
    <div class="card-meta">
      <div><strong>Date:</strong> ${event.date}</div>
      <div><strong>Location:</strong> ${event.location}</div>
      <div><strong>Eligibility:</strong> <span class="eligibility-badge">${event.eligibility_criteria || 'Open to All'}</span></div>
      <div><strong>Seat Capacity:</strong> ${event.seat_capacity || 0}</div>
      <div><strong>Confirmed:</strong> ${event.confirmed_count || 0}</div>
      <div><strong>Waitlist:</strong> ${event.waitlist_count || 0}</div>
      <div><strong>Waitlist Enabled:</strong> ${waitlistText}</div>
      <div><strong>Availability:</strong> ${availabilityText}</div>
      <div><strong>Description:</strong> ${event.description || 'No description available.'}</div>
    </div>
    <div class="actions">
      <a class="btn btn-primary" href="register.html?eventId=${event.id}">Register Now</a>
    </div>
  `;

  return card;
}

function renderEvents(events) {
  eventsContainer.innerHTML = '';

  if (!events || events.length === 0) {
    eventsContainer.innerHTML = '<div class="empty-state">No events available right now.</div>';
    return;
  }

  events.forEach((event) => {
    eventsContainer.appendChild(createEventCard(event));
  });
}

async function loadEvents() {
  if (FORCE_DEMO_MODE) {
    showMessage('Demo mode is ON. Showing sample events.', 'info');
    renderEvents(DUMMY_EVENTS);
    return;
  }

  try {
    if (!window.API_BASE) {
      throw new Error('API base is not available.');
    }

    const response = await fetch(`${window.API_BASE}/events`);

    if (!response.ok) {
      throw new Error('Failed to load events.');
    }

    const events = await response.json();
    if (!Array.isArray(events) || events.length === 0) {
      showMessage('API returned no events. Showing demo data.', 'info');
      renderEvents(DUMMY_EVENTS);
      return;
    }

    renderEvents(events);
  } catch (error) {
    showMessage('API not available. Showing demo events.', 'info');
    renderEvents(DUMMY_EVENTS);
  }
}

loadEvents();
