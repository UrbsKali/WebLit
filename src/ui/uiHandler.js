import { $ } from '../utils/helpers.js';
import { ModelSelector } from './components/modelSelector.js';
import { TabManager } from './components/tabs.js';
import { SettingsView } from './components/settings.js';
import { marked } from 'marked';

export class UIController {
    constructor(appContext) {
        this.context = appContext;
        
        // Components
        this.modelSelector = new ModelSelector(this.context);
        this.tabs = new TabManager(this.context);
        this.settings = new SettingsView(this.context);
        
        // DOM Elements
        this.elements = {
            viewport: $('#viewport'),
            // Updated status elements
            statusTrigger: $('#model-status-trigger'),
            statusPopup: $('#status-popup'),
            statusDot: $('.status-dot'),
            statusText: $('.status-text'),
            contextPanel: $('#active-context-panel'),
            sidebar: $('#main-sidebar'),
            sidebarToggle: $('#sidebar-toggle'),
            sidebarClose: $('#sidebar-close'),
            sidebarBackdrop: $('#sidebar-backdrop'),
            // Loading Overlay
            loadingOverlay: $('#loading-overlay'),
            loadingTitle: $('#loading-title'),
            loadingText: $('#loading-text'),
            loadingBar: $('#loading-bar')
        };
    }

    init() {
        console.log("UI: Initializing...");
        
        // Render Components
        this.modelSelector.render($('#model-selector-container'));
        this.tabs.init($('#main-nav'));
        this.settings.init(); // Setup modal listeners
        
        // Setup Responsive Sidebar
        this.bindSidebarEvents();

        // Setup Status Popup
        this.bindStatusEvents();

        // Setup Keyboard Shortcuts
        this.bindKeyboardShortcuts();

        // Switch to default tab
        this.tabs.switchTab('chat');
    }

    bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Tab to cycle application tabs
            // We use preventDefault to avoid moving focus while switching views
            if (e.key === 'Tab') {
                e.preventDefault();
                this.tabs.nextTab();
            }

