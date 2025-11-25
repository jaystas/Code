// ============================================
// INTERFACE - Core UI Management (Procedural)
// ============================================

// ========== State Variables ==========
let currentRoute = 'home';
let messagesArea = null;
let activeTranscription = null;
let currentResponseElements = new Map();
let isResponding = false;

// Settings state
let settingsDrawer = null;
let modelSelect = null;
let availableModels = [];
let currentModel = '';
let isLoadingModels = false;

// Drawer state
let charactersDrawer = null;
let charactersDrawerToggle = null;
let settingsDrawerToggle = null;

// Voice/microphone state
let isMicActive = false;

// ========== DOM Element Cache ==========
let sidebar = null;
let collapseBtn = null;
let searchInput = null;
let navLinks = [];
let tabPanels = [];
let contentArea = null;

// Chat UI elements
let chatTextArea = null;
let sendButton = null;
let voiceButton = null;
let wsIndicator = null;

// ========== Navigation Functions ==========
function navigateToRoute(route) {
  if (currentRoute === route) return;

  currentRoute = route;

  // Update nav links
  navLinks.forEach(link => {
    const linkRoute = link.getAttribute('data-route');
    if (linkRoute === route) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update tab panels
  tabPanels.forEach(panel => {
    const panelRoute = panel.getAttribute('data-route');
    if (panelRoute === route) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  // Update drawer visibility based on route
  updateDrawerVisibility(route);

  console.log('Navigated to:', route);
}

function updateDrawerVisibility(route) {
  const onHome = route === 'home';

  // Settings drawer (right side)
  if (settingsDrawer && settingsDrawerToggle) {
    settingsDrawer.style.display = onHome ? '' : 'none';
    settingsDrawerToggle.style.display = onHome ? '' : 'none';
    if (!onHome) {
      settingsDrawer.classList.remove('open');
      settingsDrawer.setAttribute('aria-hidden', 'true');
      settingsDrawerToggle.setAttribute('aria-expanded', 'false');
    }
  }

  // Characters drawer (bottom sheet)
  if (charactersDrawer && charactersDrawerToggle) {
    charactersDrawer.style.display = onHome ? '' : 'none';
    charactersDrawerToggle.style.display = onHome ? '' : 'none';
    if (!onHome) {
      charactersDrawer.classList.remove('open');
      charactersDrawer.setAttribute('aria-hidden', 'true');
      charactersDrawerToggle.setAttribute('aria-expanded', 'false');
    }
  }
}

function handleHashChange() {
  const hash = window.location.hash.slice(1);
  const route = hash.replace(/^\//, '') || 'home';
  navigateToRoute(route);
}

// ========== Chat UI Functions ==========
function addUserMessage(text) {
  if (!text || !text.trim() || !messagesArea) return;

  const container = document.createElement('div');
  container.className = 'chat-line user is-final';

  const textEl = document.createElement('div');
  textEl.className = 'chat-text';
  textEl.textContent = text;

  container.appendChild(textEl);
  messagesArea.appendChild(container);
  activeTranscription = null;
  scrollToBottom();
}

function addTranscriptionPreview(text, stabilized = false) {
  if (!messagesArea) return;

  if (!text || !text.trim()) {
    if (activeTranscription) {
      activeTranscription.remove();
      activeTranscription = null;
    }
    return;
  }

  if (!activeTranscription) {
    activeTranscription = document.createElement('div');
    activeTranscription.className = 'chat-line user';
    const textEl = document.createElement('div');
    textEl.className = 'chat-text';
    activeTranscription.appendChild(textEl);
    messagesArea.appendChild(activeTranscription);
  }

  const textEl = activeTranscription.querySelector('.chat-text');
  textEl.textContent = text;
  activeTranscription.dataset.state = stabilized ? 'stabilized' : 'listening';
  scrollToBottom();
}

function finalizeTranscription(text) {
  if (!text || !text.trim() || !messagesArea) return;

  if (activeTranscription) {
    const textEl = activeTranscription.querySelector('.chat-text');
    textEl.textContent = text;
    activeTranscription.classList.add('is-final');
    activeTranscription.dataset.state = 'final';
    activeTranscription = null;
  } else {
    addUserMessage(text);
  }

  scrollToBottom();
}

function startCharacterResponse(character = {}) {
  if (!character || !character.id || !messagesArea) return;

  // Remove existing response for this character
  if (currentResponseElements.has(character.id)) {
    const existing = currentResponseElements.get(character.id);
    if (existing && existing.element && existing.element.isConnected) {
      existing.element.remove();
    }
    currentResponseElements.delete(character.id);
  }

  const container = document.createElement('div');
  container.className = 'chat-line character';
  container.dataset.characterId = character.id;

  const avatarWrapper = document.createElement('div');
  avatarWrapper.className = 'chat-avatar';
  const avatar = document.createElement('img');
  avatar.src = character.image_url || 'https://images.unsplash.com/photo-1512438289556-4b95344d9f67?q=80&w=400&auto=format&fit=crop';
  avatar.alt = character.name || 'Character';
  avatarWrapper.appendChild(avatar);

  const body = document.createElement('div');
  body.className = 'chat-body';

  const nameEl = document.createElement('div');
  nameEl.className = 'character-name';
  nameEl.textContent = character.name || 'Character';

  const textEl = document.createElement('div');
  textEl.className = 'chat-text';

  const indicator = document.createElement('div');
  indicator.className = 'typing-indicator';
  indicator.innerHTML = '<span></span><span></span><span></span>';

  body.appendChild(nameEl);
  body.appendChild(textEl);
  body.appendChild(indicator);

  container.appendChild(avatarWrapper);
  container.appendChild(body);

  messagesArea.appendChild(container);

  currentResponseElements.set(character.id, {
    element: container,
    textEl,
    typingIndicator: indicator
  });

  isResponding = true;
  scrollToBottom();
}

function addCharacterResponseChunk(character = {}, chunk = '', fullText = '') {
  if (!character || !character.id) return;

  if (!currentResponseElements.has(character.id)) {
    startCharacterResponse(character);
  }

  const responseData = currentResponseElements.get(character.id);
  if (!responseData) return;

  const text = fullText || chunk || '';
  responseData.textEl.innerHTML = formatMarkdown(text);
  scrollToBottom();
}

function completeCharacterResponse(character = {}, finalText = '') {
  if (!character || !character.id) return;

  const responseData = currentResponseElements.get(character.id);
  if (!responseData) return;

  if (finalText) {
    responseData.textEl.innerHTML = formatMarkdown(finalText);
  }

  if (responseData.typingIndicator) {
    responseData.typingIndicator.remove();
  }

  currentResponseElements.delete(character.id);

  if (currentResponseElements.size === 0) {
    isResponding = false;
  }

  scrollToBottom();
}

function clearMessages() {
  if (messagesArea) {
    messagesArea.innerHTML = '';
  }
  currentResponseElements.clear();
  activeTranscription = null;
  isResponding = false;
}

function showError(message) {
  if (!messagesArea) return;

  const errorEl = document.createElement('div');
  errorEl.className = 'chat-line error';
  const textEl = document.createElement('div');
  textEl.className = 'chat-text';
  textEl.textContent = `Error: ${message}`;
  errorEl.appendChild(textEl);
  messagesArea.appendChild(errorEl);
  scrollToBottom();
}

function formatMarkdown(text) {
  if (!text) return '';

  const escapedText = escapeHtml(text);
  let formatted = escapedText.replace(/\*\*(.*?)\*\*/g, '<span class="strong">$1</span>');
  formatted = formatted.replace(/\*(.*?)\*/g, '<span class="em">$1</span>');
  return formatted;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function scrollToBottom() {
  if (messagesArea) {
    messagesArea.scrollTop = messagesArea.scrollHeight;
  }
}

// ========== UI State Functions ==========
function setVoiceButtonState(active) {
  if (!voiceButton) return;
  voiceButton.setAttribute('aria-pressed', active ? 'true' : 'false');
  voiceButton.classList.toggle('is-listening', active);
  if (!active) {
    voiceButton.classList.remove('is-recording');
  }
}

function setConnectionIndicator(connected) {
  if (wsIndicator) {
    wsIndicator.classList.toggle('connected', connected);
  }
}

// ========== Sidebar Functions ==========
function initSidebar() {
  sidebar = document.getElementById('sidebar');
  collapseBtn = document.getElementById('collapseBtn');

  if (sidebar && collapseBtn) {
    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });
  }
}

function initSearch() {
  searchInput = document.getElementById('searchInput');
  if (searchInput) {
    // Keyboard shortcut (Cmd+K / Ctrl+K)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      console.log('Search query:', query);
    });
  }
}

// ========== Navigation Setup ==========
function initNavigation() {
  navLinks = Array.from(document.querySelectorAll('.nav-link'));
  tabPanels = Array.from(document.querySelectorAll('.tab-panel'));
  contentArea = document.getElementById('content-area');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.getAttribute('data-route');
      window.location.hash = `/${route}`;
    });
  });

  // Handle hash changes
  window.addEventListener('hashchange', handleHashChange);

  // Initial navigation
  handleHashChange();
}

