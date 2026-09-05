// CHATBOX JavaScript
// Bootstrap 5 handles all visual styling. No custom CSS file is required.

const api = window.ChatboxAPI;

const sidebar = document.querySelector('[data-sidebar]');
const themeButton = document.querySelector('[data-theme-toggle]');
const searchInput = document.querySelector('[data-search]');
const newChatButton = document.querySelector('[data-new-chat]');
const conversationList = document.querySelector('[data-conversation-list]');
const activeName = document.querySelector('[data-active-name]');
const activeAvatar = document.querySelector('[data-active-avatar]');
const messageForm = document.querySelector('[data-message-form]');
const messageInput = document.querySelector('[data-message-input]');
const sendButton = messageForm?.querySelector('button[type="submit"]');
const messagesArea = document.querySelector('[data-messages]');

let users = [];
let activeConversation = null;
let activeOtherUser = null;

function getSidebarInstance() {
  if (!sidebar || !window.bootstrap?.Offcanvas) return null;
  return bootstrap.Offcanvas.getOrCreateInstance(sidebar);
}

function openSidebar() {
  if (window.innerWidth < 992) getSidebarInstance()?.show();
}

function closeSidebar() {
  if (window.innerWidth < 992) getSidebarInstance()?.hide();
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-bs-theme', theme);
  localStorage.setItem('chatbox_theme', theme);

  if (themeButton) {
    const dark = theme === 'dark';
    themeButton.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
    themeButton.title = dark ? 'Use light theme' : 'Use dark theme';
  }
}

themeButton?.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-bs-theme') || 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

searchInput?.addEventListener('input', () => {
  renderUsers(searchInput.value);
});

function emptyContactsMarkup(hasUsers) {
  return `
    <div class="border rounded-4 bg-body-tertiary p-4 text-center">
      <div class="text-body-secondary mb-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>
        </svg>
      </div>
      <p class="small fw-semibold mb-1">${hasUsers ? 'No matches' : 'No other users yet'}</p>
      <p class="small text-body-secondary mb-0">${hasUsers ? 'Try another search.' : 'Add practice users to start a chat.'}</p>
    </div>
  `;
}

function renderUsers(search = '') {
  if (!conversationList) return;

  const term = search.trim().toLowerCase();
  const availableUsers = users.filter((user) => user.id !== 'usr_practice');
  const filtered = availableUsers.filter((user) =>
    user.displayName.toLowerCase().includes(term)
  );

  conversationList.innerHTML = '';

  if (!filtered.length) {
    conversationList.innerHTML = emptyContactsMarkup(availableUsers.length > 0);
    return;
  }

  filtered.forEach((user) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-light w-100 d-flex align-items-center gap-3 text-start rounded-4 p-3 mb-2';

    const avatar = document.createElement('span');
    avatar.className = 'badge rounded-circle text-bg-primary p-3 flex-shrink-0';
    avatar.textContent = user.displayName.charAt(0).toUpperCase();

    const info = document.createElement('span');
    info.className = 'flex-grow-1 overflow-hidden';

    const name = document.createElement('strong');
    name.className = 'd-block text-truncate small';
    name.textContent = user.displayName;

    const hint = document.createElement('small');
    hint.className = 'd-block text-truncate text-body-secondary mt-1';
    hint.textContent = 'Start a conversation';

    info.append(name, hint);
    button.append(avatar, info);
    button.addEventListener('click', () => openConversation(user));
    conversationList.appendChild(button);
  });
}

async function openConversation(user) {
  try {
    activeOtherUser = user;
    activeConversation = await api.getOrCreateDirectConversation(user.id);

    if (activeName) activeName.textContent = user.displayName;
    if (activeAvatar) {
      activeAvatar.textContent = user.displayName.charAt(0).toUpperCase();
      activeAvatar.className = 'badge rounded-circle text-bg-primary p-3';
    }

    if (messageInput) {
      messageInput.disabled = false;
      messageInput.placeholder = `Message ${user.displayName}`;
    }

    if (sendButton) sendButton.disabled = false;

    await renderMessages();
    closeSidebar();
  } catch (error) {
    showError(error.message);
  }
}

function showConversationEmpty() {
  if (!messagesArea || !activeOtherUser) return;

  messagesArea.className = 'd-flex align-items-center justify-content-center flex-grow-1 overflow-auto bg-body-tertiary p-3 p-md-4';
  messagesArea.innerHTML = `
    <div class="col-12 col-sm-10 col-md-8 col-lg-6 col-xl-5">
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-4 p-md-5 text-center">
          <div class="text-primary mb-3">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
              <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>
            </svg>
          </div>
          <h2 class="h5 fw-bold">Start your conversation</h2>
          <p class="text-body-secondary mb-0">Send a message to ${escapeText(activeOtherUser.displayName)}.</p>
        </div>
      </div>
    </div>
  `;
}

async function renderMessages() {
  if (!messagesArea || !activeConversation) return;

  const messageItems = await api.getMessages(activeConversation.id);
  messagesArea.innerHTML = '';

  if (!messageItems.length) {
    showConversationEmpty();
    return;
  }

  const currentUser = await api.getCurrentUser();
  messagesArea.className = 'flex-grow-1 overflow-auto bg-body-tertiary p-3 p-md-4';

  const stack = document.createElement('div');
  stack.className = 'container-fluid px-0 d-flex flex-column gap-2';

  messageItems.forEach((item) => {
    const mine = item.senderId === currentUser.id;
    const row = document.createElement('div');
    row.className = `d-flex align-items-end gap-2 ${mine ? 'justify-content-end' : 'justify-content-start'}`;

    if (!mine) {
      const avatar = document.createElement('span');
      avatar.className = 'badge rounded-circle text-bg-secondary p-2 flex-shrink-0';
      avatar.textContent = activeOtherUser.displayName.charAt(0).toUpperCase();
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = mine
      ? 'border border-primary rounded-4 bg-primary text-white px-3 py-2 shadow-sm'
      : 'border rounded-4 bg-body text-body px-3 py-2 shadow-sm';

    const text = document.createElement('p');
    text.className = 'mb-1 small';
    text.textContent = item.body;

    const time = document.createElement('time');
    time.className = mine ? 'd-block small text-white-50' : 'd-block small text-body-secondary';
    time.textContent = new Date(item.createdAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });

    bubble.append(text, time);
    row.appendChild(bubble);
    stack.appendChild(row);
  });

  messagesArea.appendChild(stack);
  messagesArea.scrollTop = messagesArea.scrollHeight;
}

messageForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!activeConversation || !messageInput) return;

  const text = messageInput.value.trim();
  if (!text) return;

  if (sendButton) sendButton.disabled = true;

  try {
    await api.sendMessage(activeConversation.id, text);
    messageInput.value = '';
    await renderMessages();
  } catch (error) {
    showError(error.message);
  } finally {
    if (sendButton) sendButton.disabled = false;
    messageInput.focus();
  }
});

messageInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    messageForm?.requestSubmit();
  }
});

newChatButton?.addEventListener('click', () => {
  searchInput?.focus();
  openSidebar();
  renderUsers();
});

function escapeText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function showError(message) {
  console.error('CHATBOX:', message);
  alert(message);
}

async function boot() {
  if (!api) {
    showError('CHATBOX API failed to load.');
    return;
  }

  applyTheme(localStorage.getItem('chatbox_theme') === 'dark' ? 'dark' : 'light');
  await api.init();
  users = await api.getUsers();
  renderUsers();
}

boot();
