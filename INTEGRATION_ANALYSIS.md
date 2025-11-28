# Frontend-Backend Integration Analysis & Plan

**Date:** 2025-11-28
**Project:** aiChat - Multi-Character Voice Chat Application
**Status:** Backend Complete | Frontend UI Complete | Integration Needed

---

## Executive Summary

Your project is a **sophisticated low-latency voice chat application** with multi-character support. The backend is remarkably complete and production-ready, while the frontend has excellent UI/UX but **zero backend connectivity**. This is a classic "two ships passing in the night" situation - both sides are well-built but not talking to each other.

**Good News:**
- Backend: Fully implemented voice pipeline (STT → LLM → TTS)
- Backend: Complete REST API (26 endpoints)
- Backend: Full Supabase integration
- Backend: WebSocket bidirectional audio streaming ready
- Frontend: Polished dark-themed UI
- Frontend: Working character management (local)
- Frontend: Rich text editor ready

**Gap:**
- **ZERO integration** between frontend and backend
- No WebSocket client code
- No API HTTP calls
- No audio capture/playback
- No real-time messaging

---

## Current State Assessment

### Backend Architecture ✅ PRODUCTION-READY

**Location:** `/backend/server.py` (1,620 lines)

#### Core Pipeline (Fully Implemented)
```
Browser Audio → STT Service → LLM Orchestrator → TTS Service (concurrent) → Audio Sequencer → Browser
```

#### Services Status

1. **STTService** (Lines 469-545) ✅
   - RealtimeSTT with faster_whisper
   - Model: "base.en"
   - Streams transcriptions in real-time
   - **Status:** COMPLETE

