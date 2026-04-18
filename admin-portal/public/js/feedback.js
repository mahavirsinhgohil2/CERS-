// Admin feedback management script
// Loads event-wise feedback summary and comments.
const feedbackEventFilter = document.getElementById('feedbackEventFilter');
const minRatingFilter = document.getElementById('minRatingFilter');
const clearFeedbackFilters = document.getElementById('clearFeedbackFilters');
const feedbackSummaryContainer = document.getElementById('feedbackSummaryContainer');
const feedbackCommentsContainer = document.getElementById('feedbackCommentsContainer');
const feedbackMessage = document.getElementById('feedbackMessage');

let allFeedbackRows = [];
let allSummaryRows = [];

function showMessage(text, type) {
  feedbackMessage.textContent = text;
  feedbackMessage.className = `message ${type}`;
  feedbackMessage.style.display = 'block';
}

function hideMessage() {
  feedbackMessage.style.display = 'none';
  feedbackMessage.textContent = '';
}

function formatDate(dateText) {
  if (!dateText) {
    return '--';
  }

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

function fillEventFilter(summaryRows) {
  feedbackEventFilter.innerHTML = '<option value="">All Events</option>';

  summaryRows.forEach((summaryItem) => {
    const option = document.createElement('option');
    option.value = String(summaryItem.event_id);
    option.textContent = summaryItem.event_name;
    feedbackEventFilter.appendChild(option);
  });
}

function renderSummary(summaryRows) {
  feedbackSummaryContainer.innerHTML = '';

  if (summaryRows.length === 0) {
    feedbackSummaryContainer.innerHTML = '<div class="empty-state">No feedback summary available.</div>';
    return;
  }

  summaryRows.forEach((summaryItem) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h3>${summaryItem.event_name}</h3>
      <div class="card-meta">
        <div><strong>Event Date:</strong> ${formatDate(summaryItem.event_date)}</div>
        <div><strong>Average Rating:</strong> ${summaryItem.average_rating}</div>
        <div><strong>Feedback Submissions:</strong> ${summaryItem.submission_count}</div>
      </div>
    `;

    feedbackSummaryContainer.appendChild(card);
  });
}

function renderComments(feedbackRows) {
  feedbackCommentsContainer.innerHTML = '';

  if (feedbackRows.length === 0) {
    feedbackCommentsContainer.innerHTML = '<div class="empty-state">No feedback comments found.</div>';
    return;
  }

  feedbackRows.forEach((item) => {
    const section = document.createElement('section');
    section.className = 'event-group';
    section.innerHTML = `
      <div class="event-group-header">
        <h3>${item.event_name}</h3>
        <div class="event-card-details">
          <div><strong>Student:</strong> ${item.student_name}</div>
          <div><strong>Rating:</strong> ${item.rating}/5</div>
          <div><strong>Submitted:</strong> ${formatDate(item.created_at)}</div>
        </div>
      </div>
      <div class="event-group-body">
        <div class="registration-card">
          <strong>Comment</strong>
          <div class="registration-details">
            <div>${item.comments || 'No comment provided.'}</div>
          </div>
        </div>
      </div>
    `;

    feedbackCommentsContainer.appendChild(section);
  });
}

function applyFeedbackFilters() {
  const selectedEventId = feedbackEventFilter.value;
  const minRating = Number(minRatingFilter.value || 0);

  const filteredComments = allFeedbackRows.filter((item) => {
    const eventMatches = selectedEventId ? String(item.event_id) === selectedEventId : true;
    const ratingMatches = minRating ? Number(item.rating || 0) >= minRating : true;
    return eventMatches && ratingMatches;
  });

  const filteredSummary = allSummaryRows.filter((item) => {
    return selectedEventId ? String(item.event_id) === selectedEventId : true;
  });

  renderSummary(filteredSummary);
  renderComments(filteredComments);
}

async function loadFeedback() {
  try {
    const response = await fetch(`${window.API_BASE}/feedback`);

    if (!response.ok) {
      throw new Error('Failed to load feedback records.');
    }

    const result = await response.json();
    allFeedbackRows = result.feedback || [];
    allSummaryRows = result.summary || [];

    fillEventFilter(allSummaryRows);
    applyFeedbackFilters();
    hideMessage();
  } catch (error) {
    showMessage(error.message || 'Could not load feedback.', 'error');
  }
}

feedbackEventFilter.addEventListener('change', applyFeedbackFilters);
minRatingFilter.addEventListener('change', applyFeedbackFilters);

clearFeedbackFilters.addEventListener('click', () => {
  feedbackEventFilter.value = '';
  minRatingFilter.value = '';
  applyFeedbackFilters();
});

loadFeedback();
