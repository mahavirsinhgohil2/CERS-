// Admin registrations script
// Provides event-wise view, waitlist view, search/filter, and CSV export.
const registrationsContainer = document.getElementById('registrationsContainer');
const registrationsMessage = document.getElementById('registrationsMessage');
const searchInput = document.getElementById('searchInput');
const eventFilter = document.getElementById('eventFilter');
const departmentFilter = document.getElementById('departmentFilter');
const statusFilter = document.getElementById('statusFilter');
const eligibilityFilter = document.getElementById('eligibilityFilter');
const feedbackFilter = document.getElementById('feedbackFilter');
const clearFiltersButton = document.getElementById('clearFiltersButton');
const exportCsvButton = document.getElementById('exportCsvButton');

let allEventGroups = [];

function showMessage(text, type) {
  registrationsMessage.textContent = text;
  registrationsMessage.className = `message ${type}`;
  registrationsMessage.style.display = 'block';
}

function hideMessage() {
  registrationsMessage.style.display = 'none';
  registrationsMessage.textContent = '';
}

function buildQueryFromFilters() {
  const params = new URLSearchParams();

  if (searchInput.value.trim()) {
    params.set('search', searchInput.value.trim());
  }
  if (eventFilter.value) {
    params.set('event_id', eventFilter.value);
  }
  if (departmentFilter.value) {
    params.set('department', departmentFilter.value);
  }
  if (statusFilter.value) {
    params.set('status', statusFilter.value);
  }
  if (eligibilityFilter.value) {
    params.set('eligibility', eligibilityFilter.value);
  }
  if (feedbackFilter.value) {
    params.set('feedback', feedbackFilter.value);
  }

  return params.toString();
}

function createRegistrationCard(registration, eventName) {
  const card = document.createElement('div');
  card.className = 'registration-card';

  card.innerHTML = `
    <strong>${registration.student_name}</strong>
    <div class="registration-details">
      <div><strong>Enrollment No:</strong> ${registration.enrollment_no}</div>
      <div><strong>Department:</strong> ${registration.department}</div>
      <div><strong>Phone:</strong> ${registration.phone}</div>
      <div><strong>Email:</strong> ${registration.email}</div>
      <div><strong>Status:</strong> ${registration.registration_status}</div>
      <div><strong>Event:</strong> ${eventName}</div>
    </div>
    <div class="actions" style="margin-top:10px;">
      <button class="btn btn-danger" type="button" data-delete-registration-id="${registration.id}">Delete</button>
    </div>
  `;

  return card;
}

function createRegistrationSection(title, list, eventName) {
  const section = document.createElement('div');
  section.className = 'registration-status-section';

  section.innerHTML = `
    <h4>${title} (${list.length})</h4>
    ${list.length === 0 ? '<div class="empty-state">No students in this section.</div>' : '<div class="registration-list"></div>'}
  `;

  if (list.length > 0) {
    const container = section.querySelector('.registration-list');
    list.forEach((registration) => {
      container.appendChild(createRegistrationCard(registration, eventName));
    });
  }

  return section;
}

