/**
 * Displays a toast notification in the bottom right corner of the page.
 * @param {string} message - Notification text copy.
 * @param {string} type - 'success', 'error', 'warning', 'info'
 * @param {number} duration - Milliseconds to show.
 */
export const showToast = (message, type = 'info', duration = 3000) => {
  let container = document.getElementById('toast-container');
  
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} fade-in`;
  
  let icon = '⚡';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✗';
  if (type === 'warning') icon = '⚠';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.replace('fade-in', 'fade-out');
    setTimeout(() => toast.remove(), 400);
  }, duration);
};
