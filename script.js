// CHATBOX JavaScript
// Tailwind CSS handles all visual styling. No custom CSS file is required.

const api = window.ChatboxAPI;

const sidebar = document.querySelector('[data-sidebar]');
const overlay = document.querySelector('[data-sidebar-overlay]');
const menuButton = document.querySelector('[data-menu-toggle]');
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

function setSidebar(open) {
  if (!sidebar || !overlay) return;
  sidebar.classList.toggle('-translate-x-full', !open);
  sidebar.classList.toggle('translate-x-0', open);
  overlay.classList.toggle('hidden', !open);
}

menuButton?.addEventListener('click', () => setSidebar(true));
overlay?.addEventListener('click', () => setSidebar(false));

themeButton?.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
});

searchInput?.addEventListener('input', () => {
  renderUsers(searchInput.value);
});

function emptyContactsMarkup(hasUsers) {
  return `
    <div class="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-800/60">
      <div class="mx-auto grid h-11 w-11 place-items-center rounded-full bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300">
        <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>
        </svg>
      </div>
      <p class="mt-3 text-sm font-semibold">${hasUsers ? 'No matches' : 'No other users yet'}</p>
      <p class="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">${hasUsers ? 'Try another search.' : 'Add practice users to start a chat.'}</p>
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
    button.className = 'mb-2 flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-100 dark:hover:bg-slate-800 dark:focus:ring-indigo-950';

    const avatar = document.createElement('span');
    avatar.className = 'grid h-11 w-11 shrink-0 place-items-center rounded-full bg-indigo-100 font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300';
    avatar.textContent = user.displayName.charAt(0).toUpperCase();

    const info = document.createElement('span');
    info.className = 'min-w-0 flex-1';

    const name = document.createElement('strong');
    name.className = 'block truncate text-sm font-semibold';
    name.textContent = user.displayName;

    const hint = document.createElement('small');
    hint.className = 'mt-1 block truncate text-xs text-slate-500 dark:text-slate-400';
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
    if (activeAvatar) activeAvatar.textContent = user.displayName.charAt(0).toUpperCase();

    if (messageInput) {
      messageInput.disabled = false;
      messageInput.placeholder = `Message ${user.displayName}`;
      messageInput.classList.remove('bg-slate-100', 'text-slate-500', 'dark:bg-slate-800', 'dark:text-slate-400');
      messageInput.classList.add('bg-white', 'text-slate-900', 'focus:border-indigo-500', 'focus:ring-4', 'focus:ring-indigo-100', 'dark:bg-slate-900', 'dark:text-white', 'dark:focus:ring-indigo-950');
    }

    if (sendButton) {
      sendButton.disabled = false;
      sendButton.classList.remove('opacity-50');
      sendButton.classList.add('hover:bg-indigo-700');
    }

    await renderMessages();
    setSidebar(false);
  } catch (error) {
    showError(error.message);
  }
}

function showConversationEmpty() {
  if (!messagesArea || !activeOtherUser) return;

  messagesArea.className = 'flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-slate-50 p-5 sm:p-8 dark:bg-slate-950';
  messagesArea.innerHTML = `
    <div class="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div class="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300">
        <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z"/>
        </svg>
      </div>
      <h2 class="mt-4 text-lg font-bold">Start your conversation</h2>
      <p class="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">Send a message to ${escapeText(activeOtherUser.displayName)}.</p>
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
  messagesArea.className = 'min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 dark:bg-slate-950';

  const stack = document.createElement('div');
  stack.className = 'mx-auto flex w-full max-w-4xl flex-col gap-3';

  messageItems.forEach((item) => {
    const mine = item.senderId === currentUser.id;
    const row = document.createElement('div');
    row.className = `flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`;

    if (!mine) {
      const avatar = document.createElement('div');
      avatar.className = 'grid h-8 w-8 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300';
      avatar.textContent = activeOtherUser.displayName.charAt(0).toUpperCase();
      row.appendChild(avatar);
    }

    const bubble = document.createElement('div');
    bubble.className = `max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm ${mine ? 'rounded-br-md bg-indigo-600 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white'}`;

    const text = document.createElement('p');
    text.className = 'whitespace-pre-wrap break-words text-sm leading-6';
    text.textContent = item.body;

    const time = document.createElement('time');
    time.className = `mt-1 block text-[11px] ${mine ? 'text-indigo-100' : 'text-slate-400'}`;
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
  setSidebar(true);
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

  await api.init();
  users = await api.getUsers();
  renderUsers();
}

boot();
