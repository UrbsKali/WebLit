// Main Entry Point
import { UIController } from './ui/uiHandler.js';
import { LLMHandler } from './core/LLMHandler.js';
import { VectorStore } from './core/vectorDB.js';
import { PDFProcessor } from './core/pdfParser.js';
import { ChatHistoryManager } from './core/chatHistory.js';
import { CONFIG } from './config.js';
import { $, formatBytes } from './utils/helpers.js';
import { marked } from 'marked';

class App {
    constructor() {
        this.config = CONFIG;
        
        // Initialize Core Components
        this.llm = new LLMHandler(CONFIG.DEFAULT_PARAMS);
        this.vectorStore = new VectorStore();
        this.pdfProcessor = new PDFProcessor(CONFIG.RAG);
        this.history = new ChatHistoryManager();

        // Initialize UI
        this.ui = new UIController(this);
    }

    async init() {
        console.log("App: Booting...");
        
        // Render UI
        this.ui.init();
        
        this.setupBindings();
        this.restoreSession();
        this.updateSideBarStats();
    }

    restoreSession() {
        // Load history into UI
        const msgs = this.history.getHistory();
        msgs.forEach(msg => {
            this.ui.appendMessage(msg.role, msg.content);
        });
    }

    updateSideBarStats() {
        this.ui.updateStats({
            historySize: formatBytes(this.history.getSizeBytes())
        });
        this.ui.renderSessionList(this.history.getSessions(), this.history.getCurrentId());
    }

    setupBindings() {
        // Bind Model Loading
        const loadBtn = $('#model-selector-container'); 
        
        document.addEventListener('click', async (e) => {
            // Load Model Button
            if (e.target.closest('#btn-load-model')) {
                const modelId = this.ui.modelSelector.selectedModel;
                await this.handleLoadModel(modelId);
            }

            // Clear History Button (Global Wipe)
            if (e.target.closest('#clear-history-btn')) {
                if(confirm('WARNING: This will delete ALL conversation history permanently. Are you sure?')) {
                    this.history.deleteAllSessions();
                    this.restoreSession();
                    this.updateSideBarStats();
                }
            }

            // Delete Individual Session
            if (e.target.closest('.delete-session')) {
                e.stopPropagation(); // Prevent clicking the session row
                const id = e.target.closest('.delete-session').dataset.id;
                if(confirm('Delete this conversation?')) {
                    this.history.deleteSession(id);
                    this.restoreSession(); // Re-load (it might switch to another session)
                    this.updateSideBarStats();
                }
            }

            // Switch Session
            const sessionRow = e.target.closest('[data-session-id]');
            if (sessionRow && !e.target.closest('.delete-session')) {
                const id = sessionRow.dataset.sessionId;
                if (id !== this.history.getCurrentId()) {
                    this.history.loadSession(id);
                    this.restoreSession();
                    this.updateSideBarStats();
                }
            }

            // New Chat Button
            if (e.target.closest('#btn-new-chat')) {
                this.history.createSession();
                this.restoreSession();
                this.updateSideBarStats();
                
                // Focus input if visible
                const input = $('#chat-input');
                if (input) input.focus();
            }
        });

        // Chat Event (Dispatched from Tabs.js)
        document.addEventListener('chat-message-send', async (e) => {
            await this.handleChatMessage(e.detail);
        });
    }

    restoreSession() {
        // Clear UI first
        this.ui.clearChat();
        
        // Load history into UI
        const msgs = this.history.getHistory();
        msgs.forEach(msg => {
            this.ui.appendMessage(msg.role, msg.content);
        });
    }

