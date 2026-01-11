import { CONFIG } from '../../config.js';

export class ModelSelector {
    constructor(context) {
        this.context = context;
        this.selectedModel = CONFIG.DEFAULT_MODEL;
    }

    render(container) {
        const options = CONFIG.AVAILABLE_MODELS.map(model => 
            `<div 
                class="model-option p-3 rounded-lg border border-slate-700 bg-slate-800/50 cursor-pointer hover:bg-slate-700 transition-all mb-2 ${this.selectedModel === model.id ? 'ring-2 ring-indigo-500 border-transparent' : ''}"
                data-id="${model.id}"
            >
                <div class="flex justify-between items-center mb-1">
                    <span class="text-sm font-medium text-slate-200">${model.name}</span>
                    <span class="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">${model.family}</span>
                </div>
                <div class="flex items-center gap-2 text-[10px] text-slate-500">
                    <i data-lucide="hard-drive" class="w-3 h-3"></i>
                    <span>~${model.vram_required_mb} MB VRAM</span>
                </div>
            </div>`
        ).join('');

        container.innerHTML = `
            ${options}
            <button id="btn-load-model" class="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                <i data-lucide="download" class="w-4 h-4"></i> Load Model
            </button>
        `;

        if (window.lucide) window.lucide.createIcons();
        container.querySelectorAll('.model-option').forEach(el => {
            el.addEventListener('click', () => {
                this.selectedModel = el.dataset.id;
                this.render(container); // Re-render to update selection style
            });
        });
        
        container.querySelector('#btn-load-model').addEventListener('click', () => {
            console.log('Requesting load model:', this.selectedModel);
            // Trigger load in controller
        });
    }
}