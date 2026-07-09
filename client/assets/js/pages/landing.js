document.addEventListener('DOMContentLoaded', () => {
  // FAQ toggles binding
  document.querySelectorAll('.faq-item').forEach(item => {
    item.addEventListener('click', () => {
      item.classList.toggle('active');
      const arrow = item.querySelector('.faq-question i');
      if (arrow) {
        if (item.classList.contains('active')) {
          arrow.className = 'fa-solid fa-chevron-up';
        } else {
          arrow.className = 'fa-solid fa-chevron-down';
        }
      }
    });
  });
});
