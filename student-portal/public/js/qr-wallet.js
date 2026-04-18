// QR Wallet page script
const qrWalletMessage = document.getElementById('qrWalletMessage');
const qrWalletContainer = document.getElementById('qrWalletContainer');

function showQrWalletMessage(text, type = 'info') {
  qrWalletMessage.textContent = text;
  qrWalletMessage.className = `message ${type}`;
  qrWalletMessage.style.display = 'block';
}

function renderQrWallet(registrations) {
  qrWalletContainer.innerHTML = '';
  const confirmedItems = registrations.filter((item) => item.registration_status === 'confirmed');

  if (confirmedItems.length === 0) {
    qrWalletContainer.innerHTML = '<div class="empty-state">No confirmed registrations available for QR passes.</div>';
    return;
  }

  confirmedItems.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'card';

    const qrId = `qr-${item.id}`;
    card.innerHTML = `
      <h3>${escapeStudentHtml(item.event_name)}</h3>
      <div class="card-meta">
        <div><strong>Date:</strong> ${formatStudentDate(item.event_date)}</div>
        <div><strong>Location:</strong> ${escapeStudentHtml(item.event_location || '--')}</div>
        <div><strong>Status:</strong> ${escapeStudentHtml(item.registration_status)}</div>
      </div>
      <div id="${qrId}" class="qr-code"></div>
      <div class="actions">
        <button class="btn btn-primary" type="button" data-qr-view="${item.id}">View Large QR</button>
      </div>
    `;

    qrWalletContainer.appendChild(card);

    if (window.QRCode) {
      new QRCode(card.querySelector(`#${qrId}`), {
        text: JSON.stringify({
          registrationId: item.id,
          eventId: item.event_id,
          studentName: item.student_name,
          eventName: item.event_name,
          eventDate: item.event_date,
        }),
        width: 140,
        height: 140,
        colorDark: '#1F1F1F',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M,
      });
    }

    card.querySelector('[data-qr-view]').addEventListener('click', () => {
      const qrText = JSON.stringify({
        registrationId: item.id,
        eventId: item.event_id,
        studentName: item.student_name,
        eventName: item.event_name,
        eventDate: item.event_date,
      });
      const popup = window.open('', '_blank', 'width=380,height=460');
      popup.document.write(`
        <html>
          <head><title>QR Pass</title><style>body{font-family:Segoe UI,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#fff;color:#1f1f1f;padding:20px}.box{border:1px solid #d9d9d9;border-radius:12px;padding:20px;max-width:320px;text-align:center}</style></head>
          <body><div class="box"><h3>${escapeStudentHtml(item.event_name)}</h3><div id="qrcode"></div><p>${escapeStudentHtml(item.student_name)}</p><p>${formatStudentDate(item.event_date)}</p></div><script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script><script>new QRCode(document.getElementById('qrcode'), { text: ${JSON.stringify(qrText)}, width: 220, height: 220, colorDark: '#1f1f1f', colorLight: '#ffffff' });</script></body>
        </html>
      `);
      popup.document.close();
    });
  });
}

async function loadQrWallet() {
  const savedProfile = getActiveStudentProfile();

  try {
    const { registrations } = await fetchStudentPortalData();
    renderQrWallet(registrations);
  } catch (error) {
    showQrWalletMessage(error.message || 'Unable to load QR wallet.', 'error');
  }
}

loadQrWallet();
