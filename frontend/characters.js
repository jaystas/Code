// ===== Characters Page JavaScript =====

// Sample Character Data (this would typically come from a backend API)
const charactersData = [
  {
    id: 1,
    name: 'Luna',
    voice: 'Nova',
    image: 'https://i.pravatar.cc/100?img=1',
    systemPrompt: 'A wise and mystical oracle who speaks in riddles.',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  },
  {
    id: 2,
    name: 'Marcus',
    voice: 'Echo',
    image: 'https://i.pravatar.cc/100?img=3',
    systemPrompt: 'A battle-hardened warrior with a heart of gold.',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  },
  {
    id: 3,
    name: 'Aria',
    voice: 'Aria',
    image: 'https://i.pravatar.cc/100?img=5',
    systemPrompt: 'A cheerful bard who loves to tell stories.',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  },
  {
    id: 4,
    name: 'Zephyr',
    voice: 'Sage',
    image: 'https://i.pravatar.cc/100?img=8',
    systemPrompt: 'A mysterious traveler from distant lands.',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  },
  {
    id: 5,
    name: 'Nova',
    voice: 'Alloy',
    image: null,
    systemPrompt: 'An AI assistant learning about humanity.',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  },
  {
    id: 6,
    name: 'Ember',
    voice: 'Nova',
    image: 'https://i.pravatar.cc/100?img=9',
    systemPrompt: 'A fiery mage with explosive personality.',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  },
];

let selectedCharacterId = null;
let currentCharacterImage = null;

// DOM Element References - will be initialized in initializeCharactersPage()
let characterListItems;
let characterEmptyState;
let characterCardDetail;
let characterSearchInput;
let characterAddBtn;
let characterCardName;
let characterCardAvatar;
let characterCardCloseBtn;
let characterNameInput;
let characterVoiceSelect;
let characterSystemPrompt;
let characterGlobalPrompt;
let characterImageUploadArea;
let characterImageInput;
let characterImageSection;
let characterContentSection;
let characterAvatarEditBtn;
let characterDeleteBtn;
let characterChatBtn;
let characterSaveBtn;
let characterTabBtns;
let characterTabPanels;

// ===== Render Character List =====
function renderCharacterList(filter = '') {
  const filteredCharacters = charactersData.filter(character =>
    character.name.toLowerCase().includes(filter.toLowerCase())
  );

  characterListItems.innerHTML = filteredCharacters.map(character => `
    <div class="character-list-item ${character.id === selectedCharacterId ? 'active' : ''}" data-character-id="${character.id}">
      <div class="character-item-avatar">
        ${character.image
          ? `<img src="${character.image}" alt="${character.name}">`
          : `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>`
        }
      </div>
      <div class="character-item-info">
        <div class="character-item-name">${character.name}</div>
        <div class="character-item-meta">
          <span class="character-item-voice">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            ${character.voice}
          </span>
        </div>
      </div>
      <button class="character-quick-chat-btn" data-action="chat" title="Quick chat">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  `).join('');

  // Add click event listeners to character items
  document.querySelectorAll('.character-list-item').forEach(item => {
    item.addEventListener('click', (e) => {
      // Handle quick chat button separately
      if (e.target.closest('.character-quick-chat-btn')) {
        e.stopPropagation();
        const characterId = parseInt(item.dataset.characterId);
        handleQuickChat(characterId);
        return;
      }
      // Select character
      selectCharacter(parseInt(item.dataset.characterId));
    });
  });
}

// ===== Select Character =====
function selectCharacter(characterId) {
  selectedCharacterId = characterId;
  const character = charactersData.find(c => c.id === characterId);

  if (character) {
    // Show card, hide empty state
    characterEmptyState.style.display = 'none';
    characterCardDetail.classList.add('visible');

    // Populate character card
    characterCardName.textContent = character.name;
    characterNameInput.value = character.name;
    characterVoiceSelect.value = character.voice?.toLowerCase() || '';
    characterSystemPrompt.value = character.systemPrompt || '';
    characterGlobalPrompt.value = character.globalPrompt || '';
    currentCharacterImage = character.image;

    // Update avatars
    updateAvatarDisplay(character.image, character.name);

    // Re-render list to update active state
    renderCharacterList(characterSearchInput.value);

    // Reset to profile tab
    resetToProfileTab();
  }
}

