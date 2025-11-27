/**
 * characters.js - Characters page functionality
 * Handles character creation, editing, and management
 */

// State management
let characters = [];
let currentCharacter = null;
let editingCharacterId = null;

/**
 * Initialize the characters page
 */
export function initCharactersPage() {
  console.log('Initializing characters page...');

  // Load saved characters from localStorage
  loadCharacters();

  // Setup event listeners
  setupEventListeners();

  // Render character list
  renderCharacterList();
}

/**
 * Load characters from localStorage
 */
function loadCharacters() {
  const savedCharacters = localStorage.getItem('aiChat_characters');
  if (savedCharacters) {
    try {
      characters = JSON.parse(savedCharacters);
      console.log(`Loaded ${characters.length} characters`);
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
  try {
    localStorage.setItem('aiChat_characters', JSON.stringify(characters));
    console.log('Characters saved successfully');
  } catch (e) {
    console.error('Error saving characters:', e);
  }
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // New character button
  const newCharBtn = document.getElementById('newCharacterBtn');
  if (newCharBtn) {
    newCharBtn.addEventListener('click', openNewCharacterModal);
  }

  // Close button
  const closeBtn = document.getElementById('closeBtn');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Modal overlay click (close on outside click)
  const modalOverlay = document.getElementById('characterCardModalOverlay');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });
  }

  // Tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', handleTabSwitch);
  });

  // Image upload
  const imageSection = document.getElementById('imageSection');
  const imageInput = document.getElementById('imageInput');
  const avatarEditBtn = document.getElementById('avatarEditBtn');

  if (imageSection && imageInput) {
    imageSection.addEventListener('click', () => {
      imageInput.click();
    });

    imageInput.addEventListener('change', handleImageUpload);
  }

  if (avatarEditBtn && imageInput) {
    avatarEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageInput.click();
    });
  }

  // Character name input
  const characterNameInput = document.getElementById('characterNameInput');
  if (characterNameInput) {
    characterNameInput.addEventListener('input', handleNameChange);
  }

  // Footer buttons
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const chatBtn = document.getElementById('chatBtn');

  if (saveBtn) {
    saveBtn.addEventListener('click', saveCharacter);
  }

  if (deleteBtn) {
    deleteBtn.addEventListener('click', deleteCharacter);
  }

  if (chatBtn) {
    chatBtn.addEventListener('click', openChat);
  }

  // Prevent form submission on Enter
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  });
}

/**
 * Open modal for new character
 */
function openNewCharacterModal() {
  console.log('Opening new character modal');

  // Reset current character state
  editingCharacterId = null;
  currentCharacter = {
    id: Date.now().toString(),
    name: 'Character name',
    image: null,
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.',
    systemPrompt: '',
    voice: '',
    createdAt: new Date().toISOString()
  };

  // Reset form
  resetForm();

  // Show modal
  showModal();
}

/**
 * Open modal to edit existing character
 */
function openEditCharacterModal(characterId) {
  console.log('Opening edit character modal for ID:', characterId);

  const character = characters.find(c => c.id === characterId);
  if (!character) {
    console.error('Character not found:', characterId);
    return;
  }

  editingCharacterId = characterId;
  currentCharacter = { ...character };

  // Populate form with character data
  populateForm(character);

  // Show modal
  showModal();
}

/**
 * Show the modal with animation
 */
function showModal() {
  const modalOverlay = document.getElementById('characterCardModalOverlay');
  if (modalOverlay) {
    // Force reflow to ensure animation works
    modalOverlay.offsetHeight;
    modalOverlay.classList.add('show');
  }
}

/**
 * Close the modal
 */
function closeModal() {
  console.log('Closing modal');

  const modalOverlay = document.getElementById('characterCardModalOverlay');
  if (modalOverlay) {
    modalOverlay.classList.remove('show');
  }

  // Reset after animation completes
  setTimeout(() => {
    resetForm();
    currentCharacter = null;
    editingCharacterId = null;
  }, 300);
}

/**
 * Reset form to default state
 */
