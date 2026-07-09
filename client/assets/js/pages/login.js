import { login, checkGuestAndRedirect } from '../auth.js';
import { showToast } from '../components/toast.js';

// Prevent authenticated users from visiting guest auth pages
checkGuestAndRedirect();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('submit-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showToast('Please fill in all fields.', 'error');
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Signing In...';
        
        await login(email, password);
        showToast('Logged in successfully!', 'success');
        
        setTimeout(() => {
          window.location.href = '/pages/dashboard.html';
        }, 1000);

      } catch (err) {
        showToast(err.message || 'Incorrect email or password.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerText = 'Sign In';
      }
    });
  }
});
