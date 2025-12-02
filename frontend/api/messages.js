/**
 * Messages API Client
 * Handles all message-related API operations
 * Note: This is for loading history only - new messages sent via WebSocket
 */

import { get, post, handleAPIError, logAPIError } from './config.js';

/**
 * Get messages for a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limit - Maximum number of messages to return
 * @param {number} offset - Number of messages to skip
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages(conversationId, limit = 100, offset = 0) {
  try {
    const messages = await get('/api/messages', {
      conversation_id: conversationId,
      limit,
      offset
    });
    return messages;
  } catch (error) {
    logAPIError('getMessages', error);
    throw error;
  }
}

/**
 * Get recent messages from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} n - Number of recent messages to return
 * @returns {Promise<Array>} Array of message objects (most recent last)
 */
export async function getRecentMessages(conversationId, n = 10) {
  try {
    const messages = await get('/api/messages/recent', {
      conversation_id: conversationId,
      n
    });
    return messages;
  } catch (error) {
    logAPIError('getRecentMessages', error);
    throw error;
  }
}

/**
 * Get the last message from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} n - Number of last messages to return
 * @returns {Promise<Array>} Array of message objects
 */
export async function getLastMessage(conversationId, n = 1) {
  try {
    const messages = await get('/api/messages/last', {
      conversation_id: conversationId,
      n
    });
    return messages;
  } catch (error) {
    logAPIError('getLastMessage', error);
    throw error;
  }
}

/**
 * Create a single message (manual save - not for normal chat flow)
 * @param {Object} messageData - Message data
 * @param {string} messageData.conversation_id - Conversation ID (required)
 * @param {string} messageData.role - Message role: "user" or "assistant" (required)
 * @param {string} messageData.content - Message content (required)
 * @param {string} messageData.name - Speaker name (optional)
 * @param {string} messageData.character_id - Character ID for assistant messages (optional)
 * @returns {Promise<Object>} Created message object
 */
export async function createMessage(messageData) {
  try {
    const backendData = {
      conversation_id: messageData.conversation_id,
      role: messageData.role,
      content: messageData.content,
      name: messageData.name || null,
      character_id: messageData.character_id || null
    };

    const message = await post('/api/messages', backendData);
    return message;
  } catch (error) {
    logAPIError('createMessage', error);
    throw error;
  }
}

/**
 * Create multiple messages in a batch
 * @param {Array<Object>} messages - Array of message data objects
 * @returns {Promise<Array>} Array of created message objects
 */
export async function createMessagesBatch(messages) {
  try {
    const backendData = messages.map(msg => ({
      conversation_id: msg.conversation_id,
      role: msg.role,
      content: msg.content,
      name: msg.name || null,
      character_id: msg.character_id || null
    }));

    const createdMessages = await post('/api/messages/batch', backendData);
    return createdMessages;
  } catch (error) {
    logAPIError('createMessagesBatch', error);
    throw error;
  }
}

/**
 * Map backend message object to frontend format
 * @param {Object} backendMessage - Message from backend API
 * @returns {Object} Frontend-formatted message
 */
export function mapMessageToFrontend(backendMessage) {
  return {
    message_id: backendMessage.message_id,
    conversation_id: backendMessage.conversation_id,
    role: backendMessage.role, // "user", "assistant", or "system"
    name: backendMessage.name || (backendMessage.role === 'user' ? 'You' : 'Assistant'),
    content: backendMessage.content,
    character_id: backendMessage.character_id,
    created_at: backendMessage.created_at,
    updated_at: backendMessage.updated_at,
    timestamp: new Date(backendMessage.created_at).getTime()
  };
}

/**
 * Format message timestamp for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted time (e.g., "2:34 PM", "Yesterday 2:34 PM")
 */
export function formatMessageTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (diffDays === 0) {
    return timeStr; // "2:34 PM"
  } else if (diffDays === 1) {
    return `Yesterday ${timeStr}`;
  } else if (diffDays < 7) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
    return `${dayName} ${timeStr}`; // "Mon 2:34 PM"
  } else {
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${dateStr} ${timeStr}`; // "Jan 15 2:34 PM"
  }
}

/**
 * Group messages by date for display
 * @param {Array<Object>} messages - Array of messages
 * @returns {Array<Object>} Messages grouped by date with separators
 */
export function groupMessagesByDate(messages) {
  const grouped = [];
  let lastDate = null;

  messages.forEach(message => {
    const messageDate = new Date(message.created_at).toDateString();

    if (messageDate !== lastDate) {
      // Add date separator
      grouped.push({
        type: 'date_separator',
        date: messageDate,
        display: formatDateSeparator(message.created_at)
      });
      lastDate = messageDate;
    }

    grouped.push({
      type: 'message',
      ...message
    });
  });

  return grouped;
}

/**
 * Format date for separator display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date (e.g., "Today", "Yesterday", "Monday, January 15")
 */
function formatDateSeparator(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }
}
