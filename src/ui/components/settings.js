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
                            <label class="block text-xs text-slate-400 mb-1">General Chat System Prompt</label>
                            <textarea id="system-prompt" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 h-24 resize-none focus:border-indigo-500 focus:outline-none custom-scrollbar">${CONFIG.DEFAULT_PARAMS.system_prompt}</textarea>
                        </div>
                    </section>
                    
                    <!-- RAG / Parser Parameters -->
                    <section>
                        <h3 class="text-indigo-400 text-sm font-bold uppercase tracking-wider mb-4">RAG & PDF Parser</h3>

                        <div class="mb-4">
                             <label class="block text-xs text-slate-400 mb-1">RAG System Prompt</label>
                             <textarea id="rag-system-prompt" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 h-32 resize-none focus:border-indigo-500 focus:outline-none custom-scrollbar">${CONFIG.DEFAULT_PARAMS.rag_system_prompt || ''}</textarea>
                             <p class="text-[10px] text-slate-500 mt-1">Directs the AI behavior when answering questions about documents.</p>
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-xs text-slate-400 mb-2">Embedding Model</label>
                            <select id="embedding-model-select" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500">
                                <option value="" disabled ${!CONFIG.RAG.ACTIVE_MODEL_ID ? 'selected' : ''}>Select a model...</option>
                                ${CONFIG.RAG.EMBEDDING_MODELS.map(m => `
                                    <option value="${m.id}" ${m.id === CONFIG.RAG.ACTIVE_MODEL_ID ? 'selected' : ''}>
                                        ${m.name} (${m.dims || '?'}d)
                                    </option>
                                `).join('')}
                            </select>
                            <p class="text-[10px] text-slate-500 mt-1">Switching modelRe-indexes documents (clears DB).</p>
                        </div>

                        <div class="grid grid-cols-2 gap-6 mb-4">
                            <div>
                                <label class="block text-xs text-slate-400 mb-2">Chunk Size (chars)</label>
                                <input type="number" id="rag-chunk-size" value="${CONFIG.RAG.CHUNK_SIZE}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-400 mb-2">Chunk Overlap</label>
                                <input type="number" id="rag-overlap" value="${CONFIG.RAG.OVERLAP}" class="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm">
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
                    <button id="save-settings-btn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-lg shadow-lg">Save Changes</button>
                </div>
            </div>
        `;
        
        if (window.lucide) window.lucide.createIcons();

        // Bind Save Logic
        const saveBtn = container.querySelector('#save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', async () => {
                const btnOriginalText = saveBtn.textContent;
                saveBtn.disabled = true;
                saveBtn.textContent = "Saving...";

                try {
                    // Update LLM Params
                    const ranges = container.querySelectorAll('input[type="range"]');
                    if (ranges.length >= 2) {
                        CONFIG.DEFAULT_PARAMS.temperature = parseFloat(ranges[0].value);
                        CONFIG.DEFAULT_PARAMS.top_p = parseFloat(ranges[1].value);
                    }
                    
                    // Save Prompts
                    const sysPrompt = container.querySelector('#system-prompt');
                    const ragSysPrompt = container.querySelector('#rag-system-prompt');
                    if (sysPrompt) CONFIG.DEFAULT_PARAMS.system_prompt = sysPrompt.value;
                    if (ragSysPrompt) CONFIG.DEFAULT_PARAMS.rag_system_prompt = ragSysPrompt.value;

                    // Save RAG Params
                    const chunkSizeInput = container.querySelector('#rag-chunk-size');
                    const overlapInput = container.querySelector('#rag-overlap');
                    
                    if (chunkSizeInput) CONFIG.RAG.CHUNK_SIZE = parseInt(chunkSizeInput.value) || 500;
                    if (overlapInput) CONFIG.RAG.OVERLAP = parseInt(overlapInput.value) || 50;
                    
                    // Switch Embedding Model if changed
                    const selectedEmb = container.querySelector('#embedding-model-select').value;
                    if (selectedEmb && selectedEmb !== CONFIG.RAG.ACTIVE_MODEL_ID) {
                        saveBtn.textContent = "Loading Model...";
                        await this.context.vectorStore.setModel(selectedEmb);
                    }
                    
                    document.getElementById('settings-modal').classList.add('hidden');
                } catch (error) {
                    console.error(error);
                    alert("Error saving settings: " + error.message);
                } finally {
                    saveBtn.disabled = false;
                    saveBtn.textContent = btnOriginalText;
                }
            });
        }
    }
}