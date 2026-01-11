import { $ } from '../utils/helpers.js';
import { ModelSelector } from './components/modelSelector.js';
import { TabManager } from './components/tabs.js';
import { SettingsView } from './components/settings.js';

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
            sidebarBackdrop: $('#sidebar-backdrop')
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

        // Switch to default tab
        this.tabs.switchTab('chat');
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

    updateStats(stats) {
         $('#stat-docs').textContent = stats.docs || 0;
         $('#stat-chunks').textContent = stats.chunks || 0;
    }
}