// ========== Chat Editor Functions ==========
function initChatEditor() {
  messagesArea = document.getElementById('messages-area');
  chatTextArea = document.getElementById('chatTextArea');
  sendButton = document.getElementById('sendButton');
  voiceButton = document.getElementById('voiceButton');
  wsIndicator = document.getElementById('wsIndicator');

  // Send button
  if (sendButton && chatTextArea) {
    sendButton.addEventListener('click', handleSendMessage);

    // Enter key to send
    chatTextArea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !isResponding) {
        e.preventDefault();
        handleSendMessage();
      }
    });
  }

  // Voice button
  if (voiceButton) {
    voiceButton.addEventListener('click', handleVoiceButtonClick);
  }

  initPromptsDropdown();
  initModelsDropdown();
}

function handleSendMessage() {
  if (!chatTextArea) return;

  const text = chatTextArea.value.trim();
  if (text) {
    addUserMessage(text);
    chatTextArea.value = '';

    // Send via WebSocket
    sendChatMessage(text);
  }
}

function handleVoiceButtonClick() {
  toggleMicrophone();
}

// ========== Dropdown Functions ==========
function initPromptsDropdown() {
  const promptsButton = document.getElementById('promptsButton');
  const promptsMenu = document.getElementById('promptsMenu');

  if (!promptsButton || !promptsMenu) return;

  // Toggle menu
  promptsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = promptsMenu.style.display !== 'none';
    promptsMenu.style.display = isOpen ? 'none' : 'block';
    promptsButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // Handle prompt selection
  promptsMenu.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.menu-item');
    if (menuItem && chatTextArea) {
      const promptText = menuItem.getAttribute('data-prompt');
      if (promptText) {
        chatTextArea.value = promptText + chatTextArea.value;
        chatTextArea.focus();
      }
      promptsMenu.style.display = 'none';
      promptsButton.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on outside click
  document.addEventListener('click', () => {
    promptsMenu.style.display = 'none';
    promptsButton.setAttribute('aria-expanded', 'false');
  });
}

function initModelsDropdown() {
  const modelsButton = document.getElementById('modelsButton');
  const modelsMenu = document.getElementById('modelsMenu');
  const modelsButtonLabel = document.getElementById('modelsButtonLabel');

  if (!modelsButton || !modelsMenu) return;

  // Toggle menu
  modelsButton.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = modelsMenu.style.display !== 'none';
    modelsMenu.style.display = isOpen ? 'none' : 'block';
    modelsButton.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
  });

  // Handle model selection
  modelsMenu.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.menu-item');
    if (menuItem && modelsButtonLabel) {
      const modelName = menuItem.textContent.trim();
      modelsButtonLabel.textContent = modelName;
      modelsMenu.style.display = 'none';
      modelsButton.setAttribute('aria-expanded', 'false');
    }
  });

  // Close on outside click
  document.addEventListener('click', () => {
    modelsMenu.style.display = 'none';
    modelsButton.setAttribute('aria-expanded', 'false');
  });
}

