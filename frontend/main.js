/**
 * main.js - Core functionality for aiChat interface
 * Handles navigation and sidebar collapse
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initNavigation();
});

/**
 * Initialize sidebar collapse functionality
 */
function initSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const collapseBtn = document.querySelector('.collapse-btn');

  if (!sidebar || !collapseBtn) {
    console.warn('Sidebar elements not found');
    return;
  }

  // Load saved sidebar state from localStorage
  const sidebarState = localStorage.getItem('sidebarCollapsed');
  if (sidebarState === 'true') {
    sidebar.classList.add('collapsed');
  }

  // Toggle sidebar on button click
  collapseBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');

    // Save state to localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
  });
}

/**
 * Initialize navigation functionality
 */
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const contentArea = document.querySelector('.content-area');

  if (!contentArea) {
    console.warn('Content area not found');
    return;
  }

  // Handle navigation link clicks
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));

      // Add active class to clicked link
      link.classList.add('active');

      // Get the page name from href (e.g., #home -> home)
      const page = link.getAttribute('href').substring(1);

      // Update the content area
      loadPage(page, contentArea);

      // Update URL hash without scrolling
      history.pushState(null, null, `#${page}`);
    });
  });

  // Handle browser back/forward buttons
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.substring(1) || 'home';
    const activeLink = document.querySelector(`.nav-link[href="#${hash}"]`);

    if (activeLink) {
      navLinks.forEach(l => l.classList.remove('active'));
      activeLink.classList.add('active');
      loadPage(hash, contentArea);
    }
  });

  // Load initial page based on URL hash
  const initialHash = window.location.hash.substring(1) || 'home';
  const initialLink = document.querySelector(`.nav-link[href="#${initialHash}"]`);

  if (initialLink) {
    navLinks.forEach(l => l.classList.remove('active'));
    initialLink.classList.add('active');
    loadPage(initialHash, contentArea);
  } else {
    // Default to first link if hash doesn't match
    const firstLink = navLinks[0];
    if (firstLink) {
      firstLink.classList.add('active');
      const defaultPage = firstLink.getAttribute('href').substring(1);
      loadPage(defaultPage, contentArea);
    }
  }
}

/**
 * Load page content
 * @param {string} page - The page name to load
 * @param {HTMLElement} container - The container element to update
 */
function loadPage(page, container) {
  // Page content templates
  const pageContent = {
    home: `
      <div class="page-content">
        <h1>Welcome to aiChat</h1>
        <p>Your low-latency voice chat application</p>
      </div>
    `,
    models: `
      <div class="page-content">
        <h1>Models</h1>
        <p>Manage your AI models here</p>
      </div>
    `,
    chats: `
      <div class="page-content">
        <h1>Chats</h1>
        <p>View and manage your chat history</p>
      </div>
    `,
    characters: `
      <div class="page-content">
        <h1>Characters</h1>
        <p>Create and customize AI characters</p>
      </div>
    `,
    agents: `
      <div class="page-content">
        <h1>Agents</h1>
        <p>Configure your AI agents</p>
      </div>
    `,
    speech: `
      <div class="page-content">
        <h1>Speech</h1>
        <p>Voice and speech settings</p>
      </div>
    `,
    settings: `
      <div class="page-content">
        <h1>Settings</h1>
        <p>Application settings and preferences</p>
      </div>
    `
  };

  // Get content or show error
  const content = pageContent[page] || `
    <div class="page-content">
      <h1>Page Not Found</h1>
      <p>The page "${page}" could not be found.</p>
    </div>
  `;

  // Add fade effect
  container.style.opacity = '0';

  setTimeout(() => {
    container.innerHTML = content;
    container.style.opacity = '1';
  }, 150);
}
