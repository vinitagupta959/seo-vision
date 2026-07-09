import { fetchProfile, updateProfile, logout, checkAuthAndProtect } from '../auth.js';
import { showToast } from '../components/toast.js';

// Direct protection validation
checkAuthAndProtect();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('profile-form');
  const submitBtn = document.getElementById('submit-btn');
  const logoutBtn = document.getElementById('logout-btn');

  const profileAvatar = document.getElementById('profile-avatar');
  const profileDisplayName = document.getElementById('profile-display-name');
  const profileDisplayEmail = document.getElementById('profile-display-email');

  // Populate data from DB
  const loadUserData = async () => {
    try {
      const user = await fetchProfile();
      
      document.getElementById('name').value = user.name;
      document.getElementById('email').value = user.email;
      
      if (profileDisplayName) profileDisplayName.innerText = user.name;
      if (profileDisplayEmail) profileDisplayEmail.innerText = user.email;
      if (profileAvatar) profileAvatar.src = user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name)}`;
    } catch (err) {
      showToast('Failed to load profile details.', 'error');
    }
  };

  loadUserData();

  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Saving Changes...';

        const updatedUser = await updateProfile(name, email, password || undefined);
        showToast('Profile updated successfully!', 'success');

        // Clear password field
        document.getElementById('password').value = '';

        // Reload data
        if (profileDisplayName) profileDisplayName.innerText = updatedUser.name;
        if (profileDisplayEmail) profileDisplayEmail.innerText = updatedUser.email;
        if (profileAvatar) profileAvatar.src = updatedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updatedUser.name)}`;
        
        // Refresh sidebar user details
        const sidebarAvatar = document.querySelector('.sidebar-avatar');
        if (sidebarAvatar) sidebarAvatar.src = updatedUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updatedUser.name)}`;
        const sidebarName = document.querySelector('.sidebar-username');
        if (sidebarName) sidebarName.innerText = updatedUser.name;
        const sidebarEmail = document.querySelector('.sidebar-email');
        if (sidebarEmail) sidebarEmail.innerText = updatedUser.email;

      } catch (err) {
        showToast(err.message || 'Profile update failed.', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Save Profile Updates';
      }
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      showToast('Logged out successfully.', 'info');
    });
  }
});
