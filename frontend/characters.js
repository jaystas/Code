/**
 * characters.js - Character Management Functionality
 * Handles character creation, editing, deletion, and display
 */

// Character data storage
let characters = [];
let selectedCharacterId = null;
let currentCharacter = null;

/**
 * Initialize the characters page
 */
export function initCharacters() {
  // Load characters from localStorage
  loadCharacters();

  // Render the character list
  renderCharacterList();

  // Setup event listeners
  setupEventListeners();

  console.log('Characters page initialized');
}

/**
 * Load characters from localStorage
 */
function loadCharacters() {
  const savedCharacters = localStorage.getItem('aiChat_characters');
  if (savedCharacters) {
    try {
      characters = JSON.parse(savedCharacters);
    } catch (e) {
      console.error('Error loading characters:', e);
      characters = [];
    }
  }
}

/**
 * Save characters to localStorage
 */
function saveCharacters() {
  localStorage.setItem('aiChat_characters', JSON.stringify(characters));
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Add character button
  const addBtn = document.getElementById('add-character-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => showCharacterCard(true));
  }

  // Character search
  const searchInput = document.getElementById('character-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => filterCharacters(e.target.value));
  }

  // Close card button
  const closeBtn = document.getElementById('character-card-close-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => hideCharacterCard());
  }

  // Tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => switchTab(button.dataset.tab));
  });

  // Image upload
  const imageSection = document.getElementById('image-section');
  const imageInput = document.getElementById('character-image-input');
  const avatarEditBtn = document.getElementById('avatar-edit-btn');

  if (imageSection && imageInput) {
    imageSection.addEventListener('click', () => imageInput.click());
  }

  if (avatarEditBtn && imageInput) {
    avatarEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageInput.click();
    });
  }

  if (imageInput) {
    imageInput.addEventListener('change', handleImageUpload);
  }

  // Character name input sync
  const characterNameInput = document.getElementById('character-name-input');
  if (characterNameInput) {
    characterNameInput.addEventListener('input', (e) => {
      const name = e.target.value || 'Character name';
      const characterName = document.getElementById('character-name-display');
      if (characterName) {
        characterName.textContent = name;
      }
    });
  }

  // Save button
  const saveBtn = document.getElementById('save-character-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCharacter);
  }

  // Delete button
  const deleteBtn = document.getElementById('delete-character-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteCharacter);
  }

  // Chat button
  const chatBtn = document.getElementById('chat-character-btn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      console.log('Opening chat with character...');
      // TODO: Navigate to chat page with this character
      alert('Chat functionality will be implemented in the next phase');
    });
  }
}

/**
 * Render the character list
 */
function renderCharacterList() {
  const listContainer = document.getElementById('character-list');

  if (!listContainer) {
    console.warn('Character list container not found');
    return;
  }

  // Clear existing list
  listContainer.innerHTML = '';

  if (characters.length === 0) {
    listContainer.innerHTML = `
      <div class="character-list-empty">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <p>No characters yet.<br>Click "Add Character" to create one.</p>
      </div>
    `;
    return;
  }

  // Render character items
  characters.forEach(character => {
    const item = createCharacterItem(character);
    listContainer.appendChild(item);
  });
}

/**
 * Create a character list item element
 */
