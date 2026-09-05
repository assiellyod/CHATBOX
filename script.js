const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const menuButton = document.querySelector('[data-menu-toggle]');
const themeButton = document.querySelector('[data-theme-toggle]');
const searchInput = document.querySelector('[data-search]');
const newChatButton = document.querySelector('[data-new-chat]');
const conversations = [...document.querySelectorAll('.conversation')];
const messageForm = document.querySelector('.message-form');
const messageInput = document.querySelector('[data-message-input]');
const messages = document.querySelector('.messages');
const activeName = document.querySelector('[data-active-name]');
const activeAvatar = document.querySelector('[data-active-avatar]');
const accountLabel = document.querySelector('[data-account-label]');
const accountActionText = document.querySelector('[data-account-action-text]');

const api = window.ChatboxAPI;
let currentUser = null;
let activeConversationId = null;
let activeOtherUserId = document.querySelector('.conversation.active')?.dataset.userId || 'usr_alex';

function setSidebar(open) {
  sidebar?.classList.toggle('open', open);
  overlay?.classList.toggle('show', open);
}

menuButton?.addEventListener('click', () => {
  setSidebar(!sidebar.classList.contains('open'));
});

overlay?.addEventListener('click', () => setSidebar(false));

themeButton?.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const dark = document.body.classList.contains('dark');
  themeButton.setAttribute('aria-label', dark ? 'Use light theme' : 'Use dark theme');
  themeButton.title = dark ? 'Light theme' : 'Dark theme';
});

searchInput?.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase();
  conversations.forEach((conversation) => {
    const name = conversation.dataset.name?.toLowerCase() || '';
    conversation.hidden = !name.includes(query);
  });
});

newChatButton?.addEventListener('click', () => {
  searchInput?.focus();
  searchInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
});

function formatTime(value) {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function showEmptyState(message = 'Send a message to start the conversation.') {
  messages.innerHTML = '';

  const state = document.createElement('div');
  state.className = 'empty-state';

  const icon = document.createElement('div');
  icon.className = 'empty-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/></svg>';

  const title = document.createElement('h2');
  title.textContent = 'Your private chat';

  const paragraph = document.createElement('p');
  paragraph.textContent = message;

  state.append(icon, title, paragraph);
  messages.appendChild(state);
}

function appendMessage(messageData) {
  const row = document.createElement('div');
  row.className = `message-row ${messageData.senderId === currentUser?.id ? 'me' : 'them'}`;
  row.dataset.messageId = messageData.id;

  const message = document.createElement('div');
  message.className = 'message';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const paragraph = document.createElement('p');
  paragraph.textContent = messageData.body;

  const time = document.createElement('time');
  time.dateTime = messageData.createdAt;
  time.textContent = formatTime(messageData.createdAt);

  bubble.appendChild(paragraph);
  message.append(bubble, time);
  row.appendChild(message);
  messages.appendChild(row);
}

async function renderConversation() {
  if (!currentUser) {
    activeConversationId = null;
    showEmptyState('Create an account first. Your practice data will be saved in this browser.');
    return;
  }

  try {
    const conversation = await api.getOrCreateDirectConversation(activeOtherUserId);
    activeConversationId = conversation.id;
    const savedMessages = await api.getMessages(conversation.id);

    messages.innerHTML = '';
    if (!savedMessages.length) {
      showEmptyState();
      return;
    }

    savedMessages.forEach(appendMessage);
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    showEmptyState(error.message || 'Unable to load this conversation.');
  }
}

conversations.forEach((conversation) => {
  conversation.addEventListener('click', async () => {
    conversations.forEach((item) => item.classList.remove('active'));
    conversation.classList.add('active');

    const name = conversation.dataset.name || 'Conversation';
    const initial = name.charAt(0).toUpperCase();
    activeOtherUserId = conversation.dataset.userId;

    if (activeName) activeName.textContent = name;
    if (activeAvatar) activeAvatar.textContent = initial;

    setSidebar(false);
    await renderConversation();
  });
});

messageForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  if (!currentUser) {
    alert('Create an account first so CHATBOX can save your practice messages.');
    window.location.href = 'register.html';
    return;
  }

  try {
    if (!activeConversationId) {
      const conversation = await api.getOrCreateDirectConversation(activeOtherUserId);
      activeConversationId = conversation.id;
    }

    const savedMessage = await api.sendMessage(activeConversationId, text);
    if (messages.querySelector('.empty-state')) messages.innerHTML = '';
    appendMessage(savedMessage);

    messageInput.value = '';
    messageInput.style.height = 'auto';
    messageInput.focus();
    messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
  } catch (error) {
    alert(error.message || 'Unable to save the message.');
  }
});

messageInput?.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 120)}px`;
});

messageInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    messageForm?.requestSubmit();
  }
});

async function boot() {
  if (!api) {
    showEmptyState('Practice API failed to load.');
    return;
  }

  await api.init();
  currentUser = await api.getCurrentUser();

  if (currentUser) {
    if (accountLabel) accountLabel.textContent = `Signed in as ${currentUser.displayName}`;
    if (accountActionText) accountActionText.textContent = 'Add another account';
  } else {
    if (accountLabel) accountLabel.textContent = 'Private messaging';
    if (accountActionText) accountActionText.textContent = 'Add account';
  }

  await renderConversation();
}

boot();
