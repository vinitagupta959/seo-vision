import { showToast } from './toast.js';

/**
 * Update the inner layout of the theme switcher buttons.
 */
export const updateToggleButton = (theme) => {
  const themeToggles = document.querySelectorAll('.theme-toggle-btn');
  themeToggles.forEach(btn => {
    btn.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
  });
};

/**
 * Reads local storage and initializes html attributes and toggles.
 */
export const initTheme = () => {
  const currentTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
  updateToggleButton(currentTheme);
};

/**
 * Toggle active document theme and save configuration to local storage.
 */
export const toggleTheme = () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  updateToggleButton(newTheme);

  // Dispatch global event for listeners (e.g. canvas charts) to redraw
  window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: newTheme } }));

  showToast(`Switched to ${newTheme} mode`, 'success', 1000);
};

// Auto-bind toggle listener safely regardless of DOMContentLoaded timing
const setupThemeBindings = () => {
  initTheme();
  const themeToggles = document.querySelectorAll('.theme-toggle-btn');
  themeToggles.forEach(btn => {
    if (!btn.dataset.bound) {
      btn.addEventListener('click', toggleTheme);
      btn.dataset.bound = 'true';
    }
  });
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupThemeBindings);
} else {
  setupThemeBindings();
}
