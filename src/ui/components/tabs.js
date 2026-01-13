import { $ } from '../../utils/helpers.js';

export class TabManager {
    constructor(context) {
        this.context = context;
        this.tabs = [
            { id: 'chat', label: 'Classic Chat', icon: 'message-square' },
            { id: 'rag', label: 'RAG Lit Review', icon: 'library' },
            { id: 'research', label: 'Deep Research', icon: 'microscope' }
        ];
        this.activeTab = null;
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
    }

    nextTab() {
        const currentIndex = this.tabs.findIndex(t => t.id === this.activeTab);
        const nextIndex = (currentIndex + 1) % this.tabs.length;
        this.switchTab(this.tabs[nextIndex].id);
    }

    renderView(tabId) {
        const viewport = $('#viewport');
        viewport.innerHTML = ''; // Clear current view

        // Simple router logic
        switch(tabId) {
            case 'chat':
                viewport.innerHTML = `<div class="p-10 flex flex-col h-full bg-slate-900">
                    <div id="chat-history" class="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 pr-4">
                        <!-- Chat Items -->
                        <div class="text-center text-slate-500 mt-20">
                            <h2 class="text-xl font-semibold mb-2">Classic Chat</h2>
                            <p>Start a conversation with the loaded model.</p>
                        </div>
                    </div>
                    <div class="relative">
                        <textarea id="chat-input" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-24" placeholder="Type your message..."></textarea>
                        <button id="chat-send-btn" class="absolute right-3 bottom-3 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>`;
                
                // Bind Chat Events immediately after rendering
                setTimeout(() => {
                    const input = document.getElementById('chat-input');
                    const btn = document.getElementById('chat-send-btn');
                    if (btn && input) {
                        btn.addEventListener('click', () => {
                            const event = new CustomEvent('chat-message-send', { detail: input.value });
                            document.dispatchEvent(event);
                            input.value = '';
                        });
                    }
                }, 0);
                break;

            case 'rag':
                viewport.innerHTML = `<div class="flex h-full">
                    <!-- Document List Sidebar -->
                    <div class="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col">
                        <h3 class="font-semibold text-slate-300 mb-4 text-xs uppercase">Library</h3>
                        <div id="doc-list" class="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0 custom-scrollbar"></div>
                        <label id="drop-zone" class="shrink-0 block w-full border border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-800 transition-colors">
                            <i data-lucide="upload" class="w-6 h-6 text-slate-500 mx-auto mb-2"></i>
                            <span class="text-xs text-slate-400">Upload PDF</span>
                            <input id="pdf-upload-input" type="file" class="hidden" accept=".pdf" multiple>
                        </label>
                    </div>
                    
                    <!-- Chat Area for RAG -->
                    <div class="flex-1 p-6 flex flex-col">
                         <div class="flex-1 flex items-center justify-center text-slate-600 flex-col">
                            <i data-lucide="library" class="w-12 h-12 mb-4 opacity-50"></i>
                            <p>Upload papers to start a Literature Review.</p>
                         </div>
                         <!-- Input Area (Same as chat but specific to RAG context) -->
                         <div class="mt-4 relative">
                            <textarea class="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-20" placeholder="Ask about your documents..."></textarea>
                         </div>
                    </div>
                </div>`;

                // Bind Upload Event
                setTimeout(() => {
                    const uploadInput = document.getElementById('pdf-upload-input');
                    const dropZone = document.getElementById('drop-zone');

                    // Function to render library from LocalStorage
                    const renderLibrary = () => {
                        const docList = document.getElementById('doc-list');
                        if (!docList) return;
                        
                        docList.innerHTML = '';
                        const docs = [];
                        for (let i = 0; i < localStorage.length; i++) {
                            const key = localStorage.key(i);
                            if (key && key.startsWith('doc_')) {
                                try {
                                    docs.push(JSON.parse(localStorage.getItem(key)));
                                } catch(e) { console.error(e); }
                            }
                        }
                        
                        // Sort by date desc (newest first)
                        docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
                        
                        docs.forEach(doc => {
                            const el = document.createElement('div');
                            el.className = 'p-3 bg-slate-800 rounded-lg border border-slate-700 hover:border-indigo-500 transition-colors group relative';
                            el.innerHTML = `
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex-1 min-w-0">
                                        <h4 class="text-xs font-medium text-slate-200 truncate" title="${doc.name}">${doc.name}</h4>
                                        <div class="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                                            <span>${(doc.size / 1024).toFixed(1)} KB</span>
                                            <span>•</span>
                                            <span>${doc.wordCount.toLocaleString()} words</span>
                                        </div>
                                    </div>
                                    <div class="text-indigo-400">
                                        <i data-lucide="file-text" class="w-4 h-4"></i>
                                    </div>
                                </div>
                                <button class="delete-doc absolute top-1 right-1 p-1 hover:bg-slate-700 rounded text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" data-id="${doc.id}">
                                    <i data-lucide="x" class="w-3 h-3"></i>
                                </button>
                            `;
                            // Add Delete Event
                            el.querySelector('.delete-doc').addEventListener('click', (e) => {
                                e.stopPropagation();
                                if(confirm(`Delete ${doc.name}?`)) {
                                    localStorage.removeItem(doc.id);
                                    renderLibrary();
                                }
                            });

                            docList.appendChild(el);
                        });
                        
                        if (window.lucide) window.lucide.createIcons();
                    };

                    // Initial render
                    renderLibrary();

                    const handleFiles = async (files) => {
                        if (files.length > 0) {
                            for (const file of files) {
                                if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                                    console.warn(`Skipping non-PDF file: ${file.name}`);
                                    continue;
                                }
                                console.log(`Processing ${file.name}...`);
                                try {
                                    const text = await this.context.pdfProcessor.loadFile(file);
                                    console.log(`Text extracted from ${file.name}`);
                                    
                                    // Store in LocalStorage
                                    const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                                    const docData = {
                                        id: docId,
                                        name: file.name,
                                        text: text,
                                        size: file.size,
                                        wordCount: text.trim().split(/\s+/).length,
                                        uploadedAt: new Date().toISOString()
                                    };
                                    localStorage.setItem(docId, JSON.stringify(docData));
                                    
                                } catch (err) {
                                    console.error(`Error loading ${file.name}`, err);
                                }
                            }
                            // Refresh List
                            renderLibrary();
                        }
                    };

                    if (uploadInput) {
                        uploadInput.addEventListener('change', (e) => handleFiles(e.target.files));
                    }

                    if (dropZone) {
                        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                            dropZone.addEventListener(eventName, preventDefaults, false);
                        });

                        function preventDefaults(e) {
                            e.preventDefault();
                            e.stopPropagation();
                        }

                        ['dragenter', 'dragover'].forEach(eventName => {
                            dropZone.addEventListener(eventName, highlight, false);
                        });

                        ['dragleave', 'drop'].forEach(eventName => {
                            dropZone.addEventListener(eventName, unhighlight, false);
                        });

                        function highlight(e) {
                            dropZone.classList.add('bg-slate-800', 'border-indigo-500');
                        }

                        function unhighlight(e) {
                            dropZone.classList.remove('bg-slate-800', 'border-indigo-500');
                        }

                        dropZone.addEventListener('drop', (e) => {
                            const dt = e.dataTransfer;
                            const files = dt.files;
                            handleFiles(files);
                        });
                    }
                }, 0);
                break;
                
            case 'research':
                viewport.innerHTML = `<div class="p-8 max-w-4xl mx-auto w-full">
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
                break;
        }

        if (window.lucide) window.lucide.createIcons();
    }
}