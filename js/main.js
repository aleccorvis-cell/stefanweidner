/**
 * MAPMusic - Main JavaScript
 * Handles navigation, form validation, and animations
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollEffects();
  initContactForm();
  initAnimations();
});

/* ========== Navigation ========== */
function initNavigation() {
  const nav = document.querySelector('.nav');
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  // Mobile menu toggle
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      navToggle.classList.toggle('active');
      
      // Toggle aria-expanded
      const isExpanded = navLinks.classList.contains('active');
      navToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        navToggle.classList.remove('active');
      });
    });
  }

  // Scroll effect for nav
  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
  }
}

/* ========== Scroll Effects ========== */
function initScrollEffects() {
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.nav')?.offsetHeight || 0;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ========== Contact Form ========== */
function initContactForm() {
  const form = document.querySelector('.contact-form');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    // Check honeytrap - if filled, it's a bot
    const honeytrap = form.querySelector('[name="website"]');
    if (honeytrap && honeytrap.value !== '') {
      e.preventDefault();
      console.warn('Bot detected via honeytrap');
      // Silently fail for bots
      return false;
    }

    // Validate required fields
    const name = form.querySelector('[name="name"]');
    const email = form.querySelector('[name="email"]');
    const inquiry = form.querySelector('[name="inquiry"]');

    let isValid = true;
    let firstInvalid = null;

    // Clear previous errors
    form.querySelectorAll('.form-error').forEach(el => el.remove());
    form.querySelectorAll('.form-input, .form-select').forEach(el => {
      el.classList.remove('error');
    });

    // Validate name
    if (!name?.value.trim()) {
      showError(name, 'Bitte geben Sie Ihren Namen ein.');
      isValid = false;
      firstInvalid = firstInvalid || name;
    }

    // Validate email
    if (!email?.value.trim()) {
      showError(email, 'Bitte geben Sie Ihre E-Mail-Adresse ein.');
      isValid = false;
      firstInvalid = firstInvalid || email;
    } else if (!isValidEmail(email.value)) {
      showError(email, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.');
      isValid = false;
      firstInvalid = firstInvalid || email;
    }

    // Validate inquiry type
    if (!inquiry?.value) {
      showError(inquiry, 'Bitte wählen Sie eine Anfrageart aus.');
      isValid = false;
      firstInvalid = firstInvalid || inquiry;
    }

    if (!isValid) {
      e.preventDefault();
      firstInvalid?.focus();
      return false;
    }

    // Form is valid - will submit naturally
    return true;
  });
}

function showError(element, message) {
  if (!element) return;
  
  element.classList.add('error');
  const errorDiv = document.createElement('div');
  errorDiv.className = 'form-error';
  errorDiv.textContent = message;
  errorDiv.style.cssText = 'color: #ff6b6b; font-size: 0.875rem; margin-top: 0.25rem;';
  element.parentNode.appendChild(errorDiv);
}

function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/* ========== Animations ========== */
function initAnimations() {
  // Fallback for browsers without scroll-driven animations
  if (!CSS.supports('animation-timeline', 'scroll()')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
      observer.observe(el);
    });
  }
}

/* ========== Thank You Page Redirect ========== */
function initRedirect(seconds = 5) {
  const countdownEl = document.getElementById('countdown');
  if (!countdownEl) return;

  let remaining = seconds;
  
  const interval = setInterval(() => {
    remaining--;
    countdownEl.textContent = remaining;
    
    if (remaining <= 0) {
      clearInterval(interval);
      window.location.href = 'index.html';
    }
  }, 1000);
}

// Auto-init redirect on thank you page
if (document.querySelector('.thankyou-container')) {
  initRedirect(5);
}
