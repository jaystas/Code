/**
 * websocket.js - WebSocket Connection Manager
 * Manages WebSocket connection to FastAPI backend for real-time voice chat
 *
 * Protocol:
 * - Endpoint: ws://localhost:8000/ws?conversation_id={id}&character_ids={id1,id2}
 * - Client → Server: Binary PCM16 audio (16kHz) + JSON control messages
 * - Server → Client: JSON messages (text_chunk, speaker_change, etc.) + Binary PCM16 audio (24kHz)
 */

// Event types emitted by WebSocketManager
export const WebSocketEvents = {
  // Connection events
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  ERROR: 'error',
  RECONNECTING: 'reconnecting',

  // Message events
  METADATA: 'metadata',               // Audio format metadata
  TEXT_CHUNK: 'text_chunk',           // Streaming text from LLM
  SPEAKER_CHANGE: 'speaker_change',   // New character starts speaking
  CHARACTER_END: 'character_end',     // Character finishes speaking
  AUDIO_CHUNK: 'audio_chunk',         // Audio data from TTS
  INTERRUPT: 'interrupt',             // Playback interrupted
};

// WebSocket connection states
export const ConnectionState = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
};

/**
 * WebSocket Manager for voice chat
 */
export class WebSocketManager {
  constructor(config = {}) {
    // Configuration
    this.config = {
      host: config.host || 'localhost',
      port: config.port || 8000,
      secure: config.secure || false,
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 5,
      debug: config.debug !== undefined ? config.debug : true,
    };

    // WebSocket instance
    this.ws = null;

    // Connection state
    this.state = ConnectionState.DISCONNECTED;
    this.reconnectAttempts = 0;
    this.reconnectTimer = null;

    // Session parameters
    this.conversationId = null;
    this.characterIds = [];

    // Event listeners
    this.eventListeners = {};

    // Audio metadata
    this.audioMetadata = null;

    // Statistics
    this.stats = {
      messagesReceived: 0,
      messagesSent: 0,
      audioChunksReceived: 0,
      audioChunksSent: 0,
      bytesReceived: 0,
      bytesSent: 0,
      lastActivity: null,
    };
  }

