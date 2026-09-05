# CHATBOX API Structure

This folder contains the backend API structure for the private CHATBOX project.

## Planned structure

```text
api/
├── README.md
├── routes/
│   ├── auth.js
│   ├── users.js
│   ├── chats.js
│   └── messages.js
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── chatController.js
│   └── messageController.js
├── middleware/
│   ├── auth.js
│   └── errorHandler.js
├── services/
│   ├── authService.js
│   ├── chatService.js
│   └── messageService.js
├── models/
│   ├── User.js
│   ├── Chat.js
│   └── Message.js
└── config/
    └── README.md
```

## Core API endpoints

- `POST /api/auth/register` — create an account
- `POST /api/auth/login` — sign in
- `POST /api/auth/logout` — sign out
- `GET /api/users/me` — current user
- `GET /api/chats` — user's private chats
- `POST /api/chats` — create a private chat
- `GET /api/chats/:chatId/messages` — read messages
- `POST /api/chats/:chatId/messages` — send a message
- `DELETE /api/messages/:messageId` — delete a message

## Security rules

- Never commit API keys, passwords, tokens, or database credentials.
- Authentication tokens must be handled server-side.
- Private chats must be authorized per user/chat membership.
- Validate and sanitize API input.
- Use HTTPS in production.

This is the API blueprint only. Frontend UI and database implementation will be added separately.