(function () {
  'use strict';

  const REPO = 'assiellyod/CHATBOX';
  const API_URL = `https://api.github.com/repos/${REPO}/issues?state=all&per_page=100`;
  const ISSUE_MARKER = 'CHATBOX_REGISTER_V1';

  function normalizeLine(value) {
    return String(value || '').trim();
  }

  function parseRegistrationIssue(issue) {
    if (!issue || issue.pull_request) return null;
    const body = String(issue.body || '');
    if (!body.includes(ISSUE_MARKER)) return null;

    const idMatch = body.match(/^User-ID:\s*(.+)$/mi);
    const nameMatch = body.match(/^Display-Name:\s*(.+)$/mi);
    if (!idMatch || !nameMatch) return null;

    const id = normalizeLine(idMatch[1]);
    const displayName = normalizeLine(nameMatch[1]);
    if (!id || displayName.length < 2) return null;

    return {
      id,
      displayName,
      email: '',
      shared: true,
      source: 'github-issue',
      issueNumber: issue.number,
      createdAt: issue.created_at || new Date().toISOString()
    };
  }

  async function getRegisteredUsers() {
    const response = await fetch(`${API_URL}&_=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json'
      }
    });

    if (!response.ok) {
      throw new Error(`Unable to load shared GitHub users (${response.status}).`);
    }

    const issues = await response.json();
    const users = issues.map(parseRegistrationIssue).filter(Boolean);

    const unique = new Map();
    users.forEach((user) => {
      if (!unique.has(user.id)) unique.set(user.id, user);
    });

    return Array.from(unique.values());
  }

  function createRegistrationIssueUrl(user) {
    const displayName = normalizeLine(user?.displayName);
    const id = normalizeLine(user?.id);
    if (!displayName || !id) throw new Error('User data is incomplete.');

    const title = `[CHATBOX REGISTER] ${displayName}`;
    const body = [
      ISSUE_MARKER,
      `User-ID: ${id}`,
      `Display-Name: ${displayName}`,
      '',
      'Submit this issue to publish this CHATBOX user to the shared GitHub user list.',
      'No password or private email is included in this public registration request.'
    ].join('\n');

    const params = new URLSearchParams({ title, body });
    return `https://github.com/${REPO}/issues/new?${params.toString()}`;
  }

  window.ChatboxGitHubData = {
    getRegisteredUsers,
    createRegistrationIssueUrl
  };
})();
