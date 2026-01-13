import { STORAGE_KEYS } from '../config.js';
import { uuidv4 } from '../utils/helpers.js';

export class ChatHistoryManager {
    constructor() {
        this.currentSessionId = null;
        this.sessions = []; // Metadata: { id, title, timestamp, preview }
        this.messages = [];
        this.init();
    }

    init() {
        // Load session index
        const index = localStorage.getItem('weblit_sessions');
        if (index) {
            this.sessions = JSON.parse(index);
        }

        // Migration Check: If old single-history exists but no sessions
        const legacy = localStorage.getItem(STORAGE_KEYS.HISTORY);
        if (legacy && this.sessions.length === 0) {
            this.createSession("Legacy Chat", JSON.parse(legacy));
            localStorage.removeItem(STORAGE_KEYS.HISTORY);
        } else if (this.sessions.length > 0) {
            // Load most recent
            this.loadSession(this.sessions[0].id);
        } else {
            // New Start
            this.createSession();
        }
    }

    createSession(title = "New Chat", initialMessages = [], type = "chat") {
        const id = crypto.randomUUID();
        const newSession = {
            id,
            title,
            timestamp: Date.now(),
            preview: "Empty conversation",
            type: type
        };
        
        this.sessions.unshift(newSession); // Add to top
        this.saveSessionsIndex();
        
        this.currentSessionId = id;
        this.messages = initialMessages;
        this.saveMessages();
        
        return id;
    }

    loadSession(id) {
        const stored = localStorage.getItem(`weblit_session_${id}`);
        this.messages = stored ? JSON.parse(stored) : [];
        this.currentSessionId = id;
        
        // Move to top of list
        const idx = this.sessions.findIndex(s => s.id === id);
        if (idx > -1) {
            const session = this.sessions.splice(idx, 1)[0];
            this.sessions.unshift(session);
            this.saveSessionsIndex();
        }
    }

    saveSessionsIndex() {
        localStorage.setItem('weblit_sessions', JSON.stringify(this.sessions));
    }

    saveMessages() {
        if (!this.currentSessionId) return;
        
        localStorage.setItem(`weblit_session_${this.currentSessionId}`, JSON.stringify(this.messages));
        
        // Update preview in index
        if (this.messages.length > 0) {
            const lastMsg = this.messages[this.messages.length - 1];
            const session = this.sessions.find(s => s.id === this.currentSessionId);
            if (session) {
                session.preview = lastMsg.content.substring(0, 50) + "...";
                // Note: Title is now handled externally/manually
                session.timestamp = Date.now();
                this.saveSessionsIndex();
            }
        }
    }

    renameSession(id, newTitle) {
        const session = this.sessions.find(s => s.id === id);
        if (session) {
            session.title = newTitle;
            this.saveSessionsIndex();
        }
    }

    getSessions() {
        return this.sessions;
    }

    getCurrentId() {
        return this.currentSessionId;
    }

    deleteSession(id) {
        this.sessions = this.sessions.filter(s => s.id !== id);
        this.saveSessionsIndex();
        localStorage.removeItem(`weblit_session_${id}`);
        
        if (this.currentSessionId === id) {
            if (this.sessions.length > 0) {
                this.loadSession(this.sessions[0].id);
            } else {
                this.createSession();
            }
        }
    }

    addMessage(role, content, metadata = {}) {
        this.messages.push({ role, content, timestamp: Date.now(), ...metadata });
        this.saveMessages();
    }

    getHistory() {
        return this.messages;
    }

    getContext() {
        return this.messages.map(m => ({ role: m.role, content: m.content }));
    }

    clear() {
        this.messages = [];
        this.saveMessages();
    }

    deleteAllSessions() {
        // Find all session keys
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('weblit_')) {
                keysToRemove.push(key);
            }
        }
        
        // Remove them
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Reset state
        this.sessions = [];
        this.currentSessionId = null;
        this.messages = [];
        
        // Create fresh start
        this.createSession();
    }

    getSizeBytes() {
        // Approximate total size of all sessions
        let total = 0;
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('weblit_')) {
                total += localStorage.getItem(key).length;
            }
        }
        return total;
    }
}