function resetForm() {
  // Reset name
  const characterNameInput = document.getElementById('characterNameInput');
  const characterNameHeader = document.getElementById('characterName');
  if (characterNameInput) {
    characterNameInput.value = 'Character name';
  }
  if (characterNameHeader) {
    characterNameHeader.textContent = 'Character name';
  }

  // Reset image
  const imageUploadArea = document.getElementById('imageUploadArea');
  const headerAvatar = document.getElementById('headerAvatar');

  if (imageUploadArea) {
    imageUploadArea.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>Click to upload image</span>
    `;
  }

  if (headerAvatar) {
    headerAvatar.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    `;
  }

  // Reset textareas
  const globalPrompt = document.getElementById('globalPrompt');
  const systemPrompt = document.getElementById('systemPrompt');
  if (globalPrompt) {
    globalPrompt.value = 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.';
  }
  if (systemPrompt) {
    systemPrompt.value = '';
  }

  // Reset voice select
  const voiceSelect = document.getElementById('voiceSelect');
  if (voiceSelect) {
    voiceSelect.selectedIndex = 0;
  }

  // Reset to profile tab
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');
  const imageSection = document.getElementById('imageSection');
  const contentSection = document.getElementById('contentSection');

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanels.forEach(panel => panel.classList.remove('active'));

  const profileTab = document.querySelector('[data-tab="profile"]');
  const profilePanel = document.getElementById('profile-panel');

  if (profileTab) profileTab.classList.add('active');
  if (profilePanel) profilePanel.classList.add('active');
  if (imageSection) imageSection.classList.remove('hidden');
  if (contentSection) contentSection.classList.remove('full-width');
}

/**
 * Populate form with character data
 */
function populateForm(character) {
  // Set name
  const characterNameInput = document.getElementById('characterNameInput');
  const characterNameHeader = document.getElementById('characterName');
  if (characterNameInput) {
    characterNameInput.value = character.name;
  }
  if (characterNameHeader) {
    characterNameHeader.textContent = character.name;
  }

  // Set image
  if (character.image) {
    const imageUploadArea = document.getElementById('imageUploadArea');
    const headerAvatar = document.getElementById('headerAvatar');

    if (imageUploadArea) {
      imageUploadArea.innerHTML = `<img src="${character.image}" class="image-preview" alt="Character image">`;
    }
    if (headerAvatar) {
      headerAvatar.innerHTML = `<img src="${character.image}" alt="Character avatar">`;
    }
  }

  // Set textareas
  const globalPrompt = document.getElementById('globalPrompt');
  const systemPrompt = document.getElementById('systemPrompt');
  if (globalPrompt && character.globalPrompt) {
    globalPrompt.value = character.globalPrompt;
  }
  if (systemPrompt && character.systemPrompt) {
    systemPrompt.value = character.systemPrompt;
  }

  // Set voice
  const voiceSelect = document.getElementById('voiceSelect');
  if (voiceSelect && character.voice) {
    voiceSelect.value = character.voice;
  }
}

/**
 * Handle tab switching
 */
function handleTabSwitch(e) {
  const button = e.currentTarget;
  const tabId = button.getAttribute('data-tab');

  // Remove active class from all buttons and panels
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabPanels.forEach(panel => panel.classList.remove('active'));

  // Add active class to clicked button and corresponding panel
  button.classList.add('active');
  const panel = document.getElementById(`${tabId}-panel`);
  if (panel) {
    panel.classList.add('active');
  }

  // Show/hide image section based on tab
  const imageSection = document.getElementById('imageSection');
  const contentSection = document.getElementById('contentSection');

  if (tabId === 'profile') {
    if (imageSection) imageSection.classList.remove('hidden');
    if (contentSection) contentSection.classList.remove('full-width');
  } else {
    if (imageSection) imageSection.classList.add('hidden');
    if (contentSection) contentSection.classList.add('full-width');
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

      // Update current character
      if (currentCharacter) {
        currentCharacter.image = imgUrl;
      }

      // Update main image section
      const imageUploadArea = document.getElementById('imageUploadArea');
      if (imageUploadArea) {
        imageUploadArea.innerHTML = `<img src="${imgUrl}" class="image-preview" alt="Character image">`;
      }

      // Update header avatar
      const headerAvatar = document.getElementById('headerAvatar');
      if (headerAvatar) {
        headerAvatar.innerHTML = `<img src="${imgUrl}" alt="Character avatar">`;
      }
    };
    reader.readAsDataURL(file);
  }
}