2. **LLMOrchestrator** (Lines 551-805) ✅
   - OpenRouter AsyncOpenAI
   - Default: "anthropic/claude-3.5-sonnet"
   - Multi-character turn-taking
   - Concurrent processing (Character N+1 starts when N's text completes)
   - Streams to both UI and TTS simultaneously
   - **Status:** COMPLETE

3. **HiggsTTSService** (Lines 811-1037) ✅
   - Higgs Audio v2 (bosonai/higgs-audio-v2-generation-3B-base)
   - Concurrent multi-character generation
   - Semaphore-based GPU limiting (max 3 concurrent)
   - Two methods: voice cloning + description-based
   - **Status:** COMPLETE

4. **AudioPlaybackSequencer** (Lines 1043-1159) ✅
   - Buffers audio chunks from concurrent TTS
   - Ensures sequential playback by sequence_number
   - Sends ordered audio to browser
   - **Status:** COMPLETE

5. **CharacterService** (Lines 301-463) ✅
   - Character mention parsing
   - Character-specific prompts
   - Response extraction
   - **Status:** COMPLETE

#### WebSocket Endpoint ✅

**`/ws`** (Lines 1431-1455)
- Query params: `conversation_id`, `character_ids`
- Bidirectional audio streaming
- Control messages (interrupt)
- **Status:** FULLY IMPLEMENTED

#### REST API Endpoints ✅

**26 Endpoints Across 4 Resources:**

**Characters** (8 endpoints):
- `GET /api/characters` - List all
- `GET /api/characters/active` - Active only
- `GET /api/characters/search?query=` - Search
- `GET /api/characters/{id}` - Get one
- `POST /api/characters` - Create
- `PUT /api/characters/{id}` - Update
- `PUT /api/characters/{id}/active` - Toggle active
- `DELETE /api/characters/{id}` - Delete

**Voices** (5 endpoints):
- `GET /api/voices` - List all
- `GET /api/voices/{voice}` - Get one
- `POST /api/voices` - Create
- `PUT /api/voices/{voice}` - Update
- `DELETE /api/voices/{voice}` - Delete

**Conversations** (8 endpoints):
- `GET /api/conversations` - List all
- `GET /api/conversations/{id}` - Get one
- `POST /api/conversations` - Create
- `PUT /api/conversations/{id}` - Update
- `PUT /api/conversations/{id}/characters` - Update characters
- `POST /api/conversations/{id}/characters/{char_id}` - Add character
- `DELETE /api/conversations/{id}/characters/{char_id}` - Remove character
- `DELETE /api/conversations/{id}` - Delete

**Messages** (5 endpoints):
- `GET /api/messages?conversation_id=` - Get messages
- `GET /api/messages/recent?conversation_id=&n=` - Recent N messages
- `GET /api/messages/last?conversation_id=` - Last message
- `POST /api/messages` - Create message
- `POST /api/messages/batch` - Batch create

#### Database Managers ✅

All fully implemented with Supabase:

1. **CharacterManager** (`character_manager.py`, 306 lines)
   - Sequential ID generation (e.g., "olivia-barns-001")
   - Full CRUD, search, active status
   - **Status:** COMPLETE

2. **VoiceManager** (`voice_manager.py`, 281 lines)
   - Voice caching with thread-safe locks
   - Audio tokens serialization
   - Two methods: description + clone
   - **Status:** COMPLETE

3. **ConversationManager** (`conversation_manager.py`, 291 lines)
   - Auto-title generation
   - Active characters list
   - Pagination support
   - **Status:** COMPLETE

4. **MessageManager** (`message_manager.py`, 261 lines)
   - Single + batch creation
   - Pagination, recent, last message
   - **Status:** COMPLETE

#### Database Schema

**Supabase Tables:**
- `characters` - Character definitions
- `voices` - Voice configurations
- `conversations` - Conversation metadata
- `messages` - Message history

**Credentials:**
```
URL: https://jslevsbvapopncjehhva.supabase.co
Key: eyJhbGci... (currently hardcoded)
```

#### Configuration

**Current Config** (Lines 1421-1429):
```python
CONFIG = {
    "openrouter_api_key": "YOUR_OPENROUTER_API_KEY",  # ⚠️ NEEDS TO BE SET
    "stt_model": "base.en",
    "llm_model": "anthropic/claude-3.5-sonnet",
    "higgs_model_path": "bosonai/higgs-audio-v2-generation-3B-base",
    "higgs_tokenizer_path": "bosonai/higgs-audio-v2-tokenizer",
    "device": "cuda",
    "max_concurrent_tts": 3
}
```

**Missing:**
- ❌ No `.env` file
- ❌ No environment variable loading for API keys
- ❌ No `requirements.txt` in backend/
- ⚠️ Supabase credentials hardcoded

---

### Frontend Architecture ⚠️ UI COMPLETE, NO BACKEND

**Location:** `/frontend/`

#### Files Structure

**HTML:**
- `index.html` - Main SPA shell

**JavaScript:**
- `main.js` - Navigation, sidebar, page routing
- `editor.js` - Tiptap rich text editor
- `characters.js` - Character CRUD (localStorage only)
- `components/components.js` - Reusable UI components

**CSS:**
- `styles.css` - Global styles, layout
- `editor.css` - Editor toolbar and content
- `characters.css` - Character page styles
- `components/components.css` - Component library

#### Implemented Features ✅

1. **Navigation System** (`main.js`)
   - Sidebar collapse/expand
   - Hash-based routing
   - Page transitions
   - localStorage state persistence
   - **Status:** COMPLETE (local only)

2. **Rich Text Editor** (`editor.js`)
   - Tiptap editor with full toolbar
   - Formatting: headings, lists, bold, italic, etc.
   - Code blocks, blockquotes, alignment
   - Color picker, links, images
   - **Status:** UI COMPLETE, no send functionality

3. **Character Management** (`characters.js`)
   - Full CRUD operations
   - Character list with search
   - Character card with tabs
   - Image upload (base64)
   - Form validation
   - Toast notifications
   - **Status:** COMPLETE (localStorage only)

4. **Component Library** (`components/components.js`, `components/components.css`)
   - Buttons, inputs, textareas
   - Dropdowns, tabs, toggles
   - 10 base block variations
   - **Status:** COMPLETE

#### Missing Features ❌

1. **WebSocket Client**
   - No WebSocket connection code
   - No audio streaming
   - No real-time message handling

2. **Audio Capture**
   - Mic button is a stub: `console.log("Microphone clicked")`
   - No audio recording
   - No audio chunking for streaming

3. **Audio Playback**
   - No audio decoding
   - No audio sequencing
   - No speaker output

4. **API Integration**
   - No HTTP client (fetch/axios)
   - No API service layer
   - Characters use localStorage instead of API

5. **Message Display**
   - Messages area is empty
   - No message rendering
   - No streaming text display

6. **Settings Pages**
   - Models page: placeholder
   - Chats page: placeholder
   - Agents page: placeholder
   - Speech page: placeholder
   - Settings page: placeholder

#### Stub Functions

**In `editor.js`:**
```javascript
handleMic() {
  console.log("Microphone clicked");
  // TODO: Implement voice input
}

handleSend() {
  const content = this.editor.getHTML();
  console.log("Sending content:", content);
  // TODO: Send to backend
}
```

#### Current Data Flow

```
User Input → localStorage ONLY
           → NO backend calls
           → NO persistence
```

---

## Integration Requirements

### Phase 1: Core Infrastructure ⚠️ CRITICAL

#### 1.1 WebSocket Client (`frontend/websocket.js`)

**Purpose:** Real-time bidirectional communication with backend

**Requirements:**
- Connect to `ws://localhost:8000/ws?conversation_id={id}&character_ids={ids}`
- Send audio chunks to backend
- Receive messages from backend:
  - `TranscriptionChunk` - Partial/final user transcriptions
  - `TextChunk` - Streaming LLM responses
  - `AudioChunk` - TTS audio data
  - `TurnComplete` - Character finished speaking
  - `Error` - Error messages
- Handle reconnection logic
- Queue messages during disconnection

**Integration Points:**
- Connect on app initialization
- Disconnect on page unload
- Emit events for UI updates

**Estimated Complexity:** MEDIUM (200-300 lines)

---

#### 1.2 API Service Layer (`frontend/api.js`)

**Purpose:** HTTP client for REST API calls

**Requirements:**
- Base URL configuration
- Error handling and retry logic
- Request/response interceptors
- CRUD methods for all resources:
  - Characters: list, get, create, update, delete, search
  - Voices: list, get, create, update, delete
  - Conversations: list, get, create, update, delete, manage characters
  - Messages: list, create, get recent/last

**Integration Points:**
- Replace localStorage in `characters.js`
- Use for conversation management
- Use for message history

**Estimated Complexity:** MEDIUM (300-400 lines)

---

### Phase 2: Audio Pipeline ⚠️ HIGH PRIORITY

#### 2.1 STT Audio Capture (`frontend/audio-capture.js`)

**Purpose:** Capture user microphone input and stream to backend

**Requirements:**
- Request microphone permissions
- Use Web Audio API / MediaRecorder
- Capture audio in chunks (e.g., 100ms intervals)
- Convert to format expected by backend (likely PCM 16-bit)
- Send chunks via WebSocket
- Visual feedback (recording indicator, waveform)
- Push-to-talk OR voice activity detection (VAD)

**Integration Points:**
- Hook into `handleMic()` in editor.js
- Start/stop recording UI controls
- Send audio chunks to WebSocket client

**Estimated Complexity:** MEDIUM-HIGH (300-400 lines)

**Browser APIs:**
- `navigator.mediaDevices.getUserMedia()`
- `MediaRecorder` or `AudioContext` + `ScriptProcessorNode`/`AudioWorklet`

---

#### 2.2 TTS Audio Playback (`frontend/audio-playback.js`)

**Purpose:** Receive and play audio stream from backend

**Requirements:**
- Receive audio chunks from WebSocket
- Decode audio (likely base64 → ArrayBuffer → AudioBuffer)
- Queue audio chunks by sequence_number
- Play sequentially without gaps
- Handle interruptions (stop playing, clear queue)
- Visual feedback (speaking indicator, audio visualization)

**Integration Points:**
- Listen to WebSocket `AudioChunk` messages
- Update UI when character speaks
- Stop playback on user interrupt

**Estimated Complexity:** MEDIUM (250-350 lines)

**Browser APIs:**
- `AudioContext`
- `AudioBufferSourceNode`
- `decodeAudioData()`

---

### Phase 3: Chat UI ⚠️ HIGH PRIORITY

#### 3.1 Message Display (`frontend/messages.js`)

**Purpose:** Display chat history and streaming responses

**Requirements:**
- Render message list (user + assistant messages)
- Support multiple characters (avatar, name, styling)
- Streaming text display (character-by-character or chunk-by-chunk)
- Markdown rendering for rich content
- Auto-scroll to latest message
- Loading indicators
- Error message display

**Integration Points:**
- Render in `.messages` area of Home page
- Listen to WebSocket `TextChunk` messages
- Load history via API on conversation start

**Estimated Complexity:** MEDIUM (300-400 lines)

**UI Updates:**
```html
<div class="message user">
  <div class="message-avatar">👤</div>
  <div class="message-content">Hello!</div>
</div>

<div class="message assistant">
  <div class="message-avatar">
    <img src="character.image_url" />
  </div>
  <div class="message-header">Character Name</div>
  <div class="message-content">
    Streaming response appears here...
  </div>
</div>
```

---

#### 3.2 Conversation Management (`frontend/conversations.js`)

**Purpose:** Create, load, switch conversations

**Requirements:**
- List conversations in sidebar
- Create new conversation
- Load conversation (messages + characters)
- Switch active conversation (reload UI)
- Delete conversation
- Update conversation title
- Add/remove characters from conversation

**Integration Points:**
- Add to sidebar (below "Chats" nav link)
- Load messages on conversation switch
- Pass conversation_id to WebSocket connection

**Estimated Complexity:** MEDIUM (250-350 lines)

---

#### 3.3 Model Settings (`frontend/settings.js`)

**Purpose:** Configure LLM model and parameters

**Requirements:**
- Model selection (OpenRouter models)
- Parameters: temperature, max_tokens, top_p, etc.
- Save settings to localStorage or backend
- Apply settings to LLM requests

**Current Backend Support:**
- Model is hardcoded in `server.py` line 1424: `"anthropic/claude-3.5-sonnet"`
- **Backend changes needed:** Accept model/parameters via WebSocket or API

**Integration Points:**
- Settings page UI
- Send settings with conversation start

**Estimated Complexity:** LOW-MEDIUM (150-250 lines)

---

### Phase 4: Database Integration ⚠️ MEDIUM PRIORITY

#### 4.1 Character Sync (`frontend/characters.js`)

**Purpose:** Replace localStorage with API calls

**Changes Needed:**
- `loadCharacters()` → `GET /api/characters`
- `saveCharacter(char)` → `POST /api/characters` or `PUT /api/characters/{id}`
- `deleteCharacter(id)` → `DELETE /api/characters/{id}`
- `searchCharacters(query)` → `GET /api/characters/search?query={query}`
- Handle async/await and loading states
- Error handling with toasts

**Integration Points:**
- Use `api.js` service layer
- Update UI on API responses

**Estimated Complexity:** LOW (30-50 line changes)

---

#### 4.2 Voice Management UI

**Purpose:** Manage voice configurations

**Requirements:**
- List voices from `GET /api/voices`
- Create voice (description method):
  - Voice name
  - Speaker description
  - Scene prompt
  - Generate and cache audio tokens
- Create voice (clone method):
  - Upload audio file
  - Upload text transcript
  - Generate and cache audio tokens
- Update/delete voices
- Voice preview (play sample)

**Current Status:**
- Backend fully supports voice CRUD
- Frontend has NO voice management UI

**Integration Points:**
- Add "Voices" page (currently placeholder)
- Use in character creation (voice dropdown)

**Estimated Complexity:** MEDIUM-HIGH (400-500 lines)

**Note:** Voice cloning requires uploading audio files to backend (add upload endpoint)

---

### Phase 5: Polish & Features 🎨 LOW PRIORITY

#### 5.1 Notification System

- Toast notifications for errors/success
- Connection status indicator
- Audio recording indicator
- Character speaking indicator

**Status:** Toast system exists in `characters.js`, expand globally

---

#### 5.2 Responsive Design

- Mobile layout adjustments
- Touch controls for audio
- Responsive sidebar

**Status:** CSS has some responsive breakpoints, needs testing

---

#### 5.3 Accessibility

- ARIA labels
- Keyboard shortcuts
- Screen reader support

**Status:** Minimal accessibility currently

---

## Missing from Your List

You identified these 5 areas, here's what else is needed:

### ✅ You Identified:
1. WebSocket frontend handler ✅
2. STT Audio capture ✅
3. Chat UI with streaming ✅
4. TTS Audio playback ✅
5. Database integration ✅

### ❌ You Missed:

6. **API Service Layer** - HTTP client for REST endpoints
7. **Conversation Management** - Create/load/switch conversations
8. **Model Settings UI** - Configure LLM parameters
9. **Voice Management UI** - Create/edit/delete voices
10. **Message History Loading** - Load past messages on conversation start
11. **Character Selection UI** - Choose active characters for conversation
12. **Error Handling** - Global error handling and user feedback
13. **Loading States** - Spinners, skeletons, progress indicators
14. **Authentication** - User login/session (if multi-user)
15. **Environment Configuration** - `.env` for API keys and URLs
16. **Reconnection Logic** - Handle WebSocket disconnections gracefully
17. **Audio Interruption** - Stop audio and clear queues on user input
18. **Transcription Display** - Show STT results in real-time (partial + final)
19. **Turn-Taking UI** - Visual indicator of which character is speaking
20. **Voice Preview** - Play voice samples when selecting voice

---

## Recommended Implementation Order

### Sprint 1: Foundation (Week 1)
**Goal:** Get basic text chat working

1. ✅ **Environment Setup**
   - Create `.env` file with API keys
   - Add environment variable loading to backend
   - Document required dependencies

2. ✅ **API Service Layer** (`frontend/api.js`)
   - Implement HTTP client
   - Add error handling
   - Test all endpoints

3. ✅ **Message Display** (`frontend/messages.js`)
   - Render message list
   - Streaming text display
   - Auto-scroll

4. ✅ **Conversation Management** (`frontend/conversations.js`)
   - Create conversation
   - Load conversation
   - Switch conversations

5. ✅ **Text-Only Chat**
   - Send text via API (not voice)
   - Display streaming responses
   - Save to database

**Deliverable:** Working text chat with persistence

---

### Sprint 2: Audio Pipeline (Week 2)
**Goal:** Get voice chat working

1. ✅ **WebSocket Client** (`frontend/websocket.js`)
   - Connect to backend
   - Send/receive messages
   - Handle reconnection

2. ✅ **STT Audio Capture** (`frontend/audio-capture.js`)
   - Capture microphone
   - Send audio chunks
   - Visual feedback

3. ✅ **TTS Audio Playback** (`frontend/audio-playback.js`)
   - Receive audio chunks
   - Play sequentially
   - Handle interruptions

4. ✅ **Transcription Display**
   - Show STT partial results
   - Show final transcription

5. ✅ **End-to-End Voice Chat**
   - Speak → STT → LLM → TTS → Hear

**Deliverable:** Working voice chat with audio I/O

---

### Sprint 3: Character & Voice Management (Week 3)
**Goal:** Full character and voice features

1. ✅ **Character API Integration**
   - Replace localStorage with API
   - Sync characters with backend

2. ✅ **Voice Management UI**
   - List voices
   - Create voice (description + clone)
   - Voice preview

3. ✅ **Character Selection**
   - Choose active characters for conversation
   - Add/remove characters mid-conversation

4. ✅ **Multi-Character Turn-Taking**
   - Visual indicator of speaker
   - Character avatars in messages

**Deliverable:** Full character/voice management

---

### Sprint 4: Settings & Polish (Week 4)
**Goal:** Complete the app

1. ✅ **Model Settings UI**
   - Model selection
   - Parameter configuration
   - Save/load settings

2. ✅ **Error Handling**
   - Global error handler
   - User-friendly error messages
   - Retry logic

3. ✅ **Loading States**
   - Spinners and progress indicators
   - Skeleton screens

4. ✅ **Responsive Design**
   - Mobile layout
   - Touch controls

5. ✅ **Accessibility**
   - ARIA labels
   - Keyboard shortcuts

**Deliverable:** Production-ready app

---

## Technical Specifications

### WebSocket Message Protocol

**Backend → Frontend Messages:**

```typescript
// Transcription (STT output)
{
  type: "transcription_chunk",
  is_final: boolean,
  text: string,
  timestamp: number
}

// LLM Text (streaming)
{
  type: "text_chunk",
  character_id: string,
  text: string,
  sequence_number: number
}

// TTS Audio
{
  type: "audio_chunk",
  character_id: string,
  audio_data: string,  // base64 encoded
  sequence_number: number,
  format: "pcm" | "wav" | "mp3"
}

// Turn complete
{
  type: "turn_complete",
  character_id: string,
  sequence_number: number
}

// Error
{
  type: "error",
  message: string,
  code?: string
}
```

**Frontend → Backend Messages:**

```typescript
// Audio chunk (STT input)
{
  type: "audio_chunk",
  audio_data: string,  // base64 encoded
  format: "pcm" | "wav",
  sample_rate: number,
  channels: number
}

// Interrupt
{
  type: "interrupt"
}

// Settings (if dynamic)
{
  type: "settings",
  model: string,
  temperature: number,
  max_tokens: number,
  // ...other params
}
```

---

### Audio Formats

**STT Input (Frontend → Backend):**
- Format: PCM 16-bit or WAV
- Sample rate: 16000 Hz (faster_whisper expects this)
- Channels: 1 (mono)
- Chunk size: 100-200ms recommended
- Encoding: base64 string

**TTS Output (Backend → Frontend):**
- Format: PCM 16-bit or WAV (check Higgs output)
- Sample rate: 22050 Hz or 24000 Hz (check Higgs)
- Channels: 1 (mono)
- Encoding: base64 string

**Action Item:** Verify Higgs Audio output format in `backend/server.py` around line 900-950

---

### API Client Structure

**Recommended structure for `frontend/api.js`:**

```javascript
class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(method, endpoint, data = null) {
    // Fetch with error handling
  }

  // Characters
  async getCharacters() { ... }
  async getCharacter(id) { ... }
  async createCharacter(data) { ... }
  async updateCharacter(id, data) { ... }
  async deleteCharacter(id) { ... }
  async searchCharacters(query) { ... }

  // Voices
  async getVoices() { ... }
  async getVoice(voice) { ... }
  async createVoice(data) { ... }
  async updateVoice(voice, data) { ... }
  async deleteVoice(voice) { ... }

  // Conversations
  async getConversations() { ... }
  async getConversation(id) { ... }
  async createConversation(data) { ... }
  async updateConversation(id, data) { ... }
  async deleteConversation(id) { ... }
  async addCharacterToConversation(convId, charId) { ... }
  async removeCharacterFromConversation(convId, charId) { ... }

  // Messages
  async getMessages(conversationId) { ... }
  async getRecentMessages(conversationId, n) { ... }
  async getLastMessage(conversationId) { ... }
  async createMessage(data) { ... }
  async createMessages(messages) { ... }
}

export const api = new APIClient('http://localhost:8000');
```

---

## Backend Configuration Needed

### 1. Environment Variables

**Create `backend/.env`:**
```bash
# API Keys
OPENROUTER_API_KEY=your_openrouter_key_here

# Supabase
SUPABASE_URL=https://jslevsbvapopncjehhva.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...

# Server
HOST=0.0.0.0
PORT=8000

# Models
STT_MODEL=base.en
LLM_MODEL=anthropic/claude-3.5-sonnet
HIGGS_MODEL_PATH=bosonai/higgs-audio-v2-generation-3B-base
HIGGS_TOKENIZER_PATH=bosonai/higgs-audio-v2-tokenizer

# Device
DEVICE=cuda  # or "cpu"
MAX_CONCURRENT_TTS=3
```

**Update `server.py`:**
```python
from dotenv import load_dotenv
load_dotenv()

CONFIG = {
    "openrouter_api_key": os.getenv("OPENROUTER_API_KEY"),
    "stt_model": os.getenv("STT_MODEL", "base.en"),
    "llm_model": os.getenv("LLM_MODEL", "anthropic/claude-3.5-sonnet"),
    # ...
}
```

---

### 2. CORS Configuration

**Update CORS in `server.py`:**

Current CORS allows all origins. Verify this is correct for production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Change to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Recommended for development:**
```python
allow_origins=[
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Common dev port
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]
```

---

### 3. Dependencies Documentation

**Create `backend/requirements.txt`:**
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==12.0
python-multipart==0.0.6
openai==1.3.5
supabase==2.0.3
torch==2.1.0
numpy==1.24.3
python-dotenv==1.0.0

# STT
faster-whisper==0.9.0
sounddevice==0.4.6
webrtcvad==2.0.10

# TTS (Higgs)
transformers==4.35.2
accelerate==0.24.1
```

**Note:** Verify versions by checking imports in `server.py` and libraries

---

### 4. Upload Endpoint for Voice Cloning

**Add to `server.py`:**
```python
from fastapi import UploadFile, File

@app.post("/api/voices/upload")
async def upload_voice_audio(
    file: UploadFile = File(...),
    voice_name: str = Query(...)
):
    """Upload audio file for voice cloning"""
    # Save file to backend/voices/
    # Return file path
    pass
```

---

## Frontend Configuration Needed

### 1. Environment Variables

**Create `frontend/.env`:**
```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_WS_BASE_URL=ws://localhost:8000
```

**Update `api.js`:**
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
```

**Update `websocket.js`:**
```javascript
const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8000';
```

---

### 2. Build Tool (Optional but Recommended)

Consider adding Vite for:
- Environment variable support
- Module bundling
- Hot module reload
- Production builds

**Create `package.json`:**
```json
{
  "name": "aichat-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  }
}
```

**Create `vite.config.js`:**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'frontend',
  server: {
    port: 5173
  }
});
```

**Alternative:** Continue with plain HTML/JS served statically

---

## Testing Strategy

### Backend Testing

**Create `backend/tests/`:**
- `test_stt.py` - Test STT service
- `test_llm.py` - Test LLM orchestrator
- `test_tts.py` - Test TTS service
- `test_api.py` - Test REST endpoints
- `test_websocket.py` - Test WebSocket connection

**Run with pytest:**
```bash
cd backend
pytest tests/
```

---

### Frontend Testing

**Manual Testing Checklist:**
- [ ] WebSocket connection established
- [ ] Audio recording starts/stops
- [ ] Audio chunks sent to backend
- [ ] Transcription displays in real-time
- [ ] LLM responses stream character-by-character
- [ ] Audio playback works sequentially
- [ ] Multiple characters take turns correctly
- [ ] Interruption stops audio and clears queues
- [ ] Conversation history loads on page refresh
- [ ] Character CRUD syncs with backend
- [ ] Error messages display appropriately

---

### Integration Testing

**End-to-End Flows:**
1. **Voice Chat Flow:**
   - User clicks mic
   - User speaks "Hello"
   - STT transcribes "Hello"
   - LLM generates "Hi there! How can I help?"
   - TTS plays audio
   - Message saved to database

2. **Multi-Character Flow:**
   - User says "@Olivia @Mark what do you think?"
   - Both characters respond
   - Characters respond in sequence
   - Both messages saved to database

3. **Interruption Flow:**
   - Character starts speaking
   - User clicks mic (interrupt)
   - Audio stops immediately
   - Queues cleared
   - User speaks new message

---

## Performance Considerations

### Latency Targets

**Voice Chat Pipeline:**
- STT: ~100-300ms (depends on pause detection)
- LLM: ~500ms to first token (streaming)
- TTS: ~200-500ms to first audio chunk
- **Total perceived latency: ~1-2 seconds** from user stops speaking to first audio

**Optimization Opportunities:**
- Concurrent LLM/TTS processing ✅ Already implemented
- WebSocket binary frames (instead of base64 JSON)
- Audio chunk buffering (implement jitter buffer)
- Predictive TTS generation (start TTS before LLM finishes)

---

### Bandwidth Considerations

**Audio Streaming:**
- STT input: 16kHz 16-bit mono PCM = ~32 KB/s
- TTS output: 22kHz 16-bit mono PCM = ~44 KB/s
- Per character in multi-character mode

**Optimization:**
- Use audio compression (Opus codec)
- Adjust sample rates if quality allows
- Implement adaptive bitrate

---

## Security Considerations

### 1. API Key Exposure
- ⚠️ OpenRouter API key in backend only (never frontend)
- ⚠️ Supabase anon key is safe to expose (RLS protects data)

### 2. Input Validation
- Validate audio chunk size/format
- Sanitize user text input
- Rate limiting on API endpoints

### 3. Authentication
- **Current:** No authentication (single-user app)
- **Future:** Add user login for multi-user
- Use Supabase Auth or JWT tokens

### 4. CORS
- Restrict origins in production
- Use HTTPS in production

---

## Deployment Considerations

### Backend Deployment

**Requirements:**
- Python 3.10+
- CUDA-capable GPU (for TTS)
- 16GB+ RAM
- 10GB+ disk (for models)

**Recommended Platforms:**
- RunPod (GPU instances)
- Vast.ai (cheap GPU)
- AWS EC2 (g4dn.xlarge or better)
- GCP Compute Engine (with GPU)

**Docker Setup (Recommended):**
```dockerfile
FROM nvidia/cuda:11.8.0-runtime-ubuntu22.04