// ===== Update Avatar Display =====
function updateAvatarDisplay(imageUrl, characterName) {
  if (imageUrl) {
    characterCardAvatar.innerHTML = `<img src="${imageUrl}" alt="${characterName}">`;
    characterImageUploadArea.innerHTML = `<img src="${imageUrl}" alt="${characterName}" class="character-image-preview">`;
  } else {
    characterCardAvatar.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    `;
    characterImageUploadArea.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>Click to upload image</span>
    `;
  }
}

// ===== Reset to Profile Tab =====
function resetToProfileTab() {
  characterTabBtns.forEach(btn => btn.classList.remove('active'));
  characterTabPanels.forEach(panel => panel.classList.remove('active'));

  characterTabBtns[0].classList.add('active');
  characterTabPanels[0].classList.add('active');

  characterImageSection.classList.remove('hidden');
  characterContentSection.classList.remove('full-width');
}

// ===== Close Character Card =====
function closeCharacterCard() {
  selectedCharacterId = null;
  currentCharacterImage = null;
  characterCardDetail.classList.remove('visible');
  characterEmptyState.style.display = 'block';
  renderCharacterList(characterSearchInput.value);
}

// ===== Handle Quick Chat =====
function handleQuickChat(characterId) {
  const character = charactersData.find(c => c.id === characterId);
  console.log('Quick chat with character:', character.name);
  // TODO: Implement navigation to chat interface
}

// ===== Search Characters =====
function handleCharacterSearch(event) {
  renderCharacterList(event.target.value);
}

// ===== Add New Character =====
function addNewCharacter() {
  const newId = Math.max(...charactersData.map(c => c.id), 0) + 1;
  const newCharacter = {
    id: newId,
    name: 'New Character',
    voice: '',
    image: null,
    systemPrompt: '',
    globalPrompt: 'You are {character.name}, a roleplay actor engaging in a conversation with {user.name}. Your replies should be written in a conversational format, taking on the personality and characteristics of {character.name}.'
  };
  charactersData.push(newCharacter);
  renderCharacterList(characterSearchInput.value);
  selectCharacter(newId);
}

// ===== Tab Switching =====
function handleTabSwitch(event) {
  const tabButton = event.target.closest('.character-tab-btn');
  if (!tabButton) return;

  // Remove active class from all tabs
  characterTabBtns.forEach(btn => btn.classList.remove('active'));
  characterTabPanels.forEach(panel => panel.classList.remove('active'));

  // Add active class to clicked tab
  tabButton.classList.add('active');
  const tabId = tabButton.getAttribute('data-tab');
  const panel = document.getElementById(`character-${tabId}-panel`);
  if (panel) panel.classList.add('active');

  // Show/hide image section based on tab
  if (tabId === 'profile') {
    characterImageSection.classList.remove('hidden');
    characterContentSection.classList.remove('full-width');
  } else {
    characterImageSection.classList.add('hidden');
    characterContentSection.classList.add('full-width');
  }
}

// ===== Character Name Sync =====
function handleNameInputChange(event) {
  const newName = event.target.value || 'Character Name';
  characterCardName.textContent = newName;
}

// ===== Image Upload =====
function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      currentCharacterImage = imageUrl;
      updateAvatarDisplay(imageUrl, characterNameInput.value);
    };
    reader.readAsDataURL(file);
  }
}

function triggerImageUpload() {
  characterImageInput.click();
}

// ===== Save Character =====
function saveCharacter() {
  const character = charactersData.find(c => c.id === selectedCharacterId);
  if (character) {
    character.name = characterNameInput.value;
    character.voice = characterVoiceSelect.value;
    character.systemPrompt = characterSystemPrompt.value;
    character.globalPrompt = characterGlobalPrompt.value;
    character.image = currentCharacterImage;

    renderCharacterList(characterSearchInput.value);
    alert('Character saved successfully!');
  }
}