  /**
   * Connect to WebSocket server
   * @param {string} conversationId - Optional conversation ID to resume
   * @param {string[]} characterIds - Array of character IDs for this session
   */
  connect(conversationId = null, characterIds = []) {
    if (this.state === ConnectionState.CONNECTED) {
      this.log('Already connected');
      return Promise.resolve();
    }

    if (this.state === ConnectionState.CONNECTING) {
      this.log('Connection already in progress');
      return Promise.reject(new Error('Connection already in progress'));
    }

    this.conversationId = conversationId;
    this.characterIds = characterIds;
    this.state = ConnectionState.CONNECTING;

    return new Promise((resolve, reject) => {
      try {
        const url = this._buildWebSocketURL();
        this.log(`Connecting to ${url}`);

        this.ws = new WebSocket(url);
        this.ws.binaryType = 'arraybuffer';

        // Connection opened
        this.ws.onopen = () => {
          this.state = ConnectionState.CONNECTED;
          this.reconnectAttempts = 0;
          this.stats.lastActivity = Date.now();

          this.log('Connected to WebSocket');
          this.emit(WebSocketEvents.CONNECTED, { conversationId, characterIds });
          resolve();
        };

        // Message received
        this.ws.onmessage = (event) => {
          this.stats.lastActivity = Date.now();
          this._handleMessage(event);
        };

        // Connection closed
        this.ws.onclose = (event) => {
          this.log(`Connection closed: ${event.code} - ${event.reason}`);
          const wasConnected = this.state === ConnectionState.CONNECTED;
          this.state = ConnectionState.DISCONNECTED;

          this.emit(WebSocketEvents.DISCONNECTED, {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
          });

          // Attempt reconnection if it wasn't a clean close
          if (wasConnected && !event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts) {
            this._scheduleReconnect();
          }
        };

        // Connection error
        this.ws.onerror = (error) => {
          this.log('WebSocket error', error);
          this.emit(WebSocketEvents.ERROR, error);

          if (this.state === ConnectionState.CONNECTING) {
            reject(error);
          }
        };

      } catch (error) {
        this.state = ConnectionState.FAILED;
        this.log('Failed to create WebSocket', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   * @param {number} code - Close code (default: 1000 = normal closure)
   * @param {string} reason - Close reason
   */
  disconnect(code = 1000, reason = 'Client disconnecting') {
    if (this.ws) {
      this.log(`Disconnecting: ${reason}`);

      // Clear reconnection timer
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      // Close connection
      this.state = ConnectionState.DISCONNECTED;
      this.ws.close(code, reason);
      this.ws = null;
    }
  }

  /**
   * Send audio chunk to server
   * @param {ArrayBuffer} audioData - PCM16 audio data (16kHz, mono)
   */
  sendAudioChunk(audioData) {
    if (this.state !== ConnectionState.CONNECTED) {
      this.log('Cannot send audio: not connected');
      return false;
    }

    try {
      this.ws.send(audioData);
      this.stats.audioChunksSent++;
      this.stats.bytesSent += audioData.byteLength;
      this.stats.lastActivity = Date.now();
      return true;
    } catch (error) {
      this.log('Error sending audio chunk', error);
      this.emit(WebSocketEvents.ERROR, error);
      return false;
    }
  }

  /**
   * Send control message to server
   * @param {string} type - Message type (e.g., 'interrupt')
   * @param {object} data - Additional message data
   */
  sendControlMessage(type, data = {}) {
    if (this.state !== ConnectionState.CONNECTED) {
      this.log('Cannot send control message: not connected');
      return false;
    }

    try {
      const message = JSON.stringify({ type, ...data });
      this.ws.send(message);
      this.stats.messagesSent++;
      this.stats.lastActivity = Date.now();
      this.log(`Sent control message: ${type}`);
      return true;
    } catch (error) {
      this.log('Error sending control message', error);
      this.emit(WebSocketEvents.ERROR, error);
      return false;
    }
  }

  /**
   * Send interrupt signal to stop current generation
   */
  interrupt() {
    this.log('Sending interrupt signal');
    return this.sendControlMessage('interrupt');
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected() {
    return this.state === ConnectionState.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Get current connection state
   */
  getState() {
    return this.state;
  }

  /**
   * Get audio metadata (received from server)
   */
  getAudioMetadata() {
    return this.audioMetadata;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   */
  on(event, handler) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {function} handler - Event handler function
   */
  off(event, handler) {
    if (!this.eventListeners[event]) return;

    this.eventListeners[event] = this.eventListeners[event].filter(h => h !== handler);
  }

  /**
   * Remove all event listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      delete this.eventListeners[event];
    } else {
      this.eventListeners = {};
    }
  }

  /**
   * Emit event to all registered listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  emit(event, data) {
    const listeners = this.eventListeners[event] || [];
    listeners.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        this.log(`Error in event handler for ${event}`, error);
      }
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build WebSocket URL with query parameters
   * @private
   */
  _buildWebSocketURL() {
    const protocol = this.config.secure ? 'wss' : 'ws';
    const host = this.config.host;
    const port = this.config.port;

    let url = `${protocol}://${host}:${port}/ws`;

    // Add query parameters
    const params = [];
    if (this.conversationId) {
      params.push(`conversation_id=${encodeURIComponent(this.conversationId)}`);
    }
    if (this.characterIds.length > 0) {
      params.push(`character_ids=${this.characterIds.join(',')}`);
    }

    if (params.length > 0) {
      url += '?' + params.join('&');
    }

    return url;
  }

  /**
   * Handle incoming WebSocket message
   * @private
   */
  _handleMessage(event) {
    // Binary message (audio data)
    if (event.data instanceof ArrayBuffer) {
      this.stats.audioChunksReceived++;
      this.stats.bytesReceived += event.data.byteLength;

      // Emit audio chunk event
      this.emit(WebSocketEvents.AUDIO_CHUNK, {
        data: event.data,
        timestamp: Date.now(),
      });
      return;
    }

    // Text message (JSON)
    try {
      const message = JSON.parse(event.data);
      this.stats.messagesReceived++;
      this.stats.bytesReceived += event.data.length;

      this._handleJSONMessage(message);
    } catch (error) {
      this.log('Error parsing JSON message', error);
      this.emit(WebSocketEvents.ERROR, { type: 'parse_error', error });
    }
  }

  /**
   * Handle JSON message from server
   * @private
   */
  _handleJSONMessage(message) {
    const { type } = message;

    switch (type) {
      case 'metadata':
        // Audio format metadata
        this.audioMetadata = {
          sampleRate: message.sample_rate,
          channels: message.channels,
          format: message.format,
        };
        this.log('Received audio metadata', this.audioMetadata);
        this.emit(WebSocketEvents.METADATA, this.audioMetadata);
        break;

      case 'text_chunk':
        // Streaming text from LLM
        this.emit(WebSocketEvents.TEXT_CHUNK, {
          text: message.text,
          isFinal: message.is_final,
          speakerName: message.speaker_name,
          speakerId: message.speaker_id,
          sequenceNumber: message.sequence_number,
          chunkIndex: message.chunk_index,
          timestamp: Date.now(),
        });
        break;

      case 'speaker_change':
        // New character starts speaking
        this.emit(WebSocketEvents.SPEAKER_CHANGE, {
          speakerName: message.speaker_name,
          speakerId: message.speaker_id,
          sequenceNumber: message.sequence_number,
          timestamp: Date.now(),
        });
        break;

      case 'character_end':
        // Character finishes speaking
        this.emit(WebSocketEvents.CHARACTER_END, {
          sequenceNumber: message.sequence_number,
          timestamp: Date.now(),
        });
        break;

      case 'interrupt':
        // Playback interrupted
        this.log('Received interrupt signal', message.message);
        this.emit(WebSocketEvents.INTERRUPT, {
          message: message.message,
          timestamp: Date.now(),
        });
        break;

      default:
        this.log('Unknown message type:', type, message);
        break;
    }
  }

  /**
   * Schedule reconnection attempt
   * @private
   */
  _scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectAttempts++;
    this.state = ConnectionState.RECONNECTING;

    const delay = this.config.reconnectInterval * this.reconnectAttempts;
    this.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

    this.emit(WebSocketEvents.RECONNECTING, {
      attempt: this.reconnectAttempts,
      maxAttempts: this.config.maxReconnectAttempts,
      delay,
    });

    this.reconnectTimer = setTimeout(() => {
      this.connect(this.conversationId, this.characterIds)
        .catch(error => {
          this.log('Reconnection failed', error);

          if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            this.state = ConnectionState.FAILED;
            this.log('Max reconnection attempts reached');
          } else {
            this._scheduleReconnect();
          }
        });
    }, delay);
  }

  /**
   * Log message (if debug enabled)
   * @private
   */
  log(...args) {
    if (this.config.debug) {
      console.log('[WebSocket]', ...args);
    }
  }
}

/**
 * Create and export a singleton instance
 */
export const websocketManager = new WebSocketManager({
  debug: true,
});

/**
 * Export for convenience
 */
export default websocketManager;
