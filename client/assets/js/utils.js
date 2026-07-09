/**
 * Strip protocols from URLs.
 * @param {string} url - Absolute URL address.
 */
export const formatUrl = (url) => {
  if (!url) return '';
  return url.replace(/^https?:\/\//i, '');
};

/**
 * Format date string into human-readable date.
 * @param {string} dateStr - Date string value.
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};