function createCharacterItem(character) {
  const item = document.createElement('div');
  item.className = 'character-item';
  if (character.id === selectedCharacterId) {
    item.classList.add('active');
  }

  const avatar = character.avatar
    ? `<img src="${character.avatar}" alt="${character.name}" />`
    : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
         <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
       </svg>`;

  const description = character.systemPrompt
    ? character.systemPrompt.substring(0, 40) + '...'
    : 'No description';

  item.innerHTML = `
    <div class="character-item-avatar">
      ${avatar}
    </div>
    <div class="character-item-info">
      <div class="character-item-name">${character.name}</div>
      <div class="character-item-desc">${description}</div>
    </div>
  `;

  item.addEventListener('click', () => selectCharacter(character.id));

  return item;
}

/**
 * Filter characters based on search query
 */
function filterCharacters(query) {
  const items = document.querySelectorAll('.character-item');
  const lowerQuery = query.toLowerCase();

  items.forEach(item => {
    const name = item.querySelector('.character-item-name').textContent.toLowerCase();
    const desc = item.querySelector('.character-item-desc').textContent.toLowerCase();

    if (name.includes(lowerQuery) || desc.includes(lowerQuery)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Select a character and show their card
 */
function selectCharacter(characterId) {
  selectedCharacterId = characterId;
  currentCharacter = characters.find(c => c.id === characterId);

  if (!currentCharacter) {
    console.error('Character not found:', characterId);
    return;
  }

  // Update active state in list
  document.querySelectorAll('.character-item').forEach(item => {
    item.classList.remove('active');
  });

  event.currentTarget?.classList.add('active');

  // Load character data into card
  loadCharacterData(currentCharacter);

  // Show the character card
  showCharacterCard();
}

/**
 * Show the character card
 */
function showCharacterCard(isNew = false) {
  const card = document.getElementById('character-card');
  const welcome = document.getElementById('character-welcome');

  if (!card || !welcome) {
    console.warn('Character card or welcome element not found');
    return;
  }

  if (isNew || !currentCharacter) {
    // Create a new blank character
    currentCharacter = {
      id: null,
      name: 'Character name',
      avatar: null,
      voice: '',
      globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.',
      systemPrompt: ''
    };
    loadCharacterData(currentCharacter);
  }

  // Hide welcome message and show card with animation
  welcome.classList.add('hidden');

  // Small delay to ensure smooth transition
  setTimeout(() => {
    card.classList.add('show');
  }, 50);
}

/**
 * Hide the character card
 */
function hideCharacterCard() {
  const card = document.getElementById('character-card');
  const welcome = document.getElementById('character-welcome');

  if (!card || !welcome) {
    return;
  }

  // Hide card and show welcome message
  card.classList.remove('show');

  setTimeout(() => {
    welcome.classList.remove('hidden');
  }, 300);

  // Reset current character and selection
  currentCharacter = null;
  selectedCharacterId = null;

  // Update active state in list
  document.querySelectorAll('.character-item').forEach(item => {
    item.classList.remove('active');
  });
}

/**
 * Load character data into the card form
 */
function loadCharacterData(character) {
  // Character name in header
  const nameDisplay = document.getElementById('character-name-display');
  if (nameDisplay) {
    nameDisplay.textContent = character.name;
  }

  // Character name input
  const nameInput = document.getElementById('character-name-input');
  if (nameInput) {
    nameInput.value = character.name;
  }

  // Avatar
  const headerAvatar = document.getElementById('header-avatar');
  const imageUploadArea = document.getElementById('image-upload-area');

  if (character.avatar) {
    if (headerAvatar) {
      headerAvatar.innerHTML = `<img src="${character.avatar}" alt="${character.name}" />`;
    }
    if (imageUploadArea) {
      imageUploadArea.innerHTML = `<img src="${character.avatar}" class="image-preview" alt="${character.name}" />`;
    }
  } else {
    if (headerAvatar) {
      headerAvatar.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      `;
    }
    if (imageUploadArea) {
      imageUploadArea.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>Click to upload image</span>
      `;
    }
  }

  // Global prompt
  const globalPromptInput = document.getElementById('character-global-prompt');
  if (globalPromptInput) {
    globalPromptInput.value = character.globalPrompt || '';
  }

  // System prompt
  const systemPromptInput = document.getElementById('character-system-prompt');
  if (systemPromptInput) {
    systemPromptInput.value = character.systemPrompt || '';
  }

  // Voice
  const voiceSelect = document.getElementById('character-voice');
  if (voiceSelect) {
    voiceSelect.value = character.voice || '';
  }
}

/**
 * Handle image upload
 */
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgUrl = event.target.result;

      // Update image upload area
      const imageUploadArea = document.getElementById('image-upload-area');
      if (imageUploadArea) {
        imageUploadArea.innerHTML = `<img src="${imgUrl}" class="image-preview" alt="Character image">`;
      }

      // Update header avatar
      const headerAvatar = document.getElementById('header-avatar');
      if (headerAvatar) {
        headerAvatar.innerHTML = `<img src="${imgUrl}" alt="Character avatar">`;
      }

      // Store in current character
      if (currentCharacter) {
        currentCharacter.avatar = imgUrl;
      }
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Switch between tabs
 */
function switchTab(tabName) {
  // Remove active class from all buttons and panels
  document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

  // Add active class to clicked button and corresponding panel
  const button = document.querySelector(`[data-tab="${tabName}"]`);
  const panel = document.getElementById(`${tabName}-panel`);

  if (button) button.classList.add('active');
  if (panel) panel.classList.add('active');

  // Show/hide image section based on tab
  const imageSection = document.getElementById('image-section');
  const contentSection = document.getElementById('content-section');

  if (tabName === 'profile') {
    imageSection?.classList.remove('hidden');
    contentSection?.classList.remove('full-width');
  } else {
    imageSection?.classList.add('hidden');
    contentSection?.classList.add('full-width');
  }
}

/**
 * Save character
 */
function saveCharacter() {
  if (!currentCharacter) {
    console.error('No character to save');
    return;
  }

  // Get form values
  const nameInput = document.getElementById('character-name-input');
  const globalPromptInput = document.getElementById('character-global-prompt');
  const systemPromptInput = document.getElementById('character-system-prompt');
  const voiceSelect = document.getElementById('character-voice');

  // Update character object
  currentCharacter.name = nameInput?.value || 'Character name';
  currentCharacter.globalPrompt = globalPromptInput?.value || '';
  currentCharacter.systemPrompt = systemPromptInput?.value || '';
  currentCharacter.voice = voiceSelect?.value || '';

  // If this is a new character (no ID), generate one
  if (!currentCharacter.id) {
    currentCharacter.id = generateId();
    characters.push(currentCharacter);
  } else {
    // Update existing character
    const index = characters.findIndex(c => c.id === currentCharacter.id);
    if (index !== -1) {
      characters[index] = currentCharacter;
    }
  }

  // Save to localStorage
  saveCharacters();

  // Re-render the character list
  renderCharacterList();

  // Show success message
  alert('Character saved successfully!');

  // Keep the card open so user can continue editing or switch to another character
  // hideCharacterCard();
}

/**
 * Delete character
 */
function deleteCharacter() {
  if (!currentCharacter || !currentCharacter.id) {
    console.error('No character to delete');
    return;
  }

  if (!confirm('Are you sure you want to delete this character?')) {
    return;
  }

  // Remove from array
  characters = characters.filter(c => c.id !== currentCharacter.id);

  // Save to localStorage
  saveCharacters();

  // Re-render the character list
  renderCharacterList();

  // Hide the card
  hideCharacterCard();
}

/**
 * Generate a unique ID
 */
function generateId() {
  return 'char_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Get all characters
 */
export function getCharacters() {
  return characters;
}

/**
 * Get selected character
 */
export function getSelectedCharacter() {
  return currentCharacter;
}
