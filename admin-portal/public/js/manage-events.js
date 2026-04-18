// Manage Events page script
// Supports add, edit, and delete in one simple beginner-friendly page.
const eventFormElement = document.getElementById('eventFormElement');
const eventIdInput = document.getElementById('eventId');
const eventNameInput = document.getElementById('eventName');
const eventDateInput = document.getElementById('eventDate');
const eventLocationInput = document.getElementById('eventLocation');
const eventEligibilityInput = document.getElementById('eventEligibility');
const eventSeatCapacityInput = document.getElementById('eventSeatCapacity');
const eventWaitlistInput = document.getElementById('eventWaitlist');
const eventDescriptionInput = document.getElementById('eventDescription');
const customFieldsContainer = document.getElementById('customFieldsContainer');
const addCustomFieldButton = document.getElementById('addCustomFieldButton');
const eventSubmitButton = document.getElementById('eventSubmitButton');
const clearEditButton = document.getElementById('clearEditButton');
const manageEventMessage = document.getElementById('manageEventMessage');
const eventsList = document.getElementById('eventsList');
const eventsListMessage = document.getElementById('eventsListMessage');

function showManageMessage(text, type) {
  manageEventMessage.textContent = text;
  manageEventMessage.className = `message ${type}`;
  manageEventMessage.style.display = 'block';
}

function hideManageMessage() {
  manageEventMessage.style.display = 'none';
  manageEventMessage.textContent = '';
}

function showEventsListMessage(text, type) {
  eventsListMessage.textContent = text;
  eventsListMessage.className = `message ${type}`;
  eventsListMessage.style.display = 'block';
}

function clearForm() {
  eventIdInput.value = '';
  eventNameInput.value = '';
  eventDateInput.value = '';
  eventLocationInput.value = '';
  eventEligibilityInput.value = 'Open to All';
  eventSeatCapacityInput.value = '100';
  eventWaitlistInput.value = '0';
  eventDescriptionInput.value = '';
  renderCustomFields([]);
  eventSubmitButton.textContent = 'Add Event';
}

function createCustomFieldKey(labelText) {
  return labelText
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '') || 'custom_field';
}

function createCustomFieldRow(field = {}) {
  const row = document.createElement('div');
  row.className = 'custom-field-row';

  row.innerHTML = `
    <div class="custom-field-grid">
      <div class="field">
        <label>Field Label</label>
        <input type="text" data-field-label placeholder="Example: Team Size" />
      </div>
      <div class="field">
        <label>Field Key</label>
        <input type="text" data-field-key placeholder="Example: team_size" />
      </div>
      <div class="field">
        <label>Field Type</label>
        <select data-field-type>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="textarea">Textarea</option>
          <option value="select">Select</option>
        </select>
      </div>
      <div class="field">
        <label>Options for Select</label>
        <input type="text" data-field-options placeholder="Option 1, Option 2, Option 3" />
      </div>
      <label class="field-checkbox">
        <input type="checkbox" data-field-required />
        Required
      </label>
      <button class="btn btn-danger custom-field-remove" type="button" data-remove-field>Remove</button>
    </div>
  `;

  row.querySelector('[data-field-label]').value = field.label || '';
  row.querySelector('[data-field-key]').value = field.key || '';
  row.querySelector('[data-field-type]').value = field.type || 'text';
  row.querySelector('[data-field-options]').value = Array.isArray(field.options) ? field.options.join(', ') : (field.options || '');
  row.querySelector('[data-field-required]').checked = Boolean(field.required);

  row.querySelector('[data-remove-field]').addEventListener('click', () => {
    row.remove();

    if (customFieldsContainer.children.length === 0) {
      renderCustomFields([]);
    }
  });

  return row;
}

function renderCustomFields(customFields = []) {
  customFieldsContainer.innerHTML = '';

  const fieldList = customFields.length > 0 ? customFields : [{}];
  fieldList.forEach((field) => {
    customFieldsContainer.appendChild(createCustomFieldRow(field));
  });
}

function collectCustomFields() {
  const rows = Array.from(customFieldsContainer.querySelectorAll('.custom-field-row'));

  return rows
    .map((row) => {
      const label = row.querySelector('[data-field-label]').value.trim();
      const keyValue = row.querySelector('[data-field-key]').value.trim();
      const type = row.querySelector('[data-field-type]').value;
      const optionsText = row.querySelector('[data-field-options]').value.trim();
      const required = row.querySelector('[data-field-required]').checked;

      if (!label && !keyValue && !optionsText) {
        return null;
      }

      const key = keyValue || createCustomFieldKey(label);
      const options = optionsText
        ? optionsText.split(',').map((option) => option.trim()).filter(Boolean)
        : [];

      return {
        label: label || key,
        key,
        type,
        required,
        options,
      };
    })
    .filter(Boolean);
}

function fillFormForEdit(eventItem) {
  eventIdInput.value = eventItem.id;
  eventNameInput.value = eventItem.name;
  eventDateInput.value = eventItem.date;
  eventLocationInput.value = eventItem.location;
  eventEligibilityInput.value = eventItem.eligibility_criteria || 'Open to All';
  eventSeatCapacityInput.value = String(eventItem.seat_capacity || 100);
  eventWaitlistInput.value = String(Number(eventItem.enable_waitlist || 0));
  eventDescriptionInput.value = eventItem.description || '';
  renderCustomFields(eventItem.custom_fields || []);
  eventSubmitButton.textContent = 'Update Event';
  window.location.hash = '#eventForm';
}

