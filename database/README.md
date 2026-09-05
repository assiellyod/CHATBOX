# CHATBOX Practice Database

This project keeps its practice data structure in GitHub.

- `schema.sql` is the PostgreSQL-style schema for a future real backend.
- `seed.json` is the starter data used by the browser mock API.
- New accounts, conversations, and messages are stored in the browser's `localStorage` during practice.

## Important limitation

GitHub Pages is static hosting, so browser code cannot safely write account/message data back into this repository without exposing a GitHub token. For that reason, this practice version reads its starter database from GitHub and writes runtime data only to the current browser.

When the project is ready for a real shared database, the existing `schema.sql` can be connected to a backend/database service without redesigning the frontend API calls.
