/**
 * Chat Manager
 * Manages message display and WebSocket interaction
 */

import { ChatWebSocket } from './api/websocket.js';
import * as MessagesAPI from './api/messages.js';
import { handleAPIError } from './api/config.js';

// State
let wsConnection = null;
let currentMessages = [];
let currentConversationId = null;
let currentCharacterIds = [];
let isStreaming = false;
let streamingMessage = null;

/**
 * Initialize chat system
 */
export async function initChat() {
  console.log('Initializing chat...');

  // Listen for conversation selection events
  document.addEventListener('conversation-selected', handleConversationSelected);
  document.addEventListener('conversation-cleared', handleConversationCleared);

  console.log('Chat initialized');
}

/**
 * Handle conversation selection
 * @param {CustomEvent} event - Conversation selected event
 */
async function handleConversationSelected(event) {
  const { conversationId, characterIds } = event.detail;

  console.log('Loading conversation:', conversationId, 'with characters:', characterIds);

  // Disconnect existing WebSocket if any
  if (wsConnection) {
    wsConnection.disconnect();
  }

  // Store current conversation info
  currentConversationId = conversationId;
  currentCharacterIds = characterIds;

  // Load message history
  await loadMessageHistory(conversationId);

  // Establish WebSocket connection
  connectWebSocket(conversationId, characterIds);
}

/**
 * Handle conversation cleared
 */
function handleConversationCleared() {
  if (wsConnection) {
    wsConnection.disconnect();
    wsConnection = null;
  }

  currentConversationId = null;
  currentCharacterIds = [];
  currentMessages = [];

  renderMessages();
}

/**
 * Load message history from backend
 * @param {string} conversationId - Conversation ID
 */
async function loadMessageHistory(conversationId) {
  try {
    const messages = await MessagesAPI.getMessages(conversationId, 100, 0);
    currentMessages = messages.map(MessagesAPI.mapMessageToFrontend);

    console.log(`Loaded ${currentMessages.length} messages`);

    renderMessages();
  } catch (error) {
    console.error('Error loading messages:', error);
    const errorMessage = handleAPIError(error);
    showNotification('Error Loading Messages', errorMessage, 'error');
    currentMessages = [];
    renderMessages();
  }
}

/**
 * Connect to WebSocket for real-time chat
 * @param {string} conversationId - Conversation ID
 * @param {Array<string>} characterIds - Character IDs
 */
function connectWebSocket(conversationId, characterIds) {
  wsConnection = new ChatWebSocket(conversationId, characterIds);

  // Setup callbacks
  wsConnection.onConnected = () => {
    console.log('Chat WebSocket connected');
    updateConnectionStatus(true);
  };

  wsConnection.onDisconnected = () => {
    console.log('Chat WebSocket disconnected');
    updateConnectionStatus(false);
  };

  wsConnection.onError = (error) => {
    console.error('WebSocket error:', error);
    showNotification('Connection Error', 'Lost connection to server', 'error');
  };

  wsConnection.onTextChunk = (chunk) => {
    handleTextChunk(chunk);
  };

  wsConnection.onSpeakerChange = (speaker) => {
    handleSpeakerChange(speaker);
  };

  wsConnection.onCharacterEnd = (sequenceNumber) => {
    handleCharacterEnd(sequenceNumber);
  };

  wsConnection.onAudioChunk = (audioData) => {
    // TODO: Handle audio playback in future
    console.log('Received audio chunk:', audioData);
  };

  // Connect
  wsConnection.connect();
}

/**
 * Handle text chunk from WebSocket
 * @param {Object} chunk - Text chunk data
 */
function handleTextChunk(chunk) {
  if (!isStreaming) {
    // Start new streaming message
    isStreaming = true;
    streamingMessage = {
      role: 'assistant',
      name: chunk.speaker_name,
      content: '',
      character_id: chunk.speaker_id,
      sequence_number: chunk.sequence_number,
      timestamp: Date.now(),
      isStreaming: true
    };

    // Add to messages array
    currentMessages.push(streamingMessage);
    renderMessages(true); // Scroll to bottom
  }

  // Append text to streaming message
  streamingMessage.content += chunk.text;

  // Update the message in the UI
  updateStreamingMessage(streamingMessage);

  // If final chunk, finalize message
  if (chunk.is_final) {
    streamingMessage.isStreaming = false;
    isStreaming = false;
    updateStreamingMessage(streamingMessage);
    streamingMessage = null;
  }
}

/**
 * Handle speaker change notification
 * @param {Object} speaker - Speaker info
 */
function handleSpeakerChange(speaker) {
  console.log('Speaker changed:', speaker.speaker_name);
  // Visual indication could be added here
}

/**
 * Handle character finished speaking
 * @param {number} sequenceNumber - Sequence number
 */
function handleCharacterEnd(sequenceNumber) {
  console.log('Character end:', sequenceNumber);
  // Could add visual indication that character finished
}

/**
 * Send message via WebSocket
 * @param {string} content - Message content
 */
export function sendMessage(content) {
  if (!wsConnection || !wsConnection.isConnected()) {
    showNotification('Not Connected', 'WebSocket not connected. Please wait...', 'warning');
    return;
  }

  if (!content || !content.trim()) {
    return;
  }

  // Get model parameters from localStorage (set by settings drawer)
  const modelParams = getModelParameters();

  // Add user message to UI immediately (optimistic update)
  const userMessage = {
    role: 'user',
    name: 'You',
    content: content,
    timestamp: Date.now(),
    isStreaming: false
  };

  currentMessages.push(userMessage);
  renderMessages(true); // Scroll to bottom

  // Send via WebSocket
  wsConnection.sendTextMessage(content, modelParams);

  console.log('Sent message with params:', modelParams);
}

