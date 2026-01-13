import { $ } from '../../utils/helpers.js';
import { ChatTab } from './tabs/chatTab.js';
import { RagTab } from './tabs/ragTab.js';
import { ResearchTab } from './tabs/researchTab.js';

export class TabManager {
    constructor(context) {
        this.context = context;
        this.tabs = [
            { id: 'chat', label: 'Classic Chat', icon: 'message-square' },
            { id: 'rag', label: 'RAG Lit Review', icon: 'library' },
            { id: 'research', label: 'Deep Research (WIP)', icon: 'microscope' }
        ];
        this.activeTab = null;

        this.views = {
            chat: new ChatTab(context),
            rag: new RagTab(context),
            research: new ResearchTab(context)
        };
    }

    init(container) {
        this.container = container;
        this.render();
    }

    render() {
        this.container.innerHTML = this.tabs.map(tab => `
            <button 
                data-tab="${tab.id}"
                class="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                       ${this.activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}"
            >
                <i data-lucide="${tab.icon}" class="w-4 h-4"></i>
                <span class="hidden sm:inline">${tab.label}</span>
            </button>
        `).join('');

        // Re-bind icons
        if (window.lucide) window.lucide.createIcons();

        // Add listeners
        this.container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
    }

    switchTab(tabId) {
        if (this.activeTab === tabId) return;
        this.activeTab = tabId;
        
        // Re-render tabs to show active state
        this.render();

        // Trigger View Change
        this.renderView(tabId);

        // Notify App to switch context (History, Session Type)
        if (this.context.handleTabSwitch) {
            this.context.handleTabSwitch(tabId);
        }
    }

    nextTab() {
        const currentIndex = this.tabs.findIndex(t => t.id === this.activeTab);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchTab(this.tabs[nextIndex].id);
    }

    renderView(tabId) {
        const viewport = $('#viewport');
        viewport.innerHTML = ''; // Clear current view

        if (this.views[tabId]) {
            this.views[tabId].render(viewport);
        }

        if (window.lucide) window.lucide.createIcons();
    }
}