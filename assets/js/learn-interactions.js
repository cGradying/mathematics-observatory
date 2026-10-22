// Learn page interaction enhancements

// Debounce helper
function debounce(fn, delay) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// Smooth scrolling for internal links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// Toggle lesson lists inside topic cards on click
document.querySelectorAll('.topic-card').forEach(card => {
  const ul = card.querySelector('ul');
  if (ul) {
    // hide initially
    ul.style.display = 'none';
    const header = card.querySelector('h3');
    if (header) {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const isOpen = ul.style.display === 'block';
        ul.style.display = isOpen ? 'none' : 'block';
      });
    }
  }
});

// Search box debounce (already wired in React, but we add a fallback for non‑React search)
const searchInput = document.querySelector('.search-box input');
if (searchInput) {
  const performSearch = debounce(() => {
    const query = searchInput.value.trim().toLowerCase();
    document.querySelectorAll('.topic-card').forEach(card => {
      const title = card.querySelector('h3')?.textContent?.toLowerCase() || '';
      card.style.display = title.includes(query) ? '' : 'none';
    });
  }, 300);
  searchInput.addEventListener('input', performSearch);
}

// Highlight selected resource cards on hover
document.querySelectorAll('.resource-card').forEach(card => {
  card.addEventListener('mouseenter', () => {
    card.style.borderColor = '#6c4bf4';
  });
  card.addEventListener('mouseleave', () => {
    card.style.borderColor = '#282435';
  });
});