// ========== Settings Drawer Functions ==========
function initSettingsDrawer() {
  settingsDrawer = document.getElementById('settingsDrawer');
  settingsDrawerToggle = document.getElementById('settingsDrawerToggle');
  modelSelect = document.getElementById('modelSelect');

  if (!settingsDrawer || !settingsDrawerToggle) return;

  // Toggle drawer
  const updateTogglePosition = () => {
    const isOpen = settingsDrawer.classList.contains('open');
    if (isOpen) {
      const width = settingsDrawer.getBoundingClientRect().width;
      settingsDrawerToggle.style.right = `${width + 12}px`;
    } else {
      settingsDrawerToggle.style.right = '12px';
    }
  };

  const setOpen = (open) => {
    settingsDrawer.classList.toggle('open', open);
    settingsDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    settingsDrawerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    updateTogglePosition();
  };

  settingsDrawerToggle.addEventListener('click', () => {
    const isOpen = settingsDrawer.classList.contains('open');
    setOpen(!isOpen);
  });

  // Tab switching
  const tabButtons = settingsDrawer.querySelectorAll('.drawer-tab');
  const tabsWrap = settingsDrawer.querySelector('.drawer-tabs');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;

      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const targetId = btn.getAttribute('data-target');
      const panels = settingsDrawer.querySelectorAll('.drawer-panel');
      panels.forEach(p => p.classList.remove('active'));
      const target = settingsDrawer.querySelector('#' + targetId);
      if (target) target.classList.add('active');

      if (tabsWrap) tabsWrap.classList.toggle('tab-speech', targetId === 'drawer-panel-speech');
    });
  });

  // Model select
  if (modelSelect) {
    modelSelect.addEventListener('change', handleModelSelectChange);
    modelSelect.disabled = true;
    modelSelect.innerHTML = '<option value="">Loading models...</option>';
  }

  // Load models from API
  refreshModelOptions().catch(error => {
    console.error('Error loading model list:', error);
  });

  // Initialize sliders and toggles
  initParameterSliders();
  initSpeechSliders();
  initTTSToggles();

  window.addEventListener('resize', updateTogglePosition);
  updateTogglePosition();
}

