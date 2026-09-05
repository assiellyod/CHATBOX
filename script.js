const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const menuButton = document.querySelector('[data-menu-toggle]');
const themeButton = document.querySelector('[data-theme-toggle]');
const searchInput = document.querySelector('[data-search]');
const newChatButton = document.querySelector('[data-new-chat]');
const messageForm = document.querySelector('.message-form');
const messageInput = document.querySelector('[data-message-input]');
const messages = document.querySelector('.messages');

const api = window.ChatboxAPI;

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

searchInput?.addEventListener('input', () => {
  // No demo contacts are preloaded. Search will become active when real users are added.
});

newChatButton?.addEventListener('click', () => {
  alert('No users available yet. Alex and Jamie were removed.');
});

messageForm?.addEventListener('submit', (event) => {
  event.preventDefault();
});

async function boot() {
  if (!api) {
    if (messages) {
      messages.innerHTML = '<div class="empty-state"><h2>CHATBOX</h2><p>Practice API failed to load.</p></div>';
    }
    return;
  }

  await api.init();
}

boot();
