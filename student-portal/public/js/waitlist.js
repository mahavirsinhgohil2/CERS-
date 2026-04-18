// Waitlist page script
const waitlistMessage = document.getElementById('waitlistMessage');
const waitlistContainer = document.getElementById('waitlistContainer');

function showWaitlistMessage(text, type = 'info') {
  waitlistMessage.textContent = text;
  waitlistMessage.className = `message ${type}`;
  waitlistMessage.style.display = 'block';
}

function renderWaitlist(registrations) {
  waitlistContainer.innerHTML = '';
  const waitlisted = registrations.filter((item) => item.registration_status === 'waitlisted');
  const queueMap = new Map();

  waitlisted.forEach((item) => {
    const current = queueMap.get(item.event_id) || 0;
    queueMap.set(item.event_id, current + 1);
    item.position = current + 1;
  });

  if (waitlisted.length === 0) {
    waitlistContainer.innerHTML = '<div class="empty-state">You are not on any waitlist right now.</div>';
    return;
  }

  waitlisted.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <p class="eyebrow">Waitlist position #${item.position}</p>
      <h3>${escapeStudentHtml(item.event_name)}</h3>
      <div class="card-meta">
        <div><strong>Date:</strong> ${formatStudentDate(item.event_date)}</div>
        <div><strong>Location:</strong> ${escapeStudentHtml(item.event_location || '--')}</div>
        <div><strong>Status:</strong> Waitlisted</div>
      </div>
      <p>Seats may open if confirmed registrations are cancelled.</p>
    `;
    waitlistContainer.appendChild(card);
  });
}

async function loadWaitlist() {
  const savedProfile = getActiveStudentProfile();

  try {
    const { registrations } = await fetchStudentPortalData();
    renderWaitlist(registrations);
  } catch (error) {
    showWaitlistMessage(error.message || 'Unable to load waitlist.', 'error');
  }
}

loadWaitlist();
