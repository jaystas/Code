/**
 * main.js - Core functionality for aiChat interface
 * Handles navigation and sidebar collapse
 */

// Import editor functions
import { initEditor, handleMic, handleSend } from './editor.js';

// Make functions globally accessible for inline event handlers
window.handleMic = handleMic;
window.handleSend = handleSend;

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
        <!-- Info Column (Left) -->
        <div class="info-column">
        </div>

        <!-- Chat Column (Center) -->
        <div class="chat-column">
          <!-- Messages Area -->
          <div class="messages-area">
          </div>

          <!-- Editor Area -->
          <div class="editor-area">
            <div class="editor-container">
              <div class="toolbar" id="toolbar">
                <!-- Toolbar buttons will be dynamically added by editor.js -->
              </div>

              <div class="editor-content">
                <div id="editor"></div>
              </div>

              <div class="editor-footer">
                <button class="mic-button" onclick="handleMic()">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                    <line x1="12" y1="19" x2="12" y2="23"></line>
                    <line x1="8" y1="23" x2="16" y2="23"></line>
                  </svg>
                </button>
                <button class="send-button" onclick="handleSend()">Send</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings Column (Right) -->
        <div class="settings-column">
          <button class="drawer-toggle" id="drawer-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill="none" stroke="#4a5565" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m13 20l-3-8l3-8" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Settings Drawer (offscreen) -->
      <div class="drawer-overlay" id="drawer-overlay"></div>
      <div class="settings-drawer" id="settings-drawer">
        <h2 style="font-size: 1.5rem; margin-bottom: 1rem; color: var(--text);">Settings</h2>
        <p style="color: var(--muted);">Settings content will go here...</p>
      </div>
    `,
    models: `
      <div class="page-content" style="display: block;">
        <h1>Models</h1>
        <p>Manage your AI models here</p>
      </div>
    `,
    chats: `
      <div class="page-content" style="display: block;">
        <h1>Chats</h1>
        <p>View and manage your chat history</p>
      </div>
    `,
    characters: `
      <div class="page-content" style="display: block;">
        <h1>Characters</h1>
        <p>Create and customize AI characters</p>
      </div>
    `,
    agents: `
      <div class="page-content" style="display: block;">
        <h1>Agents</h1>
        <p>Configure your AI agents</p>
      </div>
    `,
    speech: `
      <div class="page-content" style="display: block;">
        <h1>Speech</h1>
        <p>Voice and speech settings</p>
      </div>
    `,
    settings: `
      <div class="page-content" style="display: block;">
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

    // Initialize editor if on home page
    if (page === 'home') {
      // Wait a bit for DOM to be ready
      setTimeout(() => {
        initEditor();
        initDrawer();
      }, 100);
    }
  }, 150);
}

/**
 * Initialize settings drawer functionality
 */
function initDrawer() {
  const drawerToggle = document.getElementById('drawer-toggle');
  const drawer = document.getElementById('settings-drawer');
  const overlay = document.getElementById('drawer-overlay');

  if (!drawerToggle || !drawer || !overlay) {
    return;
  }

  // Toggle drawer on button click
  drawerToggle.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  });

  // Close drawer when clicking overlay
  overlay.addEventListener('click', () => {
    closeDrawer();
  });

  function openDrawer() {
    drawer.classList.add('open');
    overlay.classList.add('active');
    drawerToggle.classList.add('active');
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    drawerToggle.classList.remove('active');
  }
}
