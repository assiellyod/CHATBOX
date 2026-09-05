document.addEventListener('DOMContentLoaded', () => {
  const sidebarTop = document.querySelector('.sidebar-top');
  if (!sidebarTop || document.querySelector('.account-action')) return;

  const link = document.createElement('a');
  link.href = 'register.html';
  link.className = 'account-action';
  link.setAttribute('aria-label', 'Create account');
  link.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M15 19a6 6 0 0 0-12 0"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M19 8v6M16 11h6"/>
    </svg>
    Add account
  `;
  sidebarTop.appendChild(link);
});
