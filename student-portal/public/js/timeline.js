// Timeline page script
const timelineMessage = document.getElementById('timelineMessage');
const timelineContainer = document.getElementById('timelineContainer');

function showTimelineMessage(text, type = 'info') {
  timelineMessage.textContent = text;
  timelineMessage.className = `message ${type}`;
  timelineMessage.style.display = 'block';
}

function renderTimeline(registrations) {
  timelineContainer.innerHTML = '';
  const sorted = [...registrations].sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)));

  if (sorted.length === 0) {
    timelineContainer.innerHTML = '<div class="empty-state">No events are available in your timeline yet.</div>';
    return;
  }

  sorted.forEach((item) => {
    const state = item.registration_status === 'waitlisted'
      ? 'Waitlisted'
      : isStudentPastDate(item.event_date)
        ? 'Completed'
        : 'Upcoming';

    const card = document.createElement('article');
    card.className = 'card timeline-card';
    card.innerHTML = `
      <div class="timeline-chip">${escapeStudentHtml(state)}</div>
      <h3>${escapeStudentHtml(item.event_name)}</h3>
      <div class="card-meta">
        <div><strong>Date:</strong> ${formatStudentDate(item.event_date)}</div>
        <div><strong>Location:</strong> ${escapeStudentHtml(item.event_location || '--')}</div>
        <div><strong>Status:</strong> ${escapeStudentHtml(item.registration_status)}</div>
      </div>
    `;
    timelineContainer.appendChild(card);
  });
}

async function loadTimeline() {
  const savedProfile = getActiveStudentProfile();

  try {
    const { registrations } = await fetchStudentPortalData();
    renderTimeline(registrations);
  } catch (error) {
    showTimelineMessage(error.message || 'Unable to load timeline.', 'error');
  }
}

loadTimeline();
