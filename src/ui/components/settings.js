import { CONFIG } from '../../config.js';
import { $ } from '../../utils/helpers.js';

export class SettingsView {
    constructor(context) {
        this.context = context;
    }

    init() {
        const modal = $('#settings-modal');
        const trigger = $('#params-trigger');
        
        trigger.addEventListener('click', () => {
            this.render(modal);
            modal.classList.remove('hidden');
        });

        // Close on click outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    }

    render(container) {
        container.innerHTML = `
            <div class="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in" onclick="event.stopPropagation()">
                <div class="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h2 class="text-xl font-bold">Configuration</h2>
                    <button onclick="document.getElementById('settings-modal').classList.add('hidden')" class="text-slate-400 hover:text-white">
                        <i data-lucide="x" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <div class="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-8">
                    
                    <!-- Model Parameters -->
                    <section>
                        <h3 class="text-indigo-400 text-sm font-bold uppercase tracking-wider mb-4">LLM Parameters</h3>
                        <div class="grid grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs text-slate-400 mb-1">Temperature (${CONFIG.DEFAULT_PARAMS.temperature})</label>
                                <input type="range" min="0" max="1" step="0.1" value="${CONFIG.DEFAULT_PARAMS.temperature}" class="w-full accent-indigo-500">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-400 mb-1">Top P (${CONFIG.DEFAULT_PARAMS.top_p})</label>
                                <input type="range" min="0" max="1" step="0.1" value="${CONFIG.DEFAULT_PARAMS.top_p}" class="w-full accent-indigo-500">
                            </div>
                        </div>
                        <div class="mt-4">
                            <label class="block text-xs text-slate-400 mb-1">System Prompt</label>
                            <textarea class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 h-24 resize-none focus:border-indigo-500 focus:outline-none">${CONFIG.DEFAULT_PARAMS.system_prompt}</textarea>
                        </div>
                    </section>

                    <!-- RAG / Parser Parameters -->
                    <section>
                        <h3 class="text-indigo-400 text-sm font-bold uppercase tracking-wider mb-4">RAG & PDF Parser</h3>
                        <div class="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <label class="block text-xs text-slate-400 mb-2">Chunk Size (chars)</label>
                                <input type="number" value="${CONFIG.RAG.CHUNK_SIZE}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-400 mb-2">Chunk Overlap</label>
                                <input type="number" value="${CONFIG.RAG.OVERLAP}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm">
                            </div>
                        </div>
                         <div>
                            <label class="block text-xs text-slate-400 mb-2">Vector DB Limit (Max Chunks)</label>
                            <input type="number" value="10000" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm">
                        </div>
                    </section>

                </div>

                <div class="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-end gap-3">
                    <button onclick="document.getElementById('settings-modal').classList.add('hidden')" class="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                    <button class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg">Save Changes</button>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();
    }
}