/**
 * Handle character name change
 */
function handleNameChange(e) {
  const name = e.target.value || 'Character name';

  // Update header
  const characterNameHeader = document.getElementById('characterName');
  if (characterNameHeader) {
    characterNameHeader.textContent = name;
  }

  // Update current character
  if (currentCharacter) {
    currentCharacter.name = name;
  }
}

/**
 * Save character
 */
function saveCharacter() {
  console.log('Saving character...');

  if (!currentCharacter) {
    console.error('No character to save');
    return;
  }

  // Get form values
  const characterNameInput = document.getElementById('characterNameInput');
  const globalPrompt = document.getElementById('globalPrompt');
  const systemPrompt = document.getElementById('systemPrompt');
  const voiceSelect = document.getElementById('voiceSelect');

  currentCharacter.name = characterNameInput?.value || 'Character name';
  currentCharacter.globalPrompt = globalPrompt?.value || '';
  currentCharacter.systemPrompt = systemPrompt?.value || '';
  currentCharacter.voice = voiceSelect?.value || '';
  currentCharacter.updatedAt = new Date().toISOString();

  // Check if editing or creating new
  if (editingCharacterId) {
    // Update existing character
    const index = characters.findIndex(c => c.id === editingCharacterId);
    if (index !== -1) {
      characters[index] = currentCharacter;
      console.log('Character updated:', currentCharacter.name);
    }
  } else {
    // Add new character
    characters.push(currentCharacter);
    console.log('Character created:', currentCharacter.name);
  }

  // Save to localStorage
  saveCharacters();

  // Re-render character list
  renderCharacterList();

  // Show success message
  showNotification('Character saved successfully!');

  // Close modal
  setTimeout(() => {
    closeModal();
  }, 500);
}

/**
 * Delete character
 */
function deleteCharacter() {
  if (!editingCharacterId) {
    console.log('Cannot delete unsaved character');
    closeModal();
    return;
  }

  if (confirm('Are you sure you want to delete this character?')) {
    console.log('Deleting character:', editingCharacterId);

    // Remove from array
    characters = characters.filter(c => c.id !== editingCharacterId);

    // Save to localStorage
    saveCharacters();

    // Re-render character list
    renderCharacterList();

    // Show notification
    showNotification('Character deleted successfully!');

    // Close modal
    closeModal();
  }
}

/**
 * Open chat with character
 */
function openChat() {
  console.log('Opening chat with character...');
  // TODO: Implement chat functionality
  showNotification('Chat functionality coming soon!');
}

/**
 * Render character list in carousel
 */
function renderCharacterList() {
  const carousel = document.getElementById('characterCarousel');
  if (!carousel) {
    console.warn('Character carousel not found');
    return;
  }

  // Clear existing items
  carousel.innerHTML = '';

  if (characters.length === 0) {
    carousel.innerHTML = `
      <div style="text-align: center; color: var(--char-muted); padding: 2rem;">
        <p>No characters yet</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">Click the + button to create your first character</p>
      </div>
    `;
    return;
  }

  // Render each character
  characters.forEach(character => {
    const item = document.createElement('div');
    item.className = 'character-carousel-item';
    item.dataset.characterId = character.id;

    if (character.image) {
      item.innerHTML = `<img src="${character.image}" alt="${character.name}">`;
    } else {
      item.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--char-input-bg);">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width: 48px; height: 48px; color: var(--char-muted);">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
      `;
    }

    // Add click event to open character modal
    item.addEventListener('click', () => {
      openEditCharacterModal(character.id);
    });

    carousel.appendChild(item);
  });
}

/**
 * Show notification
 */
function showNotification(message) {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: var(--char-primary);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      notification.remove();
      style.remove();
    }, 300);
  }, 3000);
}

// Export functions for use in main.js
window.initCharactersPage = initCharactersPage;