RUN apt-get update && apt-get install -y python3.10 python3-pip

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Frontend Deployment

**Static Hosting Options:**
- Vercel (recommended)
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- GitHub Pages

**Build for Production:**
```bash
cd frontend
npm run build  # If using Vite
# Output to frontend/dist/
```

**Environment Variables:**
- Set `VITE_API_BASE_URL` to production backend URL
- Set `VITE_WS_BASE_URL` to production WebSocket URL

---

## Risk Assessment

### High Risk ⚠️

1. **Audio format mismatch** - Frontend sends format backend doesn't expect
   - **Mitigation:** Document exact format, add validation

2. **WebSocket instability** - Connection drops frequently
   - **Mitigation:** Implement reconnection logic, queue messages

3. **Latency too high** - User experience suffers
   - **Mitigation:** Profile pipeline, optimize bottlenecks

4. **GPU out of memory** - Too many concurrent TTS requests
   - **Mitigation:** Adjust `max_concurrent_tts`, add queue

### Medium Risk ⚠️

1. **Browser compatibility** - Audio APIs not supported
   - **Mitigation:** Test on Chrome, Firefox, Safari; show warnings

2. **CORS issues** - Backend rejects frontend requests
   - **Mitigation:** Configure CORS properly

3. **API key not set** - Backend crashes on startup
   - **Mitigation:** Validate env vars on startup, show error