/**
 * Get model parameters from localStorage
 * @returns {Object} Model parameters
 */
function getModelParameters() {
  return {
    model: localStorage.getItem('selectedModel') || null,
    temperature: parseFloat(localStorage.getItem('temperature') || '1.0'),
    top_p: parseFloat(localStorage.getItem('top-p') || '1.0'),
    min_p: parseFloat(localStorage.getItem('min-p') || '0.0'),
    top_k: parseInt(localStorage.getItem('top-k') || '0'),
    frequency_penalty: parseFloat(localStorage.getItem('frequency-penalty') || '0.0'),
    presence_penalty: parseFloat(localStorage.getItem('presence-penalty') || '0.0'),
    repetition_penalty: parseFloat(localStorage.getItem('repetition-penalty') || '1.0')
  };
}

/**
 * Render all messages in the chat area
 * @param {boolean} scrollToBottom - Whether to scroll to bottom after render
 */
function renderMessages(scrollToBottom = false) {
  const messagesArea = document.querySelector('.messages-area');
  if (!messagesArea) {
    console.warn('Messages area not found');
    return;
  }

  if (currentMessages.length === 0) {
    messagesArea.innerHTML = renderEmptyState();
    return;
  }

  // Group messages by date
  const grouped = MessagesAPI.groupMessagesByDate(currentMessages);

  // Render messages
  const messagesHTML = grouped.map(item => {
    if (item.type === 'date_separator') {
      return renderDateSeparator(item.display);
    } else {
      return renderMessage(item);
    }
  }).join('');

  messagesArea.innerHTML = messagesHTML;

  if (scrollToBottom) {
    scrollToBottomSmooth();
  }
}

/**
 * Render empty state
 */
function renderEmptyState() {
  return `
    <div class="messages-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
      <p>No messages yet.<br>Start a conversation!</p>
    </div>
  `;
}

/**
 * Render date separator
 * @param {string} dateText - Date text to display
 */
function renderDateSeparator(dateText) {
  return `
    <div class="message-date-separator">
      <span>${dateText}</span>
    </div>
  `;
}

/**
 * Render a single message
 * @param {Object} message - Message object
 */
function renderMessage(message) {
  const isUser = message.role === 'user';
  const messageClass = isUser ? 'user-message' : 'character-message';
  const timeStr = message.created_at
    ? MessagesAPI.formatMessageTime(message.created_at)
    : new Date(message.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const streamingIndicator = message.isStreaming
    ? '<span class="message-streaming">●</span>'
    : '';

  return `
    <div class="message ${messageClass}" data-message-id="${message.message_id || ''}">
      <div class="message-avatar">
        ${isUser ? renderUserAvatar() : renderCharacterAvatar(message)}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender">${escapeHtml(message.name)}</span>
          <span class="message-time">${timeStr}</span>
          ${streamingIndicator}
        </div>
        <div class="message-text">${formatMessageContent(message.content)}</div>
      </div>
    </div>
  `;
}

/**
 * Render user avatar
 */
function renderUserAvatar() {
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;
}

/**
 * Render character avatar
 * @param {Object} message - Message object
 */
function renderCharacterAvatar(message) {
  // TODO: Load actual character avatar from character data
  return `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  `;
}

/**
 * Update streaming message in UI (without full re-render)
 * @param {Object} message - Streaming message
 */
function updateStreamingMessage(message) {
  const messagesArea = document.querySelector('.messages-area');
  if (!messagesArea) return;

  // Find the last message element (should be the streaming one)
  const lastMessage = messagesArea.querySelector('.message:last-child');
  if (!lastMessage) return;

  const messageText = lastMessage.querySelector('.message-text');
  const streamingIndicator = lastMessage.querySelector('.message-streaming');

  if (messageText) {
    messageText.innerHTML = formatMessageContent(message.content);
  }

  if (!message.isStreaming && streamingIndicator) {
    streamingIndicator.remove();
  }

  scrollToBottomSmooth();
}

/**
 * Format message content (preserve line breaks, links, etc.)
 * @param {string} content - Message content
 * @returns {string} Formatted HTML
 */
function formatMessageContent(content) {
  // Escape HTML
  let formatted = escapeHtml(content);

  // Preserve line breaks
  formatted = formatted.replace(/\n/g, '<br>');

  // Make URLs clickable (simple regex)
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return formatted;
}

/**
 * Scroll messages area to bottom smoothly
 */
function scrollToBottomSmooth() {
  const messagesArea = document.querySelector('.messages-area');
  if (messagesArea) {
    messagesArea.scrollTo({
      top: messagesArea.scrollHeight,
      behavior: 'smooth'
    });
  }
}

/**
 * Update connection status indicator
 * @param {boolean} connected - Whether connected
 */
function updateConnectionStatus(connected) {
  // Could add a visual indicator in the UI
  console.log('Connection status:', connected ? 'Connected' : 'Disconnected');
}

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 */
function showNotification(title, message, type = 'success') {
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

/**
 * Disconnect chat (cleanup)
 */
export function disconnectChat() {
  if (wsConnection) {
    wsConnection.disconnect();
    wsConnection = null;
  }
}