function initParameterSliders() {
  if (!settingsDrawer) return;

  const parameterSliders = [
    'temperature',
    'topP',
    'minP',
    'topK',
    'frequencyPenalty',
    'presencePenalty',
    'repetitionPenalty'
  ];

  parameterSliders.forEach(paramName => {
    const slider = settingsDrawer.querySelector(`#${paramName}`);
    const valueDisplay = settingsDrawer.querySelector(`#${paramName}Value`);

    if (slider && valueDisplay) {
      const updateValue = () => {
        const value = parseFloat(slider.value);
        const step = slider.step || '1';
        const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
        valueDisplay.textContent = value.toFixed(decimals);
      };

      updateValue();
      slider.addEventListener('input', updateValue);
    }
  });
}

function initSpeechSliders() {
  if (!settingsDrawer) return;

  const setProgress = (slider) => {
    const min = parseFloat(slider.min || 0);
    const max = parseFloat(slider.max || 1);
    const val = parseFloat(slider.value || 0);
    const pct = ((val - min) / (max - min)) * 100;
    slider.style.setProperty('--progress', `${pct}%`);

    const label = document.getElementById(`${slider.id}-value`);
    if (label) {
      const step = slider.step || '1';
      const decimals = String(step).includes('.') ? String(step).split('.')[1].length : 0;
      label.textContent = isFinite(val) ? val.toFixed(decimals) : String(val);
    }
  };

  settingsDrawer.querySelectorAll('.speech-slider').forEach(slider => {
    setProgress(slider);
    slider.addEventListener('input', () => {
      setProgress(slider);
    });
  });
}