### Low Risk ⚠️

1. **Styling issues** - UI breaks on some screens
   - **Mitigation:** Test responsive design

2. **Database connection issues** - Supabase down or credentials wrong
   - **Mitigation:** Add health check endpoint, retry logic

---

## Success Criteria

### MVP (Minimum Viable Product)

✅ **Phase 1 Complete:**
- User can send text messages via editor
- Messages display in chat area
- Messages save to database
- Conversations can be created/loaded

✅ **Phase 2 Complete:**
- User can speak into microphone
- Speech transcribed in real-time
- LLM generates text response (streaming)
- TTS plays audio response
- Full voice chat loop works

✅ **Phase 3 Complete:**
- Characters can be created/edited via UI
- Characters sync with backend
- Multiple characters can participate in conversation
- Voices can be managed (at minimum: description method)

### Full Product

✅ **All MVP + Phase 4:**
- Model settings configurable
- Voice cloning UI works
- Error handling robust
- Loading states polished
- Responsive on mobile

---

## Next Steps

### Immediate Actions (This Week)

1. **✅ Set up environment:**
   - Create `backend/.env` with OpenRouter API key
   - Add `python-dotenv` to backend
   - Test backend starts without errors

2. **✅ Create API service layer:**
   - Write `frontend/api.js`
   - Test all REST endpoints
   - Handle errors gracefully

