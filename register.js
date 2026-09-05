const form = document.querySelector('[data-register-form]');
const statusBox = document.querySelector('[data-status]');
const submitButton = document.querySelector('[data-submit]');

function showStatus(message, type) {
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.className = `alert alert-${type}`;
}

async function bootRegistration() {
  if (!window.ChatboxAPI || typeof window.ChatboxAPI.registerUser !== 'function') {
    showStatus('Registration API failed to load. Refresh the page and try again.', 'danger');
    return;
  }

  if (!window.ChatboxGitHubData || typeof window.ChatboxGitHubData.createRegistrationIssueUrl !== 'function') {
    showStatus('GitHub registration helper failed to load. Refresh the page and try again.', 'danger');
    return;
  }

  await window.ChatboxAPI.init();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!window.ChatboxAPI || !window.ChatboxGitHubData) {
    showStatus('Registration services are not available. Please refresh the page.', 'danger');
    return;
  }

  const data = new FormData(form);
  submitButton.disabled = true;
  submitButton.textContent = 'Preparing GitHub request...';

  try {
    const user = await window.ChatboxAPI.registerUser({
      displayName: data.get('displayName'),
      email: data.get('email')
    });

    const issueUrl = window.ChatboxGitHubData.createRegistrationIssueUrl(user);
    localStorage.setItem('chatbox_pending_registration', JSON.stringify({
      id: user.id,
      displayName: user.displayName,
      createdAt: new Date().toISOString()
    }));

    showStatus('Local profile created. GitHub will open next. Press “Submit new issue” there to publish this user to the shared list.', 'success');

    window.setTimeout(() => {
      window.location.href = issueUrl;
    }, 900);
  } catch (error) {
    showStatus(error.message || 'Unable to register user.', 'danger');
    submitButton.disabled = false;
    submitButton.textContent = 'Register and continue';
  }
});

bootRegistration();
