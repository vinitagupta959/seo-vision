import { register, checkGuestAndRedirect } from '../auth.js';
import { showToast } from '../components/toast.js';

// Prevent authenticated users from visiting guest pages
checkGuestAndRedirect();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirm-password').value;

      if (!name || !email || !password || !confirmPassword) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      if (password !== confirmPassword) {
        showToast('Passwords do not match.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Creating Account...';
        
        await register(name, email, password);
        showToast('Account created successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = '/pages/dashboard.html';
        }, 1000);

      } catch (err) {
        showToast(err.message || 'Registration failed. Try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Create Account';
      }
    });
  }
});