            // Ctrl + Enter to Send
            if (e.ctrlKey && e.key === 'Enter') {
                const activeElement = document.activeElement;
                if (activeElement.tagName === 'TEXTAREA') {
                    // Try to find the associated send button (usually sibling or parent container)
                    const parent = activeElement.closest('.relative');
                    if (parent) {
                        const btn = parent.querySelector('button');
                        if (btn) {
                            btn.click();
                            activeElement.blur();
                        }
                    }
                }
            }
        });
    }

    bindStatusEvents() {
        if (this.elements.statusTrigger && this.elements.statusPopup) {
            this.elements.statusTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.elements.statusPopup.classList.toggle('hidden');
            });

            // Close when clicking outside
            document.addEventListener('click', (e) => {
                if (!this.elements.statusTrigger.contains(e.target) && !this.elements.statusPopup.contains(e.target)) {
                    this.elements.statusPopup.classList.add('hidden');
                }
            });
        }
    }

    bindSidebarEvents() {
        const toggleSidebar = (show) => {
            if (show) {
                this.elements.sidebar.classList.remove('-translate-x-full');
                this.elements.sidebarBackdrop.classList.remove('hidden');
            } else {
                this.elements.sidebar.classList.add('-translate-x-full');
                this.elements.sidebarBackdrop.classList.add('hidden');
            }
        };

        if (this.elements.sidebarToggle) {
            this.elements.sidebarToggle.addEventListener('click', () => toggleSidebar(true));
        }

        if (this.elements.sidebarClose) {
            this.elements.sidebarClose.addEventListener('click', () => toggleSidebar(false));
        }

        if (this.elements.sidebarBackdrop) {
            this.elements.sidebarBackdrop.addEventListener('click', () => toggleSidebar(false));
        }
    }

    updateStatus(state, message) {
        const colors = {
            'ready': 'bg-emerald-500',
            'loading': 'bg-amber-500 animate-pulse',
            'error': 'bg-red-500',
            'idle': 'bg-slate-600'
        };
        
        if (this.elements.statusDot) {
            this.elements.statusDot.className = `w-2.5 h-2.5 rounded-full transition-colors status-dot ${colors[state] || colors.idle}`;
        }
        
        if (this.elements.statusText) {
            this.elements.statusText.textContent = message;
        }
    }

    showLoading(show, title = "Loading...", text = "") {
        if (show) {
            this.elements.loadingOverlay.classList.remove('hidden');
            this.elements.loadingTitle.textContent = title;
            this.updateLoadingProgress(text, 0); // Reset or init
        } else {
            this.elements.loadingOverlay.classList.add('hidden');
        }
    }

    updateLoadingProgress(text, percent = null) {
        if (this.elements.loadingText) this.elements.loadingText.textContent = text;
        
        // Match standard WebLLM progress format like "Loading (50%)" or use explicit percent
        if (percent === null) {
            const match = text.match(/(\d+)%/);
            if (match) {
                percent = parseInt(match[1]);
            } else if (text.includes("Finish")) {
                percent = 90; // Almost there
            }
        }
        
        if (percent !== null && this.elements.loadingBar) {
            this.elements.loadingBar.style.width = `${percent}%`;
        }
    }

    updateStats(stats) {
         if (stats.docs !== undefined) $('#stat-docs').textContent = stats.docs;
         if (stats.chunks !== undefined) $('#stat-chunks').textContent = stats.chunks;
         if (stats.historySize !== undefined) $('#stat-history-size').textContent = stats.historySize;
         if (stats.docsSize !== undefined) $('#stat-docs-size').textContent = stats.docsSize;
    }

    renderSessionList(sessions, currentId) {
        const container = $('#session-list');
        if (!container) return;

        container.innerHTML = sessions.map(session => `
            <div class="group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${session.id === currentId ? 'bg-slate-800 border-l-2 border-indigo-500' : 'hover:bg-slate-800/50 border-l-2 border-transparent'}"
                 data-session-id="${session.id}">
                <i data-lucide="message-square" class="w-3 h-3 ${session.id === currentId ? 'text-indigo-400' : 'text-slate-600'}"></i>
                <div class="flex-1 min-w-0">
                    <div class="text-xs font-medium text-slate-300 truncate">${session.title}</div>
                    <div class="text-[10px] text-slate-500 truncate h-3">${session.preview || 'No messages'}</div>
                </div>
                <button class="delete-session opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 text-slate-600 transition-opacity" data-id="${session.id}">
                    <i data-lucide="trash-2" class="w-3 h-3"></i>
                </button>
            </div>
        `).join('');
        
        if (window.lucide) window.lucide.createIcons();
    }

    clearChat() {
        const container = $('#chat-history');
        if (container) {
            container.innerHTML = `
                <div class="text-center text-slate-500 mt-20">
                    <h2 class="text-xl font-semibold mb-2">Classic Chat</h2>
                    <p>Start a conversation with the loaded model.</p>
                </div>
            `;
        }
    }

    appendMessage(role, content) {
        const container = $('#chat-history');
        if (!container) return; // Viewport might not be in chat mode

        // Remove welcome message if exists
        const welcome = container.querySelector('.text-slate-500');
        if (welcome) welcome.remove();

        const isUser = role === 'user';
        
        const msgDiv = document.createElement('div');
        msgDiv.className = `flex gap-4 ${isUser ? 'flex-row-reverse' : ''} animate-fade-in`;
        
        msgDiv.innerHTML = `
            <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isUser ? 'bg-indigo-600' : 'bg-slate-700'}">
                <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-5 h-5 text-white"></i>
            </div>
            <div class="flex-1 max-w-3xl">
                <div class="text-xs text-slate-500 mb-1 ${isUser ? 'text-right' : ''}">${isUser ? 'You' : 'Model'}</div>
                <div class="prose prose-invert prose-sm max-w-none bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 ${isUser ? 'bg-indigo-900/20 border-indigo-500/30' : ''}">
                    ${marked.parse(content)}
                </div>
            </div>
        `;
        
        container.appendChild(msgDiv);
        
        // Auto scroll
        container.scrollTop = container.scrollHeight;

        if (window.lucide) window.lucide.createIcons();
    }
}