function initTTSToggles() {
  if (!settingsDrawer) return;

  const ttsToggles = settingsDrawer.querySelectorAll('.speech-toggle-switch');
  ttsToggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      if (toggle.classList.contains('active')) return;

      ttsToggles.forEach(t => t.classList.remove('active'));
      toggle.classList.add('active');

      const modelName = toggle.getAttribute('data-model');
      console.log('TTS model selected:', modelName);
    });
  });
}

function handleModelSelectChange(event) {
  const selected = event.target.value || '';
  currentModel = selected;
  console.log('Model selected:', selected);
}

async function refreshModelOptions() {
  if (!modelSelect) return;

  isLoadingModels = true;
  modelSelect.disabled = true;
  modelSelect.innerHTML = '<option value="">Loading models...</option>';

  try {
    const response = await fetch('/api/openrouter/models');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    const models = Array.isArray(payload.models) ? [...payload.models] : [];
    models.sort((a, b) => a.localeCompare(b));

    availableModels = models;
    populateModelSelect(models);

    // Fetch current model
    let current = currentModel;
    if (!current) {
      current = await fetchCurrentModel();
    }

    if (current && !availableModels.includes(current)) {
      availableModels.push(current);
      availableModels.sort((a, b) => a.localeCompare(b));
      populateModelSelect(availableModels);
    }

    if (!current && availableModels.length) {
      current = availableModels[0];
    }

    if (current) {
      setSelectedModel(current);
    } else {
      currentModel = '';
    }

    modelSelect.disabled = !availableModels.length;
  } catch (error) {
    console.error('Error loading models:', error);
    modelSelect.innerHTML = '<option value="">Failed to load models</option>';
    modelSelect.disabled = true;
    availableModels = [];
    currentModel = '';
  } finally {
    isLoadingModels = false;
  }
}

function populateModelSelect(models) {
  if (!modelSelect) return;

  modelSelect.innerHTML = '';

  if (!models.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = isLoadingModels ? 'Loading models...' : 'No models available';
    option.disabled = true;
    option.selected = true;
    modelSelect.appendChild(option);
    modelSelect.disabled = true;
    return;
  }

  modelSelect.disabled = false;
  models.forEach(modelId => {
    const option = document.createElement('option');
    option.value = modelId;
    option.textContent = modelId;
    modelSelect.appendChild(option);
  });
}

async function fetchCurrentModel() {
  try {
    const response = await fetch('/api/chat/model');
    if (!response.ok) {
      return '';
    }
    const payload = await response.json();
    return typeof payload.model === 'string' ? payload.model : '';
  } catch (error) {
    console.warn('Unable to fetch current model:', error);
    return '';
  }
}

function setSelectedModel(modelId) {
  let targetModel = modelId || '';

  if (modelSelect) {
    if (targetModel && modelSelect.querySelector(`option[value="${targetModel}"]`)) {
      modelSelect.value = targetModel;
    } else if (availableModels.length) {
      targetModel = availableModels[0];
      modelSelect.value = targetModel;
    } else {
      modelSelect.value = '';
    }
  }

  currentModel = targetModel;
  return targetModel;
}

function getModelParameters() {
  if (!settingsDrawer) return {};

  const sliderConfig = [
    { id: 'temperature', key: 'temperature', parser: parseFloat },
    { id: 'topP', key: 'top_p', parser: parseFloat },
    { id: 'minP', key: 'min_p', parser: parseFloat },
    { id: 'topK', key: 'top_k', parser: value => parseInt(value, 10) },
    { id: 'frequencyPenalty', key: 'frequency_penalty', parser: parseFloat },
    { id: 'presencePenalty', key: 'presence_penalty', parser: parseFloat },
    { id: 'repetitionPenalty', key: 'repetition_penalty', parser: parseFloat }
  ];

  const params = {};

  sliderConfig.forEach(({ id, key, parser }) => {
    const input = settingsDrawer.querySelector(`#${id}`);
    if (!input) return;
    const numericValue = parser(input.value);
    if (Number.isNaN(numericValue)) return;
    params[key] = numericValue;
  });

  return params;
}

