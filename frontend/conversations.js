/**
 * Conversations Manager
 * Manages conversation list UI in the info drawer
 */

import * as ConversationsAPI from './api/conversations.js';
import * as CharactersAPI from './api/characters.js';
import { handleAPIError } from './api/config.js';

// State
let conversations = [];
let activeConversationId = null;
let activeCharacters = [];

/**
 * Initialize conversations in info drawer
 */
export async function initConversations() {
  console.log('Initializing conversations...');

  // Load conversations from backend
  await loadConversations();

  // Render conversation list
  renderConversationList();

  // Setup event listeners
  setupEventListeners();

  console.log('Conversations initialized');
}

/**
 * Load conversations from backend
 */
async function loadConversations() {
  try {
    const data = await ConversationsAPI.getAllConversations(20, 0);
    conversations = data.map(ConversationsAPI.mapConversationToFrontend);
    console.log(`Loaded ${conversations.length} conversations`);
  } catch (error) {
    console.error('Error loading conversations:', error);
    const errorMessage = handleAPIError(error);
    showNotification('Error Loading Conversations', errorMessage, 'error');
    conversations = [];
  }
}

/**
 * Render conversation list in info drawer
 */
function renderConversationList() {
  const infoDrawerContent = document.querySelector('.info-drawer-content');
  if (!infoDrawerContent) {
    console.warn('Info drawer content not found');
    return;
  }

  // Build conversation list HTML
  const conversationListHTML = `
    <div class="conversation-list-header">
      <h3>Conversations</h3>
      <button class="new-conversation-btn" id="new-conversation-btn" title="New conversation">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>
    </div>

    <div class="conversation-list" id="conversation-list">
      ${conversations.length === 0 ? renderEmptyState() : conversations.map(renderConversationItem).join('')}
    </div>
  `;

  infoDrawerContent.innerHTML = conversationListHTML;

  // Re-attach event listeners after render
  setupEventListeners();
}

/**
 * Render empty state when no conversations exist
 */
function renderEmptyState() {
  return `
    <div class="conversation-list-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p>No conversations yet.<br>Start chatting to create one!</p>
    </div>
  `;
}

/**
 * Render a single conversation item
 * @param {Object} conversation - Conversation object
 * @returns {string} HTML string
 */
function renderConversationItem(conversation) {
  const isActive = conversation.conversation_id === activeConversationId;
  const title = conversation.title || 'New Conversation';
  const date = ConversationsAPI.formatConversationDate(conversation.updated_at);

  return `
    <div class="conversation-item ${isActive ? 'active' : ''}"
         data-conversation-id="${conversation.conversation_id}">
      <div class="conversation-item-content">
        <div class="conversation-item-title">${escapeHtml(title)}</div>
        <div class="conversation-item-meta">
          <span class="conversation-item-date">${date}</span>
        </div>
      </div>
      <button class="conversation-item-delete" title="Delete conversation" onclick="event.stopPropagation()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  `;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // New conversation button
  const newConvBtn = document.getElementById('new-conversation-btn');
  if (newConvBtn) {
    newConvBtn.addEventListener('click', handleNewConversation);
  }

  // Conversation item clicks
  const conversationItems = document.querySelectorAll('.conversation-item');
  conversationItems.forEach(item => {
    const conversationId = item.getAttribute('data-conversation-id');

    // Click to select conversation
    item.addEventListener('click', () => {
      selectConversation(conversationId);
    });

    // Delete button
    const deleteBtn = item.querySelector('.conversation-item-delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDeleteConversation(conversationId);
      });
    }
  });
}

/**
 * Handle new conversation button click
 */
async function handleNewConversation() {
  try {
    // Load active characters to use in new conversation
    const characters = await CharactersAPI.getActiveCharacters();

    if (characters.length === 0) {
      showNotification(
        'No Active Characters',
        'Please activate at least one character before starting a conversation.',
        'warning'
      );
      return;
    }

    const characterIds = characters.map(c => c.id).slice(0, 2); // Use first 2 active characters

    // Create new conversation
    const conversation = await ConversationsAPI.createConversation({
      title: null, // Will be auto-generated
      active_characters: characterIds
    });

    console.log('Created new conversation:', conversation);

    // Add to local array
    const mapped = ConversationsAPI.mapConversationToFrontend(conversation);
    conversations.unshift(mapped); // Add to start of array

    // Re-render list
    renderConversationList();

    // Select the new conversation
    await selectConversation(conversation.conversation_id);

    showNotification('Conversation Created', 'Ready to start chatting!', 'success');

  } catch (error) {
    console.error('Error creating conversation:', error);
    const errorMessage = handleAPIError(error);
    showNotification('Error Creating Conversation', errorMessage, 'error');
  }
}

/**
 * Handle delete conversation
 * @param {string} conversationId - Conversation ID to delete
 */
async function handleDeleteConversation(conversationId) {
  const conversation = conversations.find(c => c.conversation_id === conversationId);
  const title = conversation?.title || 'this conversation';

  if (!confirm(`Delete "${title}"? This cannot be undone.`)) {
    return;
  }

  try {
    await ConversationsAPI.deleteConversation(conversationId);
    console.log('Deleted conversation:', conversationId);

    // Remove from local array
    conversations = conversations.filter(c => c.conversation_id !== conversationId);

    // Re-render list
    renderConversationList();

    // If this was the active conversation, clear the chat
    if (conversationId === activeConversationId) {
      activeConversationId = null;

      // Notify chat manager to clear
      const event = new CustomEvent('conversation-cleared');
      document.dispatchEvent(event);
    }

    showNotification('Conversation Deleted', `"${title}" has been deleted`, 'success');

  } catch (error) {
    console.error('Error deleting conversation:', error);
    const errorMessage = handleAPIError(error);
    showNotification('Error Deleting Conversation', errorMessage, 'error');
  }
}

/**
 * Select and load a conversation
 * @param {string} conversationId - Conversation ID to select
 */
export async function selectConversation(conversationId) {
  if (activeConversationId === conversationId) {
    return; // Already selected
  }

  try {
    // Fetch full conversation details
    const conversation = await ConversationsAPI.getConversation(conversationId);
    console.log('Selected conversation:', conversation);

    activeConversationId = conversationId;
    activeCharacters = conversation.active_characters || [];

    // Update UI
    updateActiveConversationUI();

    // Notify chat manager to load this conversation
    const event = new CustomEvent('conversation-selected', {
      detail: {
        conversationId: conversationId,
        characterIds: activeCharacters
      }
    });
    document.dispatchEvent(event);

  } catch (error) {
    console.error('Error selecting conversation:', error);
    const errorMessage = handleAPIError(error);
    showNotification('Error Loading Conversation', errorMessage, 'error');
  }
}

/**
 * Update UI to show active conversation
 */
function updateActiveConversationUI() {
  const items = document.querySelectorAll('.conversation-item');
  items.forEach(item => {
    const itemId = item.getAttribute('data-conversation-id');
    if (itemId === activeConversationId) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
}

/**
 * Get active conversation ID
 * @returns {string|null}
 */
export function getActiveConversationId() {
  return activeConversationId;
}

/**
 * Get active character IDs
 * @returns {Array<string>}
 */
export function getActiveCharacterIds() {
  return activeCharacters;
}

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type ('success', 'error', 'warning')
 */
function showNotification(title, message, type = 'success') {
  // Use the notification system from characters.js
  // Create event to trigger notification
  const event = new CustomEvent('show-notification', {
    detail: { title, message, type }
  });
  document.dispatchEvent(event);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