3. **✅ Implement message display:**
   - Write `frontend/messages.js`
   - Render message list in Home page
   - Add auto-scroll

4. **✅ Create conversation management:**
   - Write `frontend/conversations.js`
   - Add conversation list to sidebar
   - Create/load/switch conversations

5. **✅ Basic text chat:**
   - Update `editor.js` `handleSend()` to use API
   - Send text message
   - Display in chat
   - Verify saves to database

### Next Week

1. **✅ Implement WebSocket client**
2. **✅ Implement audio capture**
3. **✅ Implement audio playback**
4. **✅ Connect end-to-end voice chat**
5. **✅ Test with single character**

### Following Weeks

1. **✅ Multi-character support**
2. **✅ Voice management UI**
3. **✅ Settings and polish**
4. **✅ Deploy and test**

---

## Resources & Documentation

### Backend APIs
- OpenRouter: https://openrouter.ai/docs
- Higgs Audio: See `backend/boson_multimodal/readme-higgs.md`
- RealtimeSTT: See `backend/RealtimeSTT/`
- Supabase: https://supabase.com/docs

### Frontend APIs
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
- MediaRecorder: https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder
- WebSocket: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- Tiptap: https://tiptap.dev/docs

### Libraries to Consider
- **Audio Processing:** Opus codec, Web Audio API utilities
- **WebSocket:** Reconnecting-websocket library
- **HTTP Client:** Axios (alternative to fetch)
- **State Management:** Consider if app grows (Zustand, Redux)

