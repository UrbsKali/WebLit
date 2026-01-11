import { CONFIG } from '../../config.js';

export class ModelSelector {
    constructor(context) {
        this.context = context;
        this.selectedModel = CONFIG.DEFAULT_MODEL;
        this.searchQuery = "";
        this.container = null;
    }

    render(container) {
        this.container = container;
        
        // Initial Structure with Search Bar
        container.innerHTML = `
            <div class="mb-3">
                <div class="relative">
                    <i data-lucide="search" class="absolute left-3 top-2.5 w-4 h-4 text-slate-500"></i>
                    <input 
                        type="text" 
                        id="model-search" 
                        placeholder="Search models..." 
                        class="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-600 transition-colors"
                    >
                </div>
            </div>
            
            <div id="model-list" class="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1 mb-3 pt-1 pl-1">
                <!-- Options injected here -->
            </div>

            <button id="btn-load-model" class="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <i data-lucide="download" class="w-4 h-4"></i> Load Model
            </button>
        `;

        if (window.lucide) window.lucide.createIcons();

        // Bind Search
        const searchInput = container.querySelector('#model-search');
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderOptions();
        });

        // Initial Render of Options
        this.renderOptions();
    }

    renderOptions() {
        const listContainer = this.container.querySelector('#model-list');
        if (!listContainer) return;
        
        // Multi-term AND search
        const terms = this.searchQuery.toLowerCase().split(/\s+/).filter(t => t.length > 0);

        const filteredModels = CONFIG.AVAILABLE_MODELS.filter(model => {
            if (terms.length === 0) return true;
            
            // Create a combined searchable string including VRAM
            const searchableText = `${model.name} ${model.family} ${model.id} ${model.vram_required_mb}mb`.toLowerCase();
            
            // Check if ALL terms exist in the searchable text
            return terms.every(term => searchableText.includes(term));
        });

        if (filteredModels.length === 0) {
            listContainer.innerHTML = `<div class="text-center text-xs text-slate-500 py-4">No models found</div>`;
            return;
        }

        listContainer.innerHTML = filteredModels.map(model => 
            `<div 
                class="model-option p-3 rounded-lg border bg-slate-800/50 cursor-pointer hover:bg-slate-700 transition-all ${this.selectedModel === model.id ? 'ring-2 ring-indigo-500 border-transparent bg-slate-800' : 'border-slate-700'}"
                data-id="${model.id}"
            >
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-slate-200">${model.name}</span>
                    <span class="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">${model.family}</span>
                </div>
                <div class="flex items-center gap-3 text-[10px] text-slate-500">
                    <div class="flex items-center gap-1">
                        <i data-lucide="hard-drive" class="w-3 h-3"></i>
                        <span>~${model.vram_required_mb} MB</span>
                    </div>
                </div>
            </div>`
        ).join('');

        if (window.lucide) window.lucide.createIcons();

        // Bind Selection
        listContainer.querySelectorAll('.model-option').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedModel = el.dataset.id;
                this.renderOptions(); // Re-render to update selection style
            });
        });
    }
}