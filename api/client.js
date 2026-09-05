(function () {
  'use strict';

  const DB_KEY = 'chatbox_mock_db_v1';
  const SESSION_KEY = 'chatbox_session_v1';
  const SEED_URL = 'database/seed.json';
  const REMOVED_DEMO_IDS = new Set(['usr_alex', 'usr_jamie']);
  const PRACTICE_USER = {
    id: 'usr_practice',
    displayName: 'You',
    email: 'practice@chatbox.demo',
    passwordHash: null,
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

  async function init() {
    let db = readDb();
    if (!db) db = await loadSeed();

    db.users = Array.isArray(db.users) ? db.users : [];
    db.conversations = Array.isArray(db.conversations) ? db.conversations : [];
    db.messages = Array.isArray(db.messages) ? db.messages : [];

    removeLegacyDemoData(db);

    if (!db.users.some((user) => user.id === PRACTICE_USER.id)) {
      db.users.unshift(clone(PRACTICE_USER));
    }

    writeDb(db);
    localStorage.setItem(SESSION_KEY, PRACTICE_USER.id);
    return db;
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
    return db.users.map(({ passwordHash, ...safeUser }) => safeUser);
  }

  async function getOrCreateDirectConversation(otherUserId) {
    const db = await init();
    const me = currentUserId();
    if (!otherUserId) throw new Error('Select a user first.');
    if (me === otherUserId) throw new Error('You cannot start a private chat with yourself.');

    const otherUser = db.users.find((user) => user.id === otherUserId);
    if (!otherUser) throw new Error('User not found.');

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
    getCurrentUser,
    getUsers,
    getConversations,
    getOrCreateDirectConversation,
    getMessages,
    sendMessage,
    deleteMessage
  };
})();
