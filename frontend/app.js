// ============================================
// APP - Main Application Entry Point
// ============================================

// ========== State Variables ==========
let charactersManager = null;
let agentsManager = null;

// ========== Initialization ==========
async function initApp() {
  console.log('Initializing application...');

  try {
    // Initialize audio playback (prepare audio context unlock)
    if (window.AudioPlayback) {
      AudioPlayback.prepare();
    }

    // Initialize WebSocket connection
    if (window.WSConnection) {
      WSConnection.connect();
    } else {
      console.error('WSConnection not available');
    }

    // Initialize interface (already auto-initializes via DOMContentLoaded in interface.js)
    console.log('Interface module loaded');

    // Characters module auto-initializes via DOMContentLoaded
    if (window.Characters) {
      console.log('Characters module available');
    }

    // Initialize agents manager (lazy - will init when tab accessed)
    if (window.AgentsManager) {
      console.log('Agents module available');
    }

    console.log('Application initialized successfully');

  } catch (error) {
    console.error('Failed to initialize application:', error);
  }
}

// ========== Module Initialization Helpers ==========
async function initializeCharactersModule() {
  if (window.Characters && typeof window.Characters.init === 'function') {
    try {
      await window.Characters.init();
      console.log('Characters module initialized');
    } catch (error) {
      console.error('Error initializing characters module:', error);
    }
  }
}

function initializeAgentsModule() {
  if (window.AgentsManager && !agentsManager) {
    try {
      agentsManager = new window.AgentsManager();
      console.log('Agents module initialized');
    } catch (error) {
      console.error('Error initializing agents module:', error);
    }
  }
}

// ========== Route Management ==========
function handleRouteChange() {
  const hash = window.location.hash.slice(1) || '/home';
  const route = hash.replace(/^\//, '') || 'home';

  // Initialize lazy modules based on route
  if (route === 'characters') {
    initializeCharactersModule();
  } else if (route === 'agents') {
    initializeAgentsModule();
  }
}

// ========== Event Listeners ==========
function setupEventListeners() {
  // Route changes
  window.addEventListener('hashchange', handleRouteChange);

  // Initial route
  handleRouteChange();
}

// ========== Boot ==========
function boot() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initApp();
      setupEventListeners();
    });
  } else {
    initApp();
    setupEventListeners();
  }
}

// Start the application
boot();
