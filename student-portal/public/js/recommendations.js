// Recommendations page script
const recommendationsMessage = document.getElementById('recommendationsMessage');
const recommendationsContainer = document.getElementById('recommendationsContainer');

function showRecommendationsMessage(text, type = 'info') {
  recommendationsMessage.textContent = text;
  recommendationsMessage.className = `message ${type}`;
  recommendationsMessage.style.display = 'block';
}

function renderRecommendations(registrations, events, profile) {
  recommendationsContainer.innerHTML = '';
  const registeredIds = new Set(registrations.map((item) => String(item.event_id)));
  const recentThemes = registrations.slice(0, 3).map((item) => buildEventTheme(item));
  const upcomingEvents = events.filter((event) => !registeredIds.has(String(event.id)) && !isStudentPastDate(event.date));

  const scored = upcomingEvents.map((event) => {
    const theme = buildEventTheme(event);
    const department = String(profile?.department || '').toLowerCase();
    const isTrending = Number(event.confirmed_count || 0) >= 5;
    let score = 0;

    if ((department.includes('it') || department.includes('cse') || department.includes('cyber')) && theme === 'tech') {
      score += 4;
    }

    if ((department.includes('mechanical') || department.includes('electrical')) && (theme === 'tech' || theme === 'sports')) {
      score += 3;
    }

    if (recentThemes.includes(theme)) {
      score += 2;
    }

    if (isTrending) {
      score += 1;
    }

    return {
      ...event,
      score,
      reason: buildRecommendationReason(event, profile, recentThemes, isTrending),
      label: buildThemeLabel(theme),
    };
  }).sort((a, b) => b.score - a.score).slice(0, 6);

  if (scored.length === 0) {
    recommendationsContainer.innerHTML = '<div class="empty-state">No recommendations available right now.</div>';
    return;
  }

  scored.forEach((event) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <p class="eyebrow">${escapeStudentHtml(event.label)}</p>
      <h3>${escapeStudentHtml(event.name)}</h3>
      <div class="card-meta">
        <div><strong>Date:</strong> ${formatStudentDate(event.date)}</div>
        <div><strong>Location:</strong> ${escapeStudentHtml(event.location)}</div>
        <div><strong>Seats:</strong> ${escapeStudentHtml(event.available_seats)} available</div>
      </div>
      <p>${escapeStudentHtml(event.reason)}</p>
      <div class="actions">
        <a class="btn btn-primary" href="register.html?eventId=${event.id}">Register Now</a>
      </div>
    `;
    recommendationsContainer.appendChild(card);
  });
}

async function loadRecommendations() {
  const savedProfile = getActiveStudentProfile();

  try {
    const { profile, events, registrations } = await fetchStudentPortalData();
    renderRecommendations(registrations, events, profile);
  } catch (error) {
    showRecommendationsMessage(error.message || 'Unable to load recommendations.', 'error');
  }
}

loadRecommendations();