function renderRegistrations(eventGroups) {
  registrationsContainer.innerHTML = '';

  if (eventGroups.length === 0) {
    registrationsContainer.innerHTML = '<div class="empty-state">No records found for selected filters.</div>';
    return;
  }

  eventGroups.forEach((eventGroup) => {
    const groupSection = document.createElement('section');
    groupSection.className = 'event-group';

    groupSection.innerHTML = `
      <div class="event-group-header">
        <h3>${eventGroup.event_name}</h3>
        <div class="event-card-details">
          <div><strong>Date:</strong> ${eventGroup.event_date}</div>
          <div><strong>Location:</strong> ${eventGroup.event_location}</div>
          <div><strong>Eligibility:</strong> <span class="eligibility-badge">${eventGroup.eligibility_criteria}</span></div>
          <div><strong>Seat Capacity:</strong> ${eventGroup.seat_capacity}</div>
          <div><strong>Confirmed:</strong> ${eventGroup.confirmed_count}</div>
          <div><strong>Waitlisted:</strong> ${eventGroup.waitlist_count}</div>
          <div><strong>Available Seats:</strong> ${eventGroup.available_seats}</div>
        </div>
      </div>
      <div class="event-group-body"></div>
    `;

    const body = groupSection.querySelector('.event-group-body');
    body.appendChild(createRegistrationSection('Confirmed Students', eventGroup.confirmed_registrations, eventGroup.event_name));
    body.appendChild(createRegistrationSection('Waitlisted Students', eventGroup.waitlisted_registrations, eventGroup.event_name));

    registrationsContainer.appendChild(groupSection);
  });

  registrationsContainer.querySelectorAll('[data-delete-registration-id]').forEach((button) => {
    button.addEventListener('click', async (event) => {
      const registrationId = event.currentTarget.getAttribute('data-delete-registration-id');
      const isConfirmed = window.confirm('Delete this registration? If it is confirmed, first waitlisted student will be promoted.');

      if (!isConfirmed) {
        return;
      }

      try {
        const response = await fetch(`${window.API_BASE}/registrations/${registrationId}`, {
          method: 'DELETE',
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Failed to delete registration.');
        }

        showMessage(result.message || 'Registration deleted successfully.', 'success');
        await loadRegistrations();
      } catch (error) {
        showMessage(error.message || 'Could not delete registration.', 'error');
      }
    });
  });
}

function applyFiltersToEvents(eventGroups, registrations) {
  const eventMap = new Map();
  eventGroups.forEach((eventGroup) => {
    eventMap.set(String(eventGroup.event_id), {
      ...eventGroup,
      registrations: [],
      confirmed_registrations: [],
      waitlisted_registrations: [],
      confirmed_count: 0,
      waitlist_count: 0,
      available_seats: Number(eventGroup.seat_capacity || 0),
    });
  });

  registrations.forEach((registration) => {
    const eventItem = eventMap.get(String(registration.event_id));
    if (!eventItem) {
      return;
    }

    eventItem.registrations.push(registration);
    if (registration.registration_status === 'waitlisted') {
      eventItem.waitlisted_registrations.push(registration);
    } else {
      eventItem.confirmed_registrations.push(registration);
    }
  });

  const merged = Array.from(eventMap.values())
    .map((eventItem) => {
      const confirmedCount = eventItem.confirmed_registrations.length;
      return {
        ...eventItem,
        confirmed_count: confirmedCount,
        waitlist_count: eventItem.waitlisted_registrations.length,
        available_seats: Math.max(Number(eventItem.seat_capacity || 0) - confirmedCount, 0),
      };
    })
    .filter((eventItem) => eventItem.registrations.length > 0 || eventItem.confirmed_count > 0 || eventItem.waitlist_count > 0);

  return merged;
}

function fillFilterOptions(eventGroups, registrations) {
  const selectedEvent = eventFilter.value;
  const selectedDepartment = departmentFilter.value;
  const selectedEligibility = eligibilityFilter.value;

  eventFilter.innerHTML = '<option value="">All Events</option>';
  departmentFilter.innerHTML = '<option value="">All Departments</option>';
  eligibilityFilter.innerHTML = '<option value="">All Eligibility Types</option>';

  const departmentSet = new Set();
  const eligibilitySet = new Set();

  eventGroups.forEach((eventItem) => {
    const option = document.createElement('option');
    option.value = String(eventItem.event_id);
    option.textContent = eventItem.event_name;
    eventFilter.appendChild(option);

    if (eventItem.eligibility_criteria) {
      eligibilitySet.add(eventItem.eligibility_criteria);
    }
  });

  registrations.forEach((registration) => {
    if (registration.department) {
      departmentSet.add(registration.department);
    }
  });

  Array.from(departmentSet).sort().forEach((department) => {
    const option = document.createElement('option');
    option.value = department;
    option.textContent = department;
    departmentFilter.appendChild(option);
  });

  Array.from(eligibilitySet).sort().forEach((eligibility) => {
    const option = document.createElement('option');
    option.value = eligibility;
    option.textContent = eligibility;
    eligibilityFilter.appendChild(option);
  });

  if (selectedEvent) {
    eventFilter.value = selectedEvent;
  }

  if (selectedDepartment) {
    departmentFilter.value = selectedDepartment;
  }

  if (selectedEligibility) {
    eligibilityFilter.value = selectedEligibility;
  }
}

async function loadRegistrations() {
  try {
    const [groupResponse, registrationResponse] = await Promise.all([
      fetch(`${window.API_BASE}/registrations-by-event`),
      fetch(`${window.API_BASE}/registrations?${buildQueryFromFilters()}`),
    ]);

    if (!groupResponse.ok || !registrationResponse.ok) {
      throw new Error('Failed to load registrations.');
    }

    const eventGroups = await groupResponse.json();
    const registrations = await registrationResponse.json();

    allEventGroups = eventGroups;
    fillFilterOptions(eventGroups, registrations);
    renderRegistrations(applyFiltersToEvents(eventGroups, registrations));
    hideMessage();
  } catch (error) {
    showMessage(error.message || 'Could not load registrations.', 'error');
  }
}

searchInput.addEventListener('input', loadRegistrations);
eventFilter.addEventListener('change', loadRegistrations);
departmentFilter.addEventListener('change', loadRegistrations);
statusFilter.addEventListener('change', loadRegistrations);
eligibilityFilter.addEventListener('change', loadRegistrations);
feedbackFilter.addEventListener('change', loadRegistrations);

clearFiltersButton.addEventListener('click', () => {
  searchInput.value = '';
  eventFilter.value = '';
  departmentFilter.value = '';
  statusFilter.value = '';
  eligibilityFilter.value = '';
  feedbackFilter.value = '';
  renderRegistrations(allEventGroups);
  loadRegistrations();
});

exportCsvButton.addEventListener('click', () => {
  window.location.href = `${window.API_BASE}/registrations/export/csv`;
});

loadRegistrations();
