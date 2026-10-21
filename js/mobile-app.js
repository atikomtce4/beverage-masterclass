// Toggle Side Menu
function toggleMenu() {
  const menu = document.getElementById('sideMenu');
  const overlay = document.getElementById('menuOverlay');
  
  if (menu && overlay) {
    menu.classList.toggle('active');
    overlay.classList.toggle('active');
  }
}

// Show/Hide Search
function showSearch() {
  const modal = document.getElementById('searchModal');
  if (modal) {
    modal.classList.add('active');
    modal.querySelector('.search-input').focus();
  }
}

function hideSearch() {
  const modal = document.getElementById('searchModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// Navigation
function navigateTo(page) {
  // Close menu if open
  toggleMenu();
  
  // Navigate based on page
  switch(page) {
    case 'categories':
      window.location.href = 'categories.html';
      break;
    case 'recipe-detail':
      window.location.href = 'recipe-detail.html';
      break;
    case 'products':
      // Link to Beverage System
      window.location.href = 'https://atikomtce4.github.io/bevarageSystem/';
      break;
    case 'news':
      // Scroll to news section or create new page
      alert('News page coming soon!');
      break;
    case 'about':
      alert('About page coming soon!');
      break;
  }
}

// Category Navigation
function showCategory(category) {
  // For now, just show alert. Later, create category pages
  const categories = {
    'thai-herbs': 'Thai Herbs',
    'tea-hot': 'Tea & Hot Drinks',
    'milk-cereals': 'Milk & Cereals',
    'fermented': 'Fermented Beverages'
  };
  
  alert(`Category: ${categories[category]} - Coming soon!`);
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.querySelector('.search-input');
  
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const query = this.value.trim();
        if (query) {
          alert(`Searching for: ${query}`);
          // Later: implement actual search
        }
      }
    });
  }
});

// Prevent zoom on double tap (for better mobile experience)
let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);