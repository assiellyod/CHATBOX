// CHATBOX JavaScript
// This file connects the page to the practice API in api/client.js.

const api = window.ChatboxAPI;

const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const menuButton = document.querySelector('[data-menu-toggle]');
const themeButton = document.querySelector('[data-theme-toggle]');
const searchInput = document.querySelector('[data-search]');
const newChatButton = document.querySelector('[data-new-chat]');
const conversationList = document.querySelector('[data-conversation-list]');
const activeName = document.querySelector('[data-active-name]');
const activeAvatar = document.querySelector('[data-active-avatar]');
const messageForm = document.querySelector('.message-form');
const messageInput = document.querySelector('[data-message-input]');
const sendButton = messageForm?.querySelector('button');
const messagesArea = document.querySelector('.messages');

let users = [];
let activeConversation = null;
let activeOtherUser = null;

// Open and close the mobile conversation menu.
function setSidebar(open) {
  sidebar?.classList.toggle('open', open);
  overlay?.classList.toggle('show', open);
}

menuButton?.addEventListener('click', () => {
  setSidebar(!sidebar.classList.contains('open'));
});

overlay?.addEventListener('click', () => setSidebar(false));

// Switch between the normal and dark theme.
themeButton?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  themeButton.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  themeButton.title = dark ? 'Light theme' : 'Dark theme';
});

// Show users that match the search box.
searchInput?.addEventListener('input', () => {
  renderUsers(searchInput.value);
});

// Render the available users as conversation buttons.
function renderUsers(search = '') {
  if (!conversationList) return;

  const term = search.trim().toLowerCase();
  const filtered = users.filter((user) =>
    user.id !== 'usr_practice' && user.displayName.toLowerCase().includes(term)
  );

  conversationList.innerHTML = '';

  if (!filtered.length) {
    conversationList.innerHTML = `
      <div class="empty-state" style="padding:24px 16px;min-height:auto;">
        <strong>${users.length <= 1 ? 'No other users yet' : 'No matches'}</strong>
        <small style="display:block;margin-top:6px;">
          ${users.length <= 1 ? 'Add practice users to start a chat.' : 'Try another search.'}
        </small>
      </div>
    `;
    return;
  }

  filtered.forEach((user) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'conversation';
    button.innerHTML = `
      <div class="avatar-wrap">
        <div class="avatar">${user.displayName.charAt(0).toUpperCase()}</div>
      </div>
      <span class="conversation-info">
        <span class="conversation-line">
          <strong></strong>
        </span>
        <small>Start a conversation</small>
      </span>
    `;

    // Use textContent for the name instead of inserting it as HTML.
    button.querySelector('strong').textContent = user.displayName;

    button.addEventListener('click', () => openConversation(user));
    conversationList.appendChild(button);
  });
}

// Create or open a private conversation with the selected user.
async function openConversation(user) {
  try {
    activeOtherUser = user;
    activeConversation = await api.getOrCreateDirectConversation(user.id);

    activeName.textContent = user.displayName;
    activeAvatar.textContent = user.displayName.charAt(0).toUpperCase();

    messageInput.disabled = false;
    messageInput.placeholder = `Message ${user.displayName}`;
    sendButton.disabled = false;

    await renderMessages();
    setSidebar(false);
  } catch (error) {
    showError(error.message);
  }
}

// Load messages for the selected conversation.
async function renderMessages() {
  if (!messagesArea || !activeConversation) return;

  const messageItems = await api.getMessages(activeConversation.id);
  messagesArea.innerHTML = '';

  if (!messageItems.length) {
    messagesArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">💬</div>
        <h2>Start your conversation</h2>
        <p>Send a message to ${activeOtherUser.displayName}.</p>
      </div>
    `;
    return;
  }

  const currentUser = await api.getCurrentUser();

  messageItems.forEach((item) => {
    const mine = item.senderId === currentUser.id;
    const row = document.createElement('div');
    row.className = `message-row${mine ? ' me' : ''}`;

    const bubble = document.createElement('div');
    bubble.className = 'message';

    const bubbleBox = document.createElement('div');
    bubbleBox.className = 'message-bubble';

    const text = document.createElement('p');
    text.textContent = item.body;

    const time = document.createElement('time');
    time.textContent = new Date(item.createdAt).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });

    bubbleBox.append(text, time);
    bubble.appendChild(bubbleBox);

    if (!mine) {
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = activeOtherUser.displayName.charAt(0).toUpperCase();
      row.append(avatar);
    }

    row.appendChild(bubble);
    messagesArea.appendChild(row);
  });

  messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Send a new message through the practice API.
messageForm?.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!activeConversation) return;

  const text = messageInput.value.trim();
  if (!text) return;

  sendButton.disabled = true;

  try {
    await api.sendMessage(activeConversation.id, text);
    messageInput.value = '';
    await renderMessages();
  } catch (error) {
    showError(error.message);
  } finally {
    sendButton.disabled = false;
    messageInput.focus();
  }
});

// Press Enter to send. Shift + Enter can still create a new line later.
messageInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    messageForm.requestSubmit();
  }
});

// New conversation refreshes the available-user list.
newChatButton?.addEventListener('click', () => {
  searchInput?.focus();
  setSidebar(true);
  renderUsers();
});

function showError(message) {
  console.error('CHATBOX:', message);
  alert(message);
}

// Start the frontend API and load the available users.
async function boot() {
  if (!api) {
    showError('CHATBOX API failed to load.');
    return;
  }

  await api.init();
  users = await api.getUsers();
  renderUsers();
}

boot();