    async handleChatMessage(text) {
        if (!text.trim()) return;

        // 1. UI: Show User Message
        this.ui.appendMessage('user', text);
        this.history.addMessage('user', text);
        this.updateSideBarStats();

        // Check if model is loaded
        if (!this.llm.isLoaded) {
            this.ui.appendMessage('assistant', "⚠️ **Error**: Please load a model from the sidebar first.");
            return;
        }

        // 2. LLM: Generate Response
        // Create a placeholder for streaming
        // We'll append a dummy message to UI then update it
        // For simplicity, let's stream directly into a variable and then update specific DOM in UI
        // BUT UIHandler.appendMessage creates a new div.
        
        // Let's modify UI Handler later for proper streaming updates.
        // For now, let's just accumulate and append at the end (Vanilla approach step 1) 
        // OR better: Create a "StreamingMessage" bubble.
        
        // Refined approach:
        // We need the LLM to process the FULL history Context
        const messages = [
            { role: "system", content: CONFIG.DEFAULT_PARAMS.system_prompt },
            ...this.history.getContext()
        ];

        let msgContent = "";
        
        // We manually create a bot message container
        this.ui.appendMessage('assistant', '<span id="streaming-cursor">█</span>');
        
        // Find the last message body to update
        const chatContainer = $('#chat-history');
        const lastMsgBody = chatContainer.lastElementChild.querySelector('.prose');

        try {
            await this.llm.chat(messages, (chunk, fullText) => {
                msgContent = fullText;
                lastMsgBody.innerHTML = marked.parse(fullText); // Parse markdown on stream
                // chatContainer.scrollTop = chatContainer.scrollHeight;
            });
            
            // Save final response
            this.history.addMessage('assistant', msgContent);
            this.updateSideBarStats();

            // Auto-Generate Title
            this.checkForTitleGeneration(messages, msgContent);
            
        } catch (error) {
            console.error(error);
            lastMsgBody.innerHTML += `<br><span class="text-red-400">Error: ${error.message}</span>`;
        }
    }

    async checkForTitleGeneration(contextMessages, lastResponse) {
        // Only generate title if history is short (1 exchange) and title is default
        const history = this.history.getHistory();
        const currentSessionId = this.history.getCurrentId();
        const session = this.history.getSessions().find(s => s.id === currentSessionId);
        
        if (history.length <= 2 && session && session.title === "New Chat") {
            console.log("Generating conversation title...");
            const userMsg = contextMessages.find(m => m.role === 'user')?.content || "";
            
            const prompt = [
                { role: "system", content: "You are a concise expert summarizer. Generate a short title (max 5 words) that captures the specific subject of text. Use keywords only. Do NOT use full sentences. Do NOT use words like 'Conversation', 'Chat', 'Question', 'Here is'. Do NOT use quotes. Plain text only, NO markdown." },
                { role: "user", content: `Generate a keyword-focused title for this exchange:\n\nUser: ${userMsg}\nAssistant: ${lastResponse.substring(0, 200)}...\n\nTitle:` }
            ];

            try {
                // Run silent chat
                const title = await this.llm.chat(prompt);
                const cleanTitle = title.replace(/["']/g, '').replace(/^Title:\s*/i, '').trim();
                
                if (cleanTitle) {
                    this.history.renameSession(currentSessionId, cleanTitle);
                    this.updateSideBarStats(); // Refresh sidebar
                }
            } catch (e) {
                console.warn("Title generation failed", e);
            }
        }
    }

    async handleLoadModel(modelId) {
        this.ui.updateStatus('loading', 'Downloading Weights...');
        this.ui.showLoading(true, "Downloading Model", "Initializing...");

        try {
            await this.llm.loadModel(modelId, (progress) => {
                 this.ui.updateLoadingProgress(progress.text);
            });
            
            // Success
            this.ui.updateStatus('ready', 'Model Ready');
            this.ui.showLoading(false);
            
            // Optional: Notification or tiny toast
            console.log("Model loaded successfully");
        } catch (error) {
            console.error(error);
            this.ui.updateStatus('error', 'Load Failed');
            this.ui.showLoading(false); // Hide overlay to allow retry
            alert("Failed to load model. Check console for details.");
        }
    }
}

// Start App
const app = new App();
app.init();