function getSelectedModel() {
  return currentModel;
}

// ========== Characters Drawer Functions ==========
function initCharactersDrawer() {
  charactersDrawer = document.getElementById('charactersDrawer');
  charactersDrawerToggle = document.getElementById('charactersDrawerToggle');

  if (!charactersDrawer || !charactersDrawerToggle) return;

  // Toggle drawer
  const updateTogglePosition = () => {
    const isOpen = charactersDrawer.classList.contains('open');
    if (isOpen) {
      const height = charactersDrawer.getBoundingClientRect().height;
      charactersDrawerToggle.style.bottom = `${height + 12}px`;
    } else {
      charactersDrawerToggle.style.bottom = '16px';
    }
  };

  const setOpen = (open) => {
    charactersDrawer.classList.toggle('open', open);
    charactersDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
    charactersDrawerToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    updateTogglePosition();
  };

  charactersDrawerToggle.addEventListener('click', () => {
    const isOpen = charactersDrawer.classList.contains('open');
    setOpen(!isOpen);
  });

  window.addEventListener('resize', updateTogglePosition);
  updateTogglePosition();

  console.log('Characters drawer initialized');
}

// ========== WebSocket Message Handlers ==========
function handleTranscriptionUpdate(data) {
  // data is the text string directly from backend
  if (data && typeof data === 'string') {
    addTranscriptionPreview(data, false);
  }
}

function handleTranscriptionStabilized(data) {
  // data is the text string directly from backend
  if (data && typeof data === 'string') {
    addTranscriptionPreview(data, true);
  }
}

function handleTranscriptionFinal(data) {
  // data is the text string directly from backend
  if (data && typeof data === 'string') {
    finalizeTranscription(data);
  }
}

function handleCharacterResponseStart(data) {
  if (data && data.character) {
    startCharacterResponse(data.character);
  }
}

function handleCharacterResponseChunk(data) {
  if (data && data.character) {
    addCharacterResponseChunk(data.character, data.chunk, data.full_text);
  }
}

function handleCharacterResponseComplete(data) {
  if (data && data.character) {
    completeCharacterResponse(data.character, data.full_text);
  }
}

function handleAudioStreamStart(data) {
  console.log('[Interface] handleAudioStreamStart called:', data);
  if (window.AudioPlayback && data) {
    // data contains sample_rate, channels, format from backend
    AudioPlayback.beginStream(data);
  } else {
    console.warn('[Interface] AudioPlayback not available or no data:', { hasAudioPlayback: !!window.AudioPlayback, data });
  }
}

function handleAudioStreamEnd(data) {
  console.log('[Interface] handleAudioStreamEnd called:', data);
  if (window.AudioPlayback) {
    // data contains total_chunks, duration_sec, etc from backend
    AudioPlayback.finishStream(data);
  } else {
    console.warn('[Interface] AudioPlayback not available');
  }
}

function handleBinaryAudio(arrayBuffer) {
  console.log('[Interface] handleBinaryAudio called, size:', arrayBuffer.byteLength);
  if (window.AudioPlayback && arrayBuffer) {
    AudioPlayback.enqueueChunk(arrayBuffer);
  } else {
    console.warn('[Interface] AudioPlayback not available or no arrayBuffer');
  }
}

