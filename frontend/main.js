/**
 * main.js - Core functionality for aiChat interface
 * Handles navigation and sidebar collapse
 */

// Import editor functions
import { initEditor, handleMic, handleSend } from './editor.js';

// Make functions globally accessible for inline event handlers
window.handleMic = handleMic;
window.handleSend = handleSend;

// Store reference to characters initialization
let charactersInitialized = false;

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
        </div>
      </div>

      <!-- Settings Drawer Toggle Button -->
      <button class="drawer-toggle" id="drawer-toggle">
        <img class="arrow-left" src="assets/arrow.png" alt="arrow-compact" />
      </button>

      <!-- Settings Drawer (offscreen) -->
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
      <!-- Characters Page -->
      <div class="characters-page-container" id="charactersPage">
        <!-- Left Column - Character List -->
        <div class="character-list-column">
          <div class="character-list-header">
            <h2 class="character-list-title">Characters</h2>
            <div class="character-search-container">
              <svg class="character-search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" class="character-search-input" placeholder="Search characters..." id="characterSearchInput">
            </div>
          </div>

          <div class="character-list-items" id="characterListItems">
            <!-- Character items will be dynamically generated by JavaScript -->
          </div>

          <div class="character-add-section">
            <button class="character-add-btn" id="characterAddBtn">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Character
            </button>
          </div>
        </div>

        <!-- Right Column - Character Card -->
        <div class="character-card-column">
          <!-- Empty State -->
          <div class="character-empty-state" id="characterEmptyState">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3>Select a Character</h3>
            <p>Choose a character from the list to view details</p>
          </div>

          <!-- Character Card Detail -->
          <div class="character-card-detail" id="characterCardDetail">
            <!-- Card Header -->
            <div class="character-card-header">
              <div class="character-header-left">
                <div class="character-avatar-container">
                  <div class="character-card-avatar" id="characterCardAvatar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <button class="character-avatar-edit-btn" id="characterAvatarEditBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <h2 class="character-card-name" id="characterCardName">Character Name</h2>
              </div>
              <button class="character-card-close-btn" id="characterCardCloseBtn">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Tabs Header -->
            <div class="character-tabs-header">
              <button class="character-tab-btn active" data-tab="profile">Profile</button>
              <button class="character-tab-btn" data-tab="background">Background</button>
              <button class="character-tab-btn" data-tab="chats">Chats</button>
              <button class="character-tab-btn" data-tab="groups">Groups</button>
              <button class="character-tab-btn" data-tab="memory">Memory</button>
            </div>

            <!-- Card Body -->
            <div class="character-card-body">
              <!-- Left Side - Image Upload (Profile tab only) -->
              <div class="character-image-section" id="characterImageSection">
                <div class="character-image-upload-area" id="characterImageUploadArea">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Click to upload image</span>
                </div>
                <input type="file" id="characterImageInput" accept="image/*" style="display: none;">
              </div>

              <!-- Right Side - Form Content -->
              <div class="character-content-section" id="characterContentSection">
                <div class="character-tab-content">
                  <!-- Profile Tab -->
                  <div class="character-tab-panel active" id="character-profile-panel">
                    <div class="character-form-group">
                      <label class="character-form-label">Global Roleplay System Prompt</label>
                      <textarea class="character-form-textarea" id="characterGlobalPrompt" placeholder="Enter global roleplay system prompt">You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.</textarea>
                    </div>

                    <div class="character-form-group">
                      <label class="character-form-label">Character Name</label>
                      <input type="text" class="character-form-input" id="characterNameInput" placeholder="Enter character name">
                    </div>

                    <div class="character-form-group">
                      <label class="character-form-label">Voice</label>
                      <select class="character-form-select" id="characterVoiceSelect">
                        <option value="">Select voice</option>
                        <option value="nova">Nova</option>
                        <option value="aria">Aria</option>
                        <option value="sage">Sage</option>
                        <option value="echo">Echo</option>
                        <option value="alloy">Alloy</option>
                      </select>
                    </div>

                    <div class="character-form-group">
                      <label class="character-form-label">System Prompt</label>
                      <textarea class="character-form-textarea" id="characterSystemPrompt" placeholder="Enter system prompt"></textarea>
                    </div>
                  </div>

                  <!-- Background Tab -->
                  <div class="character-tab-panel" id="character-background-panel">
                    <div class="character-placeholder-content">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                      <h3>Background</h3>
                      <p>Coming soon</p>
                    </div>
                  </div>

                  <!-- Chats Tab -->
                  <div class="character-tab-panel" id="character-chats-panel">
                    <div class="character-placeholder-content">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                      </svg>
                      <h3>Chats</h3>
                      <p>Coming soon</p>
                    </div>
                  </div>

                  <!-- Groups Tab -->
                  <div class="character-tab-panel" id="character-groups-panel">
                    <div class="character-placeholder-content">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                      </svg>
                      <h3>Groups</h3>
                      <p>Coming soon</p>
                    </div>
                  </div>

                  <!-- Memory Tab -->
                  <div class="character-tab-panel" id="character-memory-panel">
                    <div class="character-placeholder-content">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                      </svg>
                      <h3>Memory</h3>
                      <p>Coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Card Footer -->
            <div class="character-card-footer">
              <div class="character-footer-left">
                <button class="character-btn character-btn-danger" id="characterDeleteBtn">Delete</button>
              </div>
              <div class="character-footer-right">
                <button class="character-btn character-btn-secondary" id="characterChatBtn">Chat</button>
                <button class="character-btn character-btn-primary" id="characterSaveBtn">Save Character</button>
              </div>
            </div>
          </div>
        </div>
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

    // Initialize characters page
    if (page === 'characters') {
      setTimeout(() => {
        initCharactersPage();
      }, 100);
    }
  }, 150);
}

/**
 * Initialize characters page functionality
 * This dynamically loads and initializes the characters.js module
 */
async function initCharactersPage() {
  try {
    // Dynamically import the characters module
    const { default: initializeCharacters } = await import('./characters.js');

    // Call the initialization function
    if (typeof initializeCharacters === 'function') {
      initializeCharacters();
    }
  } catch (error) {
    console.error('Failed to initialize characters page:', error);

    // Fallback: Try to manually initialize if the module is already loaded
    if (typeof window.initializeCharactersPage === 'function') {
      window.initializeCharactersPage();
    }
  }
}

/**
 * Initialize settings drawer functionality
 */
function initDrawer() {
  const drawerToggle = document.getElementById('drawer-toggle');
  const drawer = document.getElementById('settings-drawer');

  if (!drawerToggle || !drawer) {
    return;
  }

  // Toggle drawer on button click
  drawerToggle.addEventListener('click', () => {
    const isOpen = drawer.classList.contains('open');

    if (isOpen) {
      drawer.classList.remove('open');
      drawerToggle.classList.remove('active');
    } else {
      drawer.classList.add('open');
      drawerToggle.classList.add('active');
    }
  });
}
