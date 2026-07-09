import { initTheme, toggleTheme } from './theme.js';

/**
 * Dynamically renders the authenticated sidebar + top navbar layout,
 * or fallback public navbar links for landing/auth pages.
 */
export const renderNavbar = () => {
  const token = localStorage.getItem('jwt_token');
  const user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const pathname = window.location.pathname;
  
  const isAuthPage = pathname.includes('dashboard.html') || 
                     pathname.includes('history.html') || 
                     pathname.includes('report.html') || 
                     pathname.includes('profile.html') ||
                     pathname.includes('loading.html') ||
                     pathname.includes('404.html');

  if (!isAuthPage || !token || !user) {
    renderPublicNavbar(token, user);
    return;
  }

  renderAuthLayout(user);
};

const renderPublicNavbar = (token, user) => {
  const authNav = document.getElementById('auth-nav-links');
  if (authNav) {
    if (token && user) {
      authNav.innerHTML = `
        <a href="/pages/dashboard.html" class="nav-link">Dashboard</a>
        <a href="/pages/profile.html" class="nav-link nav-profile">
          <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user.name}" class="avatar-sm" alt="${user.name}">
          <span>${user.name}</span>
        </a>
      `;
    } else {
      authNav.innerHTML = `
        <a href="/pages/login.html" class="nav-btn nav-btn-outline">Log In</a>
        <a href="/pages/register.html" class="nav-btn nav-btn-primary">Register</a>
      `;
    }
  }
};

