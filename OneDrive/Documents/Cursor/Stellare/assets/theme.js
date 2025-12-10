// Stellare Theme JavaScript
// General theme functionality

document.addEventListener('DOMContentLoaded', function() {
  // Mobile menu toggle
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.getElementById('mainNav');
  
  if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', function() {
      mainNav.classList.toggle('active');
    });
  }

  // Add to cart functionality
  setupCartFunctionality();
  
  // Smooth scroll for anchor links
  setupSmoothScroll();
  
  // Initialize animations
  initializeAnimations();
});

// Cart functionality
function setupCartFunctionality() {
  const cartForms = document.querySelectorAll('form[action*="/cart/add"]');
  
  cartForms.forEach(form => {
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(form);
      const submitButton = form.querySelector('button[type="submit"]');
      const originalText = submitButton.innerHTML;
      
      try {
        submitButton.innerHTML = '⏳ Adding...';
        submitButton.disabled = true;
        
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          showNotification('✅ Added to cart!', 'success');
          updateCartCount();
          
          // Optional: Show mini cart or redirect
          setTimeout(() => {
            // window.location.href = '/cart';
          }, 1000);
        } else {
          throw new Error('Failed to add to cart');
        }
      } catch (error) {
        showNotification('❌ Error adding to cart', 'error');
      } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
      }
    });
  });
}

// Update cart count in header
async function updateCartCount() {
  try {
    const response = await fetch('/cart.js');
    const cart = await response.json();
    const cartCountElement = document.querySelector('.cart-count');
    if (cartCountElement) {
      cartCountElement.textContent = cart.item_count;
      
      // Animate the count
      cartCountElement.style.transform = 'scale(1.5)';
      setTimeout(() => {
        cartCountElement.style.transform = 'scale(1)';
      }, 300);
    }
  } catch (error) {
    console.error('Error updating cart count:', error);
  }
}

// Smooth scroll for anchor links
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
}

// Initialize scroll animations
function initializeAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements with animation class
  document.querySelectorAll('.animate-on-scroll').forEach(el => {
    observer.observe(el);
  });
}

// Show notification/toast
function showNotification(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    background: white;
    padding: 1rem 2rem;
    border-radius: 50px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideInUp 0.3s ease;
    border-left: 4px solid ${type === 'success' ? '#4CAF50' : '#f44336'};
  `;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInUp 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Search functionality
const searchInput = document.querySelector('input[type="search"]');
if (searchInput) {
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const query = this.value.trim();
      if (query) {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
      }
    }
  });
}

// Lazy loading images
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.src = img.dataset.src;
  });
} else {
  // Fallback for browsers that don't support lazy loading
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/lazysizes/5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

// Initialize cart count on page load
updateCartCount();

// Star animation for hero section
function createStarAnimation() {
  const heroStars = document.querySelector('.hero-stars');
  if (!heroStars) return;

  setInterval(() => {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.width = Math.random() * 20 + 10 + 'px';
    star.style.height = star.style.width;
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    
    heroStars.appendChild(star);
    
    setTimeout(() => star.remove(), 5000);
  }, 2000);
}

createStarAnimation();

