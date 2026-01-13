export class ResearchTab {
    constructor(context) {
        this.context = context;
    }

    render(container) {
        container.innerHTML = `<div class="p-8 max-w-4xl mx-auto w-full">
            <h2 class="text-2xl font-bold text-slate-100 mb-6 flex items-center gap-3">
                <i data-lucide="microscope" class="text-purple-500"></i> Deep Research Agent
            </h2>
            
            <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
                <div>
                    <label class="block text-sm font-medium text-slate-400 mb-2">Research Goal</label>
                    <input type="text" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:border-purple-500 focus:outline-none" placeholder="e.g. Impact of Transformer architecture on NLP efficiency">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-2">Max Iterations</label>
                        <input type="number" class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" value="5">
                    </div>
                     <div>
                        <label class="block text-xs font-medium text-slate-500 mb-2">Web Search Depth</label>
                        <select class="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                            <option>Standard</option>
                            <option>Deep</option>
                        </select>
                    </div>
                </div>

                <button class="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium shadow-lg shadow-purple-900/20">
                    Start Research Agent
                </button>
            </div>

            <div id="agent-logs" class="mt-8 p-4 bg-black/30 rounded-lg font-mono text-sm text-green-400 h-64 overflow-y-auto custom-scrollbar border border-slate-800">
                <span class="opacity-50">// Agent logs will appear here...</span>
            </div>
        </div>`;
    }
}