const renderAuthLayout = (user) => {
  if (document.getElementById('sidebar')) return;

  // Add layout body class
  document.body.classList.add('dashboard-layout-body');

  const appContainer = document.createElement('div');
  appContainer.className = 'app-container';
  appContainer.id = 'app-container-wrapper';

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'sidebar';

  const pathname = window.location.pathname;
  const isDashboardActive = pathname.includes('dashboard.html') ? 'active' : '';
  const isHistoryActive = pathname.includes('history.html') ? 'active' : '';
  const isProfileActive = pathname.includes('profile.html') ? 'active' : '';
  
  sidebar.innerHTML = `
    <div class="sidebar-header">
      <div class="sidebar-logo-group">
        <span class="logo-icon"><i class="fa-solid fa-eye"></i></span>
        <span class="logo-text">SEO Vision</span>
      </div>
      <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close Sidebar">
        <i class="fa-solid fa-xmark"></i>
      </button>
    </div>
    <div class="sidebar-user-profile">
      <img src="${user.avatar || 'https://api.dicebear.com/7.x/initials/svg?seed=' + user.name}" class="sidebar-avatar" alt="${user.name}">
      <div class="sidebar-user-details">
        <span class="sidebar-username">${user.name}</span>
        <span class="sidebar-email">${user.email || 'user@seovision.com'}</span>
      </div>
    </div>
    <nav class="sidebar-nav">
      <a href="/pages/dashboard.html" class="nav-item ${isDashboardActive}">
        <span class="nav-icon"><i class="fa-solid fa-chart-pie"></i></span>
        <span class="nav-label">Dashboard</span>
      </a>

      <div class="nav-group">
        <span class="nav-group-title">Analysis</span>
        <a href="/pages/dashboard.html?focus=true" class="nav-item" id="nav-new-analysis">
          <span class="nav-icon"><i class="fa-solid fa-magnifying-glass"></i></span>
          <span class="nav-label">New Analysis</span>
        </a>
        <a href="/pages/history.html" class="nav-item ${isHistoryActive}">
          <span class="nav-icon"><i class="fa-solid fa-list-ul"></i></span>
          <span class="nav-label">Analysis History</span>
        </a>
      </div>

      <div class="nav-group">
        <span class="nav-group-title">Account</span>
        <a href="/pages/profile.html" class="nav-item ${isProfileActive}">
          <span class="nav-icon"><i class="fa-solid fa-user"></i></span>
          <span class="nav-label">Profile</span>
        </a>
        <a href="/pages/profile.html#settings" class="nav-item">
          <span class="nav-icon"><i class="fa-solid fa-sliders"></i></span>
          <span class="nav-label">Settings</span>
        </a>
      </div>

      <div class="nav-group">
        <span class="nav-group-title">Appearance</span>
        <div class="sidebar-appearance">
          <span class="appearance-label"><i class="fa-solid fa-circle-half-stroke"></i> Theme</span>
          <button class="theme-toggle-btn appearance-toggle-btn" aria-label="Toggle Theme"></button>
        </div>
      </div>

      <hr class="nav-divider">
      <button class="nav-item logout-btn" id="sidebar-logout-btn">
        <span class="nav-icon"><i class="fa-solid fa-right-from-bracket"></i></span>
        <span class="nav-label">Logout</span>
      </button>
    </nav>
  `;

  let pageTitle = 'Dashboard';
  const path = window.location.pathname;
  if (path.includes('dashboard.html')) {
    pageTitle = 'Dashboard';
  } else if (path.includes('history.html')) {
    pageTitle = 'Analysis History';
  } else if (path.includes('report.html')) {
    pageTitle = 'SEO Report';
  } else if (path.includes('profile.html')) {
    pageTitle = window.location.hash === '#settings' ? 'Settings' : 'Profile';
  } else if (path.includes('loading.html')) {
    pageTitle = 'Analyzing Website';
  } else if (path.includes('404.html')) {
    pageTitle = 'Page Not Found';
  }

  const topNavbar = document.createElement('header');
  topNavbar.className = 'top-navbar';
  topNavbar.innerHTML = `
    <div class="navbar-left-brand">
      <button class="sidebar-toggle" id="sidebar-toggle" aria-label="Toggle Sidebar">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="navbar-logo-group">
        <span class="logo-icon"><i class="fa-solid fa-eye"></i></span>
        <span class="logo-text">SEO Vision</span>
      </div>
      <span class="navbar-page-title-separator">/</span>
      <span class="navbar-page-title">${pageTitle}</span>
    </div>
  `;

  const mainWrapper = document.createElement('div');
  mainWrapper.className = 'main-content-wrapper';

  const originalHeader = document.querySelector('header');
  const originalMain = document.querySelector('main') || document.querySelector('.main-wrapper') || document.querySelector('body > div');

  // Insert elements into DOM
  document.body.appendChild(appContainer);
  appContainer.appendChild(sidebar);
  appContainer.appendChild(mainWrapper);
  mainWrapper.appendChild(topNavbar);

  if (originalMain) {
    mainWrapper.appendChild(originalMain);
  }

  if (originalHeader && originalHeader !== topNavbar) {
    originalHeader.remove();
  }

  // Create overlay backdrop for mobile sidebar
  const overlay = document.createElement('div');
  overlay.className = 'sidebar-overlay';
  overlay.id = 'sidebar-overlay';
  document.body.appendChild(overlay);

  // Initialize theme button icon and bind click listeners to all instances
  initTheme();
  const themeToggles = document.querySelectorAll('.theme-toggle-btn');
  themeToggles.forEach(btn => {
    if (!btn.dataset.bound) {
      btn.addEventListener('click', toggleTheme);
      btn.dataset.bound = 'true';
    }
  });

  // Helper close sidebar routine
  const closeSidebar = () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  const openSidebar = () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  // Bind toggle interactions
  const toggleBtn = document.getElementById('sidebar-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isMobile = window.innerWidth < 700;
      if (isMobile) {
        if (sidebar.classList.contains('active')) {
          closeSidebar();
        } else {
          openSidebar();
        }
      }
    });
  }

  // Close triggers
  const closeBtn = document.getElementById('sidebar-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeSidebar);
  }

  if (overlay) {
    overlay.addEventListener('click', closeSidebar);
  }

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar.classList.contains('active')) {
      closeSidebar();
    }
  });

  // Dismiss mobile sidebar when a nav item is clicked
  const navItems = sidebar.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      if (window.innerWidth < 700) {
        closeSidebar();
      }
    });
  });

  // Bind logout interaction
  const logoutBtn = document.getElementById('sidebar-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    });
  }

  // Update top navbar page title dynamically when hash changes (e.g. settings vs profile)
  window.addEventListener('hashchange', () => {
    const titleEl = document.querySelector('.navbar-page-title');
    if (titleEl && window.location.pathname.includes('profile.html')) {
      titleEl.textContent = window.location.hash === '#settings' ? 'Settings' : 'Profile';
    }
  });

  // Handle focus parameter to target search inputs on dashboard
  const focusParam = new URLSearchParams(window.location.search).get('focus');
  if (focusParam === 'true') {
    const searchInput = document.getElementById('target-url');
    if (searchInput) {
      setTimeout(() => {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }
};

// Auto-run safely regardless of DOMContentLoaded timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    renderNavbar();
  });
} else {
  renderNavbar();
}
