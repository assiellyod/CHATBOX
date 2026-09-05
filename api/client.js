(function () {
  'use strict';

  const DB_KEY = 'chatbox_mock_db_v1';
  const SESSION_KEY = 'chatbox_session_v1';
  const SEED_URL = 'database/seed.json';
  const REMOVED_DEMO_IDS = new Set(['usr_alex', 'usr_jamie']);

  const PRACTICE_USER = {
    id: 'usr_practice',
    displayName: 'Main Account',
    email: 'owner@chatbox.demo',
    role: 'owner',
    demo: true,
    createdAt: '2026-09-05T00:00:00.000Z'
  };

  const fallbackSeed = {
    users: [PRACTICE_USER],
    conversations: [],
    messages: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeName(value) {
    return String(value || '').trim().replace(/\s+/g, ' ');
  }

  async function loadSeed() {
    try {
      const response = await fetch(`${SEED_URL}?v=20260905-5`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Seed unavailable');
      const data = await response.json();
      return {
        users: Array.isArray(data.users) ? data.users : [],
        conversations: Array.isArray(data.conversations) ? data.conversations : [],
        messages: Array.isArray(data.messages) ? data.messages : []
      };
    } catch (_) {
      return clone(fallbackSeed);
    }
  }

  function readDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function writeDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  function removeLegacyDemoData(db) {
    db.users = db.users.filter((user) => !REMOVED_DEMO_IDS.has(user.id));

    const removedConversationIds = new Set(
      db.conversations
        .filter((item) => (item.memberIds || []).some((id) => REMOVED_DEMO_IDS.has(id)))
        .map((item) => item.id)
    );

    db.conversations = db.conversations.filter((item) => !removedConversationIds.has(item.id));
    db.messages = db.messages.filter((message) => !removedConversationIds.has(message.conversationId));
  }

  function mergeUsers(db, incomingUsers) {
    (incomingUsers || []).forEach((incoming) => {
      if (!incoming?.id || REMOVED_DEMO_IDS.has(incoming.id)) return;

      const index = db.users.findIndex((user) => user.id === incoming.id);
      if (index === -1) {
        db.users.push(clone(incoming));
      } else {
        db.users[index] = {
          ...db.users[index],
          ...clone(incoming),
          email: incoming.email || db.users[index].email || ''
        };
      }
    });
  }

  async function init() {
    const seed = await loadSeed();
    let db = readDb();

    if (!db) db = clone(seed);

    db.users = Array.isArray(db.users) ? db.users : [];
    db.conversations = Array.isArray(db.conversations) ? db.conversations : [];
    db.messages = Array.isArray(db.messages) ? db.messages : [];

    removeLegacyDemoData(db);
    mergeUsers(db, seed.users);

    const ownerIndex = db.users.findIndex((user) => user.id === PRACTICE_USER.id);
    if (ownerIndex === -1) {
      db.users.unshift(clone(PRACTICE_USER));
    } else {
      db.users[ownerIndex] = { ...db.users[ownerIndex], ...clone(PRACTICE_USER) };
    }

    writeDb(db);

    const savedSession = localStorage.getItem(SESSION_KEY);
    const sessionIsValid = savedSession && db.users.some((user) => user.id === savedSession);
    if (!sessionIsValid) {
      localStorage.setItem(SESSION_KEY, PRACTICE_USER.id);
    }

    return clone(db);
  }

  function currentUserId() {
    return localStorage.getItem(SESSION_KEY) || PRACTICE_USER.id;
  }

  async function getCurrentUser() {
    const db = await init();
    const id = currentUserId();
    return db.users.find((user) => user.id === id) || clone(PRACTICE_USER);
  }

  async function getUsers() {
    const db = await init();
    return db.users.map(clone);
  }

  async function syncUsers(sharedUsers) {
    const db = await init();
    mergeUsers(db, Array.isArray(sharedUsers) ? sharedUsers : []);
    writeDb(db);
    return db.users.map(clone);
  }

  async function registerUser({ displayName, email }) {
    const db = await init();
    const name = normalizeName(displayName);
    const normalizedEmail = normalizeEmail(email);

    if (name.length < 2) throw new Error('Full name must be at least 2 characters.');
    if (name.length > 80) throw new Error('Full name is too long.');
    if (!normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      throw new Error('Enter a valid email address.');
    }

    const duplicate = db.users.find((user) => normalizeEmail(user.email) === normalizedEmail);
    if (duplicate) {
      localStorage.setItem(SESSION_KEY, duplicate.id);
      return clone(duplicate);
    }

    const user = {
      id: makeId('usr'),
      displayName: name,
      email: normalizedEmail,
      role: 'user',
      demo: false,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDb(db);
    localStorage.setItem(SESSION_KEY, user.id);
    return clone(user);
  }

  async function usePracticeUser() {
    await init();
    localStorage.setItem(SESSION_KEY, PRACTICE_USER.id);
    return clone(PRACTICE_USER);
  }

  async function getOrCreateDirectConversation(otherUserId) {
    const db = await init();
    const me = currentUserId();

    if (!otherUserId) throw new Error('Select a user first.');
    if (me === otherUserId) throw new Error('You cannot start a private chat with yourself.');

    const otherUser = db.users.find((user) => user.id === otherUserId);
    if (!otherUser) throw new Error('User not found. Refresh the shared user list.');

    let conversation = db.conversations.find((item) => {
      const members = item.memberIds || [];
      return members.length === 2 && members.includes(me) && members.includes(otherUserId);
    });

    if (!conversation) {
      conversation = {
        id: makeId('convo'),
        memberIds: [me, otherUserId],
        createdAt: new Date().toISOString()
      };
      db.conversations.push(conversation);
      writeDb(db);
    }

    return clone(conversation);
  }

  async function getConversations() {
    const db = await init();
    const me = currentUserId();
    return db.conversations
      .filter((item) => (item.memberIds || []).includes(me))
      .map(clone);
  }

  async function getMessages(conversationId) {
    const db = await init();
    const me = currentUserId();
    const conversation = db.conversations.find((item) => item.id === conversationId);

    if (!conversation || !(conversation.memberIds || []).includes(me)) {
      throw new Error('Conversation not found.');
    }

    return db.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(clone);
  }

  async function sendMessage(conversationId, body) {
    const db = await init();
    const me = currentUserId();
    const text = String(body || '').trim();

    if (!text) throw new Error('Message cannot be empty.');

    const conversation = db.conversations.find((item) => item.id === conversationId);
    if (!conversation || !(conversation.memberIds || []).includes(me)) {
      throw new Error('Conversation not found.');
    }

    const message = {
      id: makeId('msg'),
      conversationId,
      senderId: me,
      body: text,
      createdAt: new Date().toISOString(),
      editedAt: null
    };

    db.messages.push(message);
    writeDb(db);
    return clone(message);
  }

  async function deleteMessage(messageId) {
    const db = await init();
    const me = currentUserId();
    const index = db.messages.findIndex((message) =>
      message.id === messageId && message.senderId === me
    );

    if (index < 0) throw new Error('Message not found or not yours.');

    db.messages.splice(index, 1);
    writeDb(db);
    return true;
  }

  window.ChatboxAPI = {
    init,
    registerUser,
    syncUsers,
    usePracticeUser,
    getCurrentUser,
    getUsers,
    getConversations,
    getOrCreateDirectConversation,
    getMessages,
    sendMessage,
    deleteMessage
  };
})();
