// Student events page script
// Loads events from backend API and shows cards.
const eventsContainer = document.getElementById('eventsContainer');
const eventsMessage = document.getElementById('eventsMessage');

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

async function loadEvents() {
  try {
    const response = await fetch(`${window.API_BASE}/events`);

    if (!response.ok) {
      throw new Error('Failed to load events.');
    }

    const events = await response.json();
    eventsContainer.innerHTML = '';

    if (events.length === 0) {
      eventsContainer.innerHTML = '<div class="empty-state">No events available right now.</div>';
      return;
    }

    events.forEach((event) => {
      eventsContainer.appendChild(createEventCard(event));
    });
  } catch (error) {
    showMessage(error.message || 'Something went wrong while loading events.');
  }
}

loadEvents();
