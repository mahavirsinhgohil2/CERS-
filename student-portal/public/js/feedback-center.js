// Feedback center page script
const feedbackMessage = document.getElementById('feedbackMessage');
const feedbackCenterContainer = document.getElementById('feedbackCenterContainer');

function showFeedbackMessage(text, type = 'info') {
  feedbackMessage.textContent = text;
  feedbackMessage.className = `message ${type}`;
  feedbackMessage.style.display = 'block';
}

function renderFeedbackCenter(registrations) {
  feedbackCenterContainer.innerHTML = '';
  const pendingFeedback = registrations.filter((item) => item.registration_status === 'confirmed' && isStudentPastDate(item.event_date) && Number(item.feedback_count || 0) === 0);

  if (pendingFeedback.length === 0) {
    feedbackCenterContainer.innerHTML = '<div class="empty-state">No feedback is pending right now.</div>';
    return;
  }

  pendingFeedback.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <p class="eyebrow">Feedback ready</p>
      <h3>${escapeStudentHtml(item.event_name)}</h3>
      <div class="card-meta">
        <div><strong>Date:</strong> ${formatStudentDate(item.event_date)}</div>
        <div><strong>Location:</strong> ${escapeStudentHtml(item.event_location || '--')}</div>
      </div>
      <form class="feedback-form">
        <div class="field">
          <label>Rating</label>
          <select name="rating" required>
            <option value="">Select rating</option>
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Fair</option>
            <option value="1">1 - Poor</option>
          </select>
        </div>
        <div class="field">
          <label>Comments</label>
          <textarea name="comments" rows="3" placeholder="Write a short comment"></textarea>
        </div>
        <button class="btn btn-primary" type="submit">Submit Feedback</button>
      </form>
    `;

    card.querySelector('form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      try {
        const response = await fetch(`${STUDENT_API_BASE}/feedback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            registration_id: item.id,
            event_id: item.event_id,
            student_name: item.student_name,
            rating: form.rating.value,
            comments: form.comments.value.trim(),
          }),
        });

        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Unable to submit feedback.');
        }

        showFeedbackMessage(result.message || 'Feedback submitted successfully.', 'success');
        loadFeedbackCenter();
      } catch (error) {
        showFeedbackMessage(error.message || 'Unable to submit feedback.', 'error');
      }
    });

    feedbackCenterContainer.appendChild(card);
  });
}

async function loadFeedbackCenter() {
  const savedProfile = getActiveStudentProfile();

  try {
    const { registrations } = await fetchStudentPortalData();
    renderFeedbackCenter(registrations);
  } catch (error) {
    showFeedbackMessage(error.message || 'Unable to load feedback center.', 'error');
  }
}

loadFeedbackCenter();
