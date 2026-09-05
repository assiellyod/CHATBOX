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

  await window.ChatboxAPI.init();
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!window.ChatboxAPI || typeof window.ChatboxAPI.registerUser !== 'function') {
    showStatus('Registration API is not available. Please refresh the page.', 'danger');
    return;
  }

  const data = new FormData(form);

  submitButton.disabled = true;
  submitButton.textContent = 'Registering...';

  try {
    const user = await window.ChatboxAPI.registerUser({
      displayName: data.get('displayName'),
      email: data.get('email')
    });

    showStatus(`${user.displayName} was registered successfully.`, 'success');
    form.reset();

    window.setTimeout(() => {
      window.location.href = 'index.html';
    }, 700);
  } catch (error) {
    showStatus(error.message || 'Unable to register user.', 'danger');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Register user';
  }
});

bootRegistration();
