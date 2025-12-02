/**
 * WebSocket Manager
 * Manages WebSocket connection for real-time chat
 */

import { WS_BASE_URL } from './config.js';

/**
 * ChatWebSocket class - Manages WebSocket connection for a conversation
 */
export class ChatWebSocket {
  constructor(conversationId, characterIds = []) {
    this.conversationId = conversationId;
    this.characterIds = characterIds;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second

    // Event callbacks
    this.onConnected = null;        // () => {}
    this.onDisconnected = null;     // () => {}
    this.onError = null;            // (error) => {}
    this.onTextChunk = null;        // (chunk) => {}
    this.onAudioChunk = null;       // (audioData) => {}
    this.onSpeakerChange = null;    // (speaker) => {}
    this.onCharacterEnd = null;     // (sequenceNumber) => {}
    this.onInterrupt = null;        // () => {}
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    try {
      // Build WebSocket URL with query parameters
      const characterIdsParam = this.characterIds.join(',');
      const url = `${WS_BASE_URL}/ws?conversation_id=${this.conversationId}&character_ids=${characterIdsParam}`;

      console.log('Connecting to WebSocket:', url);

      this.ws = new WebSocket(url);

      // Connection opened
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;

        if (this.onConnected) {
          this.onConnected();
        }
      };

      // Listen for messages
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };

      // Connection closed
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected', event);
        this.connected = false;

        if (this.onDisconnected) {
          this.onDisconnected();
        }

        // Auto-reconnect if not a clean close
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect();
        }
      };

      // Connection error
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);

        if (this.onError) {
          this.onError(error);
        }
      };

    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Handle incoming WebSocket messages
   * @param {MessageEvent} event - WebSocket message event
   */
  handleMessage(event) {
    // Binary data (audio chunks)
    if (event.data instanceof Blob) {
      if (this.onAudioChunk) {
        this.onAudioChunk(event.data);
      }
      return;
    }

    // JSON messages (text chunks, control messages)
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case 'metadata':
          // Audio metadata (sample rate, etc.)
          console.log('Audio metadata:', message);
          break;

        case 'text_chunk':
          // Streaming text from LLM
          if (this.onTextChunk) {
            this.onTextChunk({
              text: message.text,
              is_final: message.is_final,
              speaker_name: message.speaker_name,
              speaker_id: message.speaker_id,
              sequence_number: message.sequence_number,
              chunk_index: message.chunk_index
            });
          }
          break;

        case 'speaker_change':
          // Character started speaking
          if (this.onSpeakerChange) {
            this.onSpeakerChange({
              speaker_name: message.speaker_name,
              speaker_id: message.speaker_id,
              sequence_number: message.sequence_number
            });
          }
          break;

        case 'character_end':
          // Character finished speaking
          if (this.onCharacterEnd) {
            this.onCharacterEnd(message.sequence_number);
          }
          break;

        case 'interrupt':
          // Playback interrupted
          if (this.onInterrupt) {
            this.onInterrupt();
          }
          break;

        default:
          console.log('Unknown message type:', message.type, message);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Send text message to backend with model parameters
   * @param {string} content - Message content
   * @param {Object} modelParams - Model parameters from settings
   */
  sendTextMessage(content, modelParams) {
    if (!this.connected || !this.ws) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      type: 'user_message',
      content: content,

      // Model parameters
      model: modelParams.model || null,
      temperature: modelParams.temperature || 1.0,
      top_p: modelParams.top_p || 1.0,
      min_p: modelParams.min_p || 0.0,
      top_k: modelParams.top_k || 0,
      frequency_penalty: modelParams.frequency_penalty || 0.0,
      presence_penalty: modelParams.presence_penalty || 0.0,
      repetition_penalty: modelParams.repetition_penalty || 1.0
    };

    console.log('Sending text message:', message);

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('Failed to send message:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Send audio chunk to backend
   * @param {ArrayBuffer|Blob} audioData - PCM audio data
   */
  sendAudioChunk(audioData) {
    if (!this.connected || !this.ws) {
      console.error('WebSocket not connected');
      return;
    }

    try {
      this.ws.send(audioData);
    } catch (error) {
      console.error('Failed to send audio:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * Send interrupt signal to stop current generation
   */
  interrupt() {
    if (!this.connected || !this.ws) {
      console.error('WebSocket not connected');
      return;
    }

    const message = {
      type: 'interrupt'
    };

    try {
      this.ws.send(JSON.stringify(message));
      console.log('Sent interrupt signal');
    } catch (error) {
      console.error('Failed to send interrupt:', error);
    }
  }

  /**
   * Reconnect to WebSocket
   */
  reconnect() {
    this.reconnectAttempts++;
    console.log(`Reconnecting... (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);

    // Exponential backoff
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds
  }

  /**
   * Disconnect WebSocket
   */
  disconnect() {
    if (this.ws) {
      console.log('Disconnecting WebSocket');
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }
}
