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

conversations.forEach((conversation) => {
  conversation.addEventListener('click', () => {
    conversations.forEach((item) => item.classList.remove('active'));
    conversation.classList.add('active');

    const name = conversation.dataset.name || 'Conversation';
    const initial = name.charAt(0).toUpperCase();

    if (activeName) activeName.textContent = name;
    if (activeAvatar) activeAvatar.textContent = initial;

    setSidebar(false);
  });
});

function getCurrentTime() {
  return new Intl.DateTimeFormat([], {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date());
}

function appendOutgoingMessage(text) {
  const row = document.createElement('div');
  row.className = 'message-row me';

  const message = document.createElement('div');
  message.className = 'message';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  const paragraph = document.createElement('p');
  paragraph.textContent = text;

  const time = document.createElement('time');
  time.textContent = getCurrentTime();

  bubble.appendChild(paragraph);
  message.appendChild(bubble);
  message.appendChild(time);
  row.appendChild(message);
  messages.appendChild(row);

  messages.scrollTo({ top: messages.scrollHeight, behavior: 'smooth' });
}

messageForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  appendOutgoingMessage(text);
  messageInput.value = '';
  messageInput.style.height = 'auto';
  messageInput.focus();
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