---

## Conclusion

You have a **remarkably complete backend** with sophisticated concurrent processing and a **polished frontend UI**. The gap is purely in integration - connecting the two layers.

The work ahead is:
1. **~1,200-1,500 lines of JavaScript** for integration layer
2. **~100 lines of Python** for configuration and env vars
3. **Testing and polish**

**Estimated Timeline:**
- **Sprint 1 (Text Chat):** 1 week
- **Sprint 2 (Voice Chat):** 1 week
- **Sprint 3 (Characters/Voices):** 1 week
- **Sprint 4 (Polish):** 1 week
- **Total: 4 weeks to production-ready app**

This is very achievable given the solid foundation on both sides. The architecture is sound, the UI is polished, and the backend is production-ready. Integration is straightforward implementation work.

---

## Questions to Resolve

Before starting implementation, clarify:

1. **Audio format:** What exact format does Higgs output? (check `server.py:900-950`)
2. **Authentication:** Single-user or multi-user app?
3. **Hosting:** Where will you deploy? (affects config)
4. **Browser support:** Chrome only or cross-browser?
5. **Mobile:** Priority for mobile or desktop-first?
6. **Voice cloning:** Description method only or both methods?
7. **Model settings:** Configurable at runtime or hardcoded?
8. **Conversation sharing:** Can conversations be shared between users?

---

**End of Analysis**

Ready to proceed with implementation? I recommend starting with Sprint 1 to get basic text chat working, then moving to voice in Sprint 2.