function createEventCard(eventItem) {
  const card = document.createElement('article');
  card.className = 'card event-card';
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.dataset.cardEditId = eventItem.id;

  card.innerHTML = `
    <h3>${eventItem.name}</h3>
    <div class="card-meta">
      <div><strong>Date:</strong> ${eventItem.date}</div>
      <div><strong>Location:</strong> ${eventItem.location}</div>
      <div><strong>Eligibility:</strong> <span class="eligibility-badge">${eventItem.eligibility_criteria || 'Open to All'}</span></div>
      <div><strong>Seat Capacity:</strong> ${eventItem.seat_capacity || 0}</div>
      <div><strong>Confirmed:</strong> ${eventItem.confirmed_count || 0}</div>
      <div><strong>Waitlisted:</strong> ${eventItem.waitlist_count || 0}</div>
      <div><strong>Available Seats:</strong> ${eventItem.available_seats || 0}</div>
      <div><strong>Waitlist Enabled:</strong> ${Number(eventItem.enable_waitlist || 0) === 1 ? 'Yes' : 'No'}</div>
      <div><strong>Custom Fields:</strong> ${Array.isArray(eventItem.custom_fields) ? eventItem.custom_fields.length : 0}</div>
      <div><strong>Description:</strong> ${eventItem.description || 'No description available.'}</div>
    </div>
    <p class="event-card-hint">Click the card to edit this event.</p>
    <div class="actions">
      <button class="btn btn-primary" type="button" data-edit-id="${eventItem.id}">Edit Event</button>
      <button class="btn btn-danger" type="button" data-delete-id="${eventItem.id}">Delete Event</button>
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
    eventsList.innerHTML = '';
    eventsListMessage.style.display = 'none';

    if (events.length === 0) {
      eventsList.innerHTML = '<div class="empty-state">No events available.</div>';
      return;
    }

    events.forEach((eventItem) => {
      eventsList.appendChild(createEventCard(eventItem));
    });

    eventsList.querySelectorAll('[data-card-edit-id]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if (event.target.closest('button')) {
          return;
        }

        const editId = card.getAttribute('data-card-edit-id');
        const selectedEvent = events.find((item) => String(item.id) === String(editId));
        if (selectedEvent) {
          fillFormForEdit(selectedEvent);
        }
      });

      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          const editId = card.getAttribute('data-card-edit-id');
          const selectedEvent = events.find((item) => String(item.id) === String(editId));
          if (selectedEvent) {
            fillFormForEdit(selectedEvent);
          }
        }
      });
    });

    eventsList.querySelectorAll('[data-edit-id]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        const editId = event.currentTarget.getAttribute('data-edit-id');
        const selectedEvent = events.find((item) => String(item.id) === String(editId));
        if (selectedEvent) {
          fillFormForEdit(selectedEvent);
        }
      });
    });

    eventsList.querySelectorAll('[data-delete-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        handleDeleteEvent(event);
      });
    });
  } catch (error) {
    showEventsListMessage(error.message || 'Could not load events.', 'error');
  }
}

async function handleDeleteEvent(event) {
  const eventId = event.currentTarget.getAttribute('data-delete-id');

  try {
    const response = await fetch(`${window.API_BASE}/events/${eventId}`, {
      method: 'DELETE',
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to delete event.');
    }

    showEventsListMessage(result.message || 'Event deleted successfully.', 'success');
    clearForm();
    loadEvents();
  } catch (error) {
    showEventsListMessage(error.message || 'Could not delete event.', 'error');
  }
}

eventFormElement.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideManageMessage();

  const eventId = eventIdInput.value.trim();
  const name = eventNameInput.value.trim();
  const date = eventDateInput.value;
  const location = eventLocationInput.value.trim();
  const eligibilityCriteria = eventEligibilityInput.value;
  const seatCapacity = Number(eventSeatCapacityInput.value || 0);
  const enableWaitlist = Number(eventWaitlistInput.value || 0);
  const description = eventDescriptionInput.value.trim();
  const customFields = collectCustomFields();

  if (!name || !date || !location) {
    showManageMessage('Name, date, and location are required.', 'error');
    return;
  }

  if (!Number.isFinite(seatCapacity) || seatCapacity <= 0) {
    showManageMessage('Seat capacity must be a valid number greater than 0.', 'error');
    return;
  }

  try {
    const isEditMode = Boolean(eventId);
    const response = await fetch(`${window.API_BASE}/events${isEditMode ? `/${eventId}` : ''}`, {
      method: isEditMode ? 'PUT' : 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        date,
        location,
        description,
        eligibility_criteria: eligibilityCriteria,
        seat_capacity: Math.floor(seatCapacity),
        enable_waitlist: enableWaitlist === 1 ? 1 : 0,
        custom_fields: customFields,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to save event.');
    }

    showManageMessage(result.message || 'Event saved successfully.', 'success');
    clearForm();
    loadEvents();
  } catch (error) {
    showManageMessage(error.message || 'Could not save event.', 'error');
  }
});

clearEditButton.addEventListener('click', clearForm);
addCustomFieldButton.addEventListener('click', () => {
  customFieldsContainer.appendChild(createCustomFieldRow());
});

renderCustomFields([]);
loadEvents();
