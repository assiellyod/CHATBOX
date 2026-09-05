// Optional loader for the Add account UI.
// Include this file from index.html when the main shell is next edited.
const accountStyle = document.createElement('link');
accountStyle.rel = 'stylesheet';
accountStyle.href = 'account-button.css';
document.head.appendChild(accountStyle);

const accountScript = document.createElement('script');
accountScript.src = 'add-account.js';
document.body.appendChild(accountScript);