// ===== Delete Character =====
function deleteCharacter() {
  if (confirm('Are you sure you want to delete this character?')) {
    const index = charactersData.findIndex(c => c.id === selectedCharacterId);
    if (index > -1) {
      charactersData.splice(index, 1);
      closeCharacterCard();
    }
  }
}

// ===== Start Chat with Character =====
function startChat() {
  const character = charactersData.find(c => c.id === selectedCharacterId);
  console.log('Starting chat with character:', character.name);
  // TODO: Implement navigation to chat interface
}

// ===== Event Listeners Setup =====
function initializeCharactersPage() {
  console.log('initializeCharactersPage called');

  // Initialize all DOM element references
  characterListItems = document.getElementById('characterListItems');
  characterEmptyState = document.getElementById('characterEmptyState');
  characterCardDetail = document.getElementById('characterCardDetail');
  characterSearchInput = document.getElementById('characterSearchInput');
  characterAddBtn = document.getElementById('characterAddBtn');
  characterCardName = document.getElementById('characterCardName');
  characterCardAvatar = document.getElementById('characterCardAvatar');
  characterCardCloseBtn = document.getElementById('characterCardCloseBtn');
  characterNameInput = document.getElementById('characterNameInput');
  characterVoiceSelect = document.getElementById('characterVoiceSelect');
  characterSystemPrompt = document.getElementById('characterSystemPrompt');
  characterGlobalPrompt = document.getElementById('characterGlobalPrompt');
  characterImageUploadArea = document.getElementById('characterImageUploadArea');
  characterImageInput = document.getElementById('characterImageInput');
  characterImageSection = document.getElementById('characterImageSection');
  characterContentSection = document.getElementById('characterContentSection');
  characterAvatarEditBtn = document.getElementById('characterAvatarEditBtn');
  characterDeleteBtn = document.getElementById('characterDeleteBtn');
  characterChatBtn = document.getElementById('characterChatBtn');
  characterSaveBtn = document.getElementById('characterSaveBtn');
  characterTabBtns = document.querySelectorAll('.character-tab-btn');
  characterTabPanels = document.querySelectorAll('.character-tab-panel');

  console.log('DOM elements initialized:');
  console.log('- characterSearchInput:', characterSearchInput);
  console.log('- characterAddBtn:', characterAddBtn);
  console.log('- characterListItems:', characterListItems);
  console.log('- characterTabBtns count:', characterTabBtns.length);

  // Search
  if (characterSearchInput) {
    characterSearchInput.addEventListener('input', handleCharacterSearch);
    console.log('Search listener added');
  } else {
    console.error('characterSearchInput element not found');
  }

  // Add character button
  if (characterAddBtn) {
    characterAddBtn.addEventListener('click', addNewCharacter);
    console.log('Add character button listener added');
  } else {
    console.error('characterAddBtn element not found');
  }

  // Close button
  if (characterCardCloseBtn) {
    characterCardCloseBtn.addEventListener('click', closeCharacterCard);
  }

  // Tab switching
  characterTabBtns.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });

  // Character name input
  if (characterNameInput) {
    characterNameInput.addEventListener('input', handleNameInputChange);
  }

  // Image upload
  if (characterImageInput) {
    characterImageInput.addEventListener('change', handleImageUpload);
  }

  if (characterImageSection) {
    characterImageSection.addEventListener('click', triggerImageUpload);
  }

  if (characterAvatarEditBtn) {
    characterAvatarEditBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerImageUpload();
    });
  }

  // Footer buttons
  if (characterSaveBtn) {
    characterSaveBtn.addEventListener('click', saveCharacter);
  }

  if (characterDeleteBtn) {
    characterDeleteBtn.addEventListener('click', deleteCharacter);
  }

  if (characterChatBtn) {
    characterChatBtn.addEventListener('click', startChat);
  }

  // Prevent form submission on Enter (except in textareas)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA' && e.target.closest('.characters-page-container')) {
      e.preventDefault();
    }
  });

  // Initial render
  console.log('Rendering initial character list...');
  renderCharacterList();
  console.log('Characters page fully initialized!');
}

// Export the initialization function as default
export default initializeCharactersPage;

// Export other functions for use in other modules if needed
export {
  renderCharacterList,
  selectCharacter,
  addNewCharacter,
  charactersData
};
