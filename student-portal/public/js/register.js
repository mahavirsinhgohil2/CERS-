// Student registration script
// Loads events, validates form, submits registration to backend API.
const registrationForm = document.getElementById('registrationForm');
const eventSelect = document.getElementById('eventId');
const formMessage = document.getElementById('formMessage');
const selectedEventInfo = document.getElementById('selectedEventInfo');
const customFieldsContainer = document.getElementById('customFieldsContainer');
const qrCodeSection = document.getElementById('qrCodeSection');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const API_BASE = window.API_BASE;
const eventsById = new Map();

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

function getSelectedEventId() {
  const params = new URLSearchParams(window.location.search);
  return params.get('eventId');
}

const savedProfile = loadSavedProfile();
if (savedProfile) {
  document.getElementById('studentName').value = savedProfile.student_name || '';
  document.getElementById('enrollmentNo').value = savedProfile.enrollment_no || '';
  document.getElementById('email').value = savedProfile.email || '';
  document.getElementById('department').value = savedProfile.department || '';
}

function showMessage(text, type) {
  formMessage.textContent = text;
  formMessage.className = `message ${type}`;
  formMessage.style.display = 'block';
}

function clearMessage() {
  formMessage.style.display = 'none';
  formMessage.textContent = '';
}

function hideQrCode() {
  qrCodeSection.style.display = 'none';
  qrCodeContainer.innerHTML = '';
}

function setSelectedEventInfo(text, isEmptyState) {
  selectedEventInfo.textContent = text;
  selectedEventInfo.className = isEmptyState ? 'selection-info empty-state' : 'selection-info';
}

function createCustomFieldElement(field) {
  const fieldWrap = document.createElement('div');
  fieldWrap.className = 'field';

  const label = document.createElement('label');
  label.setAttribute('for', `custom-${field.key}`);
  label.textContent = `${field.label}${field.required ? ' *' : ''}`;

  let inputElement;

  if (field.type === 'textarea') {
    inputElement = document.createElement('textarea');
  } else if (field.type === 'select') {
    inputElement = document.createElement('select');
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select an option';
    inputElement.appendChild(defaultOption);

    (field.options || []).forEach((optionValue) => {
      const option = document.createElement('option');
      option.value = optionValue;
      option.textContent = optionValue;
      inputElement.appendChild(option);
    });
  } else {
    inputElement = document.createElement('input');
    inputElement.type = field.type === 'number' ? 'number' : field.type || 'text';
  }

  inputElement.id = `custom-${field.key}`;
  inputElement.name = field.key;
  inputElement.dataset.customKey = field.key;
  inputElement.required = Boolean(field.required);

  fieldWrap.appendChild(label);
  fieldWrap.appendChild(inputElement);

  return fieldWrap;
}

function renderCustomFields(fields) {
  customFieldsContainer.innerHTML = '';

  if (!fields || fields.length === 0) {
    customFieldsContainer.innerHTML = '<div class="empty-state">No extra fields for this event.</div>';
    return;
  }

  fields.forEach((field) => {
    customFieldsContainer.appendChild(createCustomFieldElement(field));
  });
}

