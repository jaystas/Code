/**
 * Conversations API Client
 * Handles all conversation-related API operations
 */

import { get, post, put, del, handleAPIError, logAPIError } from './config.js';

/**
 * Get all conversations
 * @param {number} limit - Maximum number of conversations to return
 * @param {number} offset - Number of conversations to skip
 * @returns {Promise<Array>} Array of conversation objects
 */
export async function getAllConversations(limit = 20, offset = 0) {
  try {
    const conversations = await get('/api/conversations', { limit, offset });
    return conversations;
  } catch (error) {
    logAPIError('getAllConversations', error);
    throw error;
  }
}

/**
 * Get a specific conversation by ID
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Conversation object
 */
export async function getConversation(conversationId) {
  try {
    const conversation = await get(`/api/conversations/${conversationId}`);
    return conversation;
  } catch (error) {
    logAPIError('getConversation', error);
    throw error;
  }
}

/**
 * Create a new conversation
 * @param {Object} conversationData - Conversation data
 * @param {string} conversationData.title - Optional conversation title
 * @param {Array<string>} conversationData.active_characters - Array of character IDs
 * @returns {Promise<Object>} Created conversation object
 */
export async function createConversation(conversationData) {
  try {
    const backendData = {
      title: conversationData.title || null,
      active_characters: conversationData.active_characters || []
    };

    const conversation = await post('/api/conversations', backendData);
    return conversation;
  } catch (error) {
    logAPIError('createConversation', error);
    throw error;
  }
}

/**
 * Update an existing conversation
 * @param {string} conversationId - Conversation ID
 * @param {Object} conversationData - Updated conversation data (partial)
 * @returns {Promise<Object>} Updated conversation object
 */
export async function updateConversation(conversationId, conversationData) {
  try {
    const backendData = {};

    if (conversationData.title !== undefined) {
      backendData.title = conversationData.title;
    }
    if (conversationData.active_characters !== undefined) {
      backendData.active_characters = conversationData.active_characters;
    }

    const conversation = await put(`/api/conversations/${conversationId}`, backendData);
    return conversation;
  } catch (error) {
    logAPIError('updateConversation', error);
    throw error;
  }
}

/**
 * Update conversation title
 * @param {string} conversationId - Conversation ID
 * @param {string} title - New title
 * @returns {Promise<Object>} Updated conversation object
 */
export async function updateConversationTitle(conversationId, title) {
  return updateConversation(conversationId, { title });
}

/**
 * Update active characters in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {Array<string>} characterIds - Array of character IDs
 * @returns {Promise<Object>} Updated conversation object
 */
export async function updateConversationCharacters(conversationId, characterIds) {
  try {
    const conversation = await put(`/api/conversations/${conversationId}/characters`, characterIds);
    return conversation;
  } catch (error) {
    logAPIError('updateConversationCharacters', error);
    throw error;
  }
}

/**
 * Add a character to a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} characterId - Character ID to add
 * @returns {Promise<Object>} Updated conversation object
 */
export async function addCharacterToConversation(conversationId, characterId) {
  try {
    const conversation = await post(`/api/conversations/${conversationId}/characters/${characterId}`);
    return conversation;
  } catch (error) {
    logAPIError('addCharacterToConversation', error);
    throw error;
  }
}

/**
 * Remove a character from a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} characterId - Character ID to remove
 * @returns {Promise<Object>} Updated conversation object
 */
export async function removeCharacterFromConversation(conversationId, characterId) {
  try {
    const conversation = await del(`/api/conversations/${conversationId}/characters/${characterId}`);
    return conversation;
  } catch (error) {
    logAPIError('removeCharacterFromConversation', error);
    throw error;
  }
}

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Success message
 */
export async function deleteConversation(conversationId) {
  try {
    const result = await del(`/api/conversations/${conversationId}`);
    return result;
  } catch (error) {
    logAPIError('deleteConversation', error);
    throw error;
  }
}

/**
 * Map backend conversation object to frontend format
 * @param {Object} backendConversation - Conversation from backend API
 * @returns {Object} Frontend-formatted conversation
 */
export function mapConversationToFrontend(backendConversation) {
  return {
    conversation_id: backendConversation.conversation_id,
    title: backendConversation.title || 'New Conversation',
    active_characters: backendConversation.active_characters || [],
    created_at: backendConversation.created_at,
    updated_at: backendConversation.updated_at
  };
}

/**
 * Map frontend conversation object to backend format
 * @param {Object} frontendConversation - Conversation from frontend
 * @returns {Object} Backend-formatted conversation
 */
export function mapConversationToBackend(frontendConversation) {
  return {
    title: frontendConversation.title,
    active_characters: frontendConversation.active_characters || []
  };
}

/**
 * Format conversation date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted relative date (e.g., "2 hours ago", "Yesterday")
 */
export function formatConversationDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}