// ========== Voice/Microphone Functions ==========
function toggleMicrophone() {
  if (!window.STTAudio) {
    console.error('STTAudio not available. Make sure stt-audio.js is loaded.');
    showError('Microphone not available');
    return;
  }

  if (!WSConnection.isConnected()) {
    showError('Not connected to server');
    return;
  }

  if (isMicActive) {
    // Stop microphone
    STTAudio.stopMicrophone();
    isMicActive = false;
    setVoiceButtonState(false);

    // Notify server
    WSConnection.sendJSON({ type: 'stop_listening' });
  } else {
    // Start microphone
    STTAudio.startMicrophone((audioData) => {
      // Send audio data to server
      if (WSConnection.isConnected()) {
        WSConnection.sendBinary(audioData);
      }
    });
    isMicActive = true;
    setVoiceButtonState(true);

    // Notify server
    WSConnection.sendJSON({ type: 'start_listening' });
  }
}

function sendChatMessage(text) {
  if (!text || !text.trim()) return;

  if (!WSConnection.isConnected()) {
    showError('Not connected to server');
    return;
  }

  const modelParams = getModelParameters();
  const selectedModel = getSelectedModel();

  const payload = {
    type: 'chat_message',
    message: text,
    user_name: 'User'
  };

  if (selectedModel) {
    payload.model = selectedModel;
  }

  if (modelParams && Object.keys(modelParams).length > 0) {
    payload.model_params = modelParams;
  }

  WSConnection.sendJSON(payload);
}

// ========== Initialization ==========
function initInterface() {
  console.log('Initializing interface...');

  initSidebar();
  initSearch();
  initNavigation();
  initChatEditor();
  initSettingsDrawer();
  initCharactersDrawer();

  // Initialize WebSocket connection (using websocket.js)
  if (window.WSConnection) {
    WSConnection.connect();

    // Connection event handlers
    WSConnection.on('connected', () => {
      console.log('WebSocket connected');
      setConnectionIndicator(true);
    });

    WSConnection.on('disconnected', () => {
      console.log('WebSocket disconnected');
      setConnectionIndicator(false);

      // Stop microphone if active
      if (isMicActive && window.STTAudio) {
        STTAudio.stopMicrophone();
        isMicActive = false;
        setVoiceButtonState(false);
      }
    });

    WSConnection.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    WSConnection.on('reconnecting', (data) => {
      console.log(`Reconnecting... Attempt ${data.attempt}`);
    });

    // Register message handlers
    WSConnection.registerHandler('transcription_update', handleTranscriptionUpdate);
    WSConnection.registerHandler('transcription_stabilized', handleTranscriptionStabilized);
    WSConnection.registerHandler('transcription_final', handleTranscriptionFinal);
    WSConnection.registerHandler('character_response_start', handleCharacterResponseStart);
    WSConnection.registerHandler('character_response_chunk', handleCharacterResponseChunk);
    WSConnection.registerHandler('character_response_complete', handleCharacterResponseComplete);
    WSConnection.registerHandler('audio_stream_start', handleAudioStreamStart);
    WSConnection.registerHandler('audio_stream_end', handleAudioStreamEnd);
    WSConnection.registerHandler('binary', handleBinaryAudio);

    console.log('WebSocket handlers registered');
  } else {
    console.warn('WSConnection not available. Make sure websocket.js is loaded.');
  }

  console.log('Interface initialized');
}

// ========== Public API Export ==========
window.Interface = {
  // Navigation
  navigateToRoute,
  getCurrentRoute: () => currentRoute,

  // Chat UI
  addUserMessage,
  addTranscriptionPreview,
  finalizeTranscription,
  startCharacterResponse,
  addCharacterResponseChunk,
  completeCharacterResponse,
  clearMessages,
  showError,
  scrollToBottom,

  // UI State
  setVoiceButtonState,
  setConnectionIndicator,

  // Settings
  getModelParameters,
  getSelectedModel,
  setSelectedModel,
  refreshModelOptions,

  // Voice/Microphone
  toggleMicrophone,
  sendChatMessage,

  // State getters
  getState: () => ({
    currentRoute,
    isResponding,
    currentModel,
    availableModels,
    isMicActive
  })
};

// ========== Auto-initialize ==========
document.addEventListener('DOMContentLoaded', initInterface);