function getCustomAnswers() {
  const answers = {};

  customFieldsContainer.querySelectorAll('[data-custom-key]').forEach((input) => {
    answers[input.dataset.customKey] = input.value.trim();
  });

  return answers;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeText(value) {
  return value.trim().toLowerCase();
}

function isDepartmentAllowed(department, eligibilityCriteria) {
  const departmentValue = normalizeText(department);
  const criteriaValue = normalizeText(eligibilityCriteria || 'Open to All');

  if (!criteriaValue || criteriaValue === 'open to all') {
    return true;
  }

  if (criteriaValue.includes('final year') || criteriaValue.includes('semester')) {
    return true;
  }

  if (criteriaValue.includes('department only')) {
    const allowedDepartment = criteriaValue.replace('department only', '').trim();
    return departmentValue === allowedDepartment;
  }

  if (criteriaValue.includes('students')) {
    const allowedDepartments = criteriaValue
      .replace('students', '')
      .split('and')
      .map((item) => item.trim())
      .filter(Boolean);

    return allowedDepartments.some((item) => item === departmentValue);
  }

  return true;
}

function updateSelectedEventInfo() {
  const selectedEvent = eventsById.get(eventSelect.value);

  if (!selectedEvent) {
    setSelectedEventInfo('Select an event to see the eligibility criteria.', true);
    renderCustomFields([]);
    return;
  }

  setSelectedEventInfo(
    `Selected Event: ${selectedEvent.name} | Date: ${selectedEvent.date} | Eligibility: ${selectedEvent.eligibility_criteria || 'Open to All'}`,
    false
  );
  renderCustomFields(selectedEvent.custom_fields || []);
}

async function loadEvents() {
  try {
    const response = await fetch(`${API_BASE}/events`);

    if (!response.ok) {
      throw new Error('Unable to load events.');
    }

    const events = await response.json();
    eventSelect.innerHTML = '<option value="">Select an event</option>';
    eventsById.clear();

    events.forEach((event) => {
      eventsById.set(String(event.id), event);
      const option = document.createElement('option');
      option.value = event.id;
      option.textContent = `${event.name} - ${event.date} (${event.eligibility_criteria || 'Open to All'})`;
      eventSelect.appendChild(option);
    });

    const selectedEventId = getSelectedEventId();
    if (selectedEventId) {
      eventSelect.value = selectedEventId;
    }

    updateSelectedEventInfo();
  } catch (error) {
    eventSelect.innerHTML = '<option value="">Unable to load events</option>';
    showMessage(error.message || 'Could not load events.', 'error');
  }
}

eventSelect.addEventListener('change', updateSelectedEventInfo);

registrationForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearMessage();
  hideQrCode();

  const studentName = document.getElementById('studentName').value.trim();
  const enrollmentNo = document.getElementById('enrollmentNo').value.trim();
  const email = document.getElementById('email').value.trim();
  const department = document.getElementById('department').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const eventId = eventSelect.value;
  const selectedEvent = eventsById.get(eventId);
  const customAnswers = getCustomAnswers();

  if (!studentName || !enrollmentNo || !email || !department || !phone || !eventId) {
    showMessage('All fields are required.', 'error');
    return;
  }

  if (!isValidEmail(email)) {
    showMessage('Please enter a valid email address.', 'error');
    return;
  }

  if (selectedEvent && !isDepartmentAllowed(department, selectedEvent.eligibility_criteria)) {
    showMessage(`This event is for ${selectedEvent.eligibility_criteria}. Please choose a suitable event.`, 'error');
    return;
  }

  if (selectedEvent) {
    const requiredField = (selectedEvent.custom_fields || []).find((field) => field.required && !String(customAnswers[field.key] || '').trim());
    if (requiredField) {
      showMessage(`${requiredField.label} is required.`, 'error');
      return;
    }
  }

  try {
    const response = await fetch(`${API_BASE}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_name: studentName,
        enrollment_no: enrollmentNo,
        email,
        department,
        phone,
        event_id: Number(eventId),
        custom_answers: customAnswers,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Registration failed.');
    }

    registrationForm.reset();
    showMessage(result.message || 'Registration successful.', 'success');
    saveProfile({
      student_name: studentName,
      enrollment_no: enrollmentNo,
      email,
      department,
    });
    updateSelectedEventInfo();

    if (window.QRCode && result.registration) {
      const qrPayload = JSON.stringify({
        registrationId: result.registration.id,
        eventName: selectedEvent ? selectedEvent.name : '',
        studentName: result.registration.student_name,
        eventId: result.registration.event_id,
      });

      qrCodeContainer.innerHTML = '';
      new QRCode(qrCodeContainer, {
        text: qrPayload,
        width: 180,
        height: 180,
        colorDark: '#1F1F1F',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M,
      });

      qrCodeSection.style.display = 'block';
    }
  } catch (error) {
    showMessage(error.message || 'Something went wrong while submitting registration.', 'error');
  }
});

loadEvents();
