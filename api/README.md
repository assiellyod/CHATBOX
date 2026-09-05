# CHATBOX Practice API

This repository now includes a browser-based mock API for the practice project.

## Current implementation

`api/client.js` exposes `window.ChatboxAPI` with these methods:

- `init()`
- `register({ fullName, email, password })`
- `login({ email, password })`
- `logout()`
- `getCurrentUser()`
- `getUsers()`
- `getConversations()`
- `getOrCreateDirectConversation(otherUserId)`
- `getMessages(conversationId)`
- `sendMessage(conversationId, body)`
- `deleteMessage(messageId)`

## Practice database flow

1. Starter records are read from `database/seed.json` in GitHub.
2. The browser creates a local working copy in `localStorage`.
3. New accounts, conversations, and messages are written to that local working copy.
4. `database/schema.sql` remains the PostgreSQL-oriented design for a future real backend.

## Why it works this way

GitHub Pages serves static files only. A browser should not be given a GitHub write token just to save chat records because that would expose repository credentials. This practice version therefore keeps the API and database design in GitHub while using browser storage for safe local CRUD practice.

## Future real server endpoints

The frontend API shape can later map to endpoints such as:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/chats`
- `POST /api/chats`
- `GET /api/chats/:chatId/messages`
- `POST /api/chats/:chatId/messages`
- `DELETE /api/messages/:messageId`

## Security notes

- Never commit API keys, passwords, access tokens, or database credentials.
- Passwords in this practice browser database are stored as SHA-256 hashes for demonstration only; this is not production-grade password storage.
- A production backend should use a slow password hashing algorithm such as Argon2id or bcrypt and perform authorization server-side.
