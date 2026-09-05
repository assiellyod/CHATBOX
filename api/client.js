(function () {
  'use strict';

  const DB_KEY = 'chatbox_mock_db_v1';
  const SESSION_KEY = 'chatbox_session_v1';
  const SEED_URL = 'database/seed.json';

  const fallbackSeed = {
    users: [
      { id: 'usr_alex', displayName: 'Alex', email: 'alex@chatbox.demo', passwordHash: null, demo: true, createdAt: '2026-09-05T00:00:00.000Z' },
      { id: 'usr_jamie', displayName: 'Jamie', email: 'jamie@chatbox.demo', passwordHash: null, demo: true, createdAt: '2026-09-05T00:00:00.000Z' }
    ],
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

  async function hashPassword(password) {
    if (!window.crypto?.subtle) {
      return btoa(unescape(encodeURIComponent(password)));
    }
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  async function loadSeed() {
    try {
      const response = await fetch(SEED_URL, { cache: 'no-store' });
      if (!response.ok) throw new Error('Seed unavailable');
      return await response.json();
    } catch (_) {
      return clone(fallbackSeed);
    }
  }

  function readDb() {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function writeDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    return db;
  }

  async function init() {
    let db = readDb();
    if (!db) {
      db = await loadSeed();
      writeDb(db);
    }
    return db;
  }

  function currentUserId() {
    return localStorage.getItem(SESSION_KEY);
  }

  async function getCurrentUser() {
    const db = await init();
    const id = currentUserId();
    return db.users.find((user) => user.id === id) || null;
  }

  async function register({ fullName, email, password }) {
    const db = await init();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const name = String(fullName || '').trim();

    if (!name) throw new Error('Full name is required.');
    if (!normalizedEmail) throw new Error('Email is required.');
    if (String(password || '').length < 8) throw new Error('Password must be at least 8 characters.');
    if (db.users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
      throw new Error('That email already has an account on this browser.');
    }

    const user = {
      id: makeId('usr'),
      displayName: name,
      email: normalizedEmail,
      passwordHash: await hashPassword(password),
      demo: false,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    writeDb(db);
    localStorage.setItem(SESSION_KEY, user.id);
    return { id: user.id, displayName: user.displayName, email: user.email };
  }

  async function login({ email, password }) {
    const db = await init();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const passwordHash = await hashPassword(password || '');
    const user = db.users.find((item) => !item.demo && item.email.toLowerCase() === normalizedEmail);

    if (!user || user.passwordHash !== passwordHash) throw new Error('Invalid email or password.');
    localStorage.setItem(SESSION_KEY, user.id);
    return { id: user.id, displayName: user.displayName, email: user.email };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function getUsers() {
    const db = await init();
    return db.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  async function getOrCreateDirectConversation(otherUserId) {
    const db = await init();
    const me = currentUserId();
    if (!me) throw new Error('Create an account first.');
    if (me === otherUserId) throw new Error('You cannot start a private chat with yourself.');

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
    if (!me) return [];
    return db.conversations.filter((item) => (item.memberIds || []).includes(me)).map(clone);
  }

  async function getMessages(conversationId) {
    const db = await init();
    const me = currentUserId();
    const conversation = db.conversations.find((item) => item.id === conversationId);
    if (!conversation || !(conversation.memberIds || []).includes(me)) throw new Error('Conversation not found.');
    return db.messages
      .filter((message) => message.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .map(clone);
  }

  async function sendMessage(conversationId, body) {
    const db = await init();
    const me = currentUserId();
    const text = String(body || '').trim();
    if (!me) throw new Error('Create an account first.');
    if (!text) throw new Error('Message cannot be empty.');

    const conversation = db.conversations.find((item) => item.id === conversationId);
    if (!conversation || !(conversation.memberIds || []).includes(me)) throw new Error('Conversation not found.');

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
    const index = db.messages.findIndex((message) => message.id === messageId && message.senderId === me);
    if (index < 0) throw new Error('Message not found or not yours.');
    db.messages.splice(index, 1);
    writeDb(db);
    return true;
  }

  window.ChatboxAPI = {
    init,
    register,
    login,
    logout,
    getCurrentUser,
    getUsers,
    getConversations,
    getOrCreateDirectConversation,
    getMessages,
    sendMessage,
    deleteMessage
  };
})();
