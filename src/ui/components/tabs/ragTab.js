import { CONFIG } from '../../../config.js';
import { marked } from 'marked';

export class RagTab {
    constructor(context) {
        this.context = context;
    }

    render(container) {
        container.innerHTML = `<div class="flex h-full">
            <!-- Document List Sidebar -->
            <div class="w-64 border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col">
                <h3 class="font-semibold text-slate-300 mb-4 text-xs uppercase">Library</h3>
                <div id="doc-list" class="flex-1 overflow-y-auto mb-4 space-y-2 min-h-0 custom-scrollbar"></div>
                
                <!-- Upload Progress -->
                <div id="upload-progress" class="hidden mb-4 bg-slate-800 rounded-lg p-3 border border-slate-700">
                    <div class="flex justify-between mb-1">
                        <span class="text-[10px] text-slate-400 font-medium">Embedding...</span>
                        <span id="progress-text" class="text-[10px] text-indigo-400 font-mono">0%</span>
                    </div>
                    <div class="w-full bg-slate-700 rounded-full h-1.5 overflow-hidden">
                        <div id="progress-bar" class="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>

                <label id="drop-zone" class="shrink-0 block w-full border border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-800 transition-colors">
                    <i data-lucide="upload" class="w-6 h-6 text-slate-500 mx-auto mb-2"></i>
                    <span class="text-xs text-slate-400">Upload PDF</span>
                    <input id="pdf-upload-input" type="file" class="hidden" accept=".pdf" multiple>
                </label>
            </div>
            
            <!-- Chat Area for RAG -->
            <div class="flex-1 p-6 flex flex-col h-full relative">
                 <div id="rag-chat-history" class="flex-1 overflow-y-auto space-y-4 mb-4 custom-scrollbar pr-2">
                    <div class="flex items-center justify-center h-full text-slate-600 flex-col opacity-50">
                        <i data-lucide="library" class="w-12 h-12 mb-4"></i>
                        <p>Upload papers to start a Literature Review.</p>
                    </div>
                 </div>
                 
                 <!-- Input Area -->
                 <div class="relative shrink-0">
                    <textarea id="rag-input" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-24 shadow-lg" placeholder="Ask about your documents..."></textarea>
                    
                    <button id="rag-send-btn" class="absolute right-3 bottom-3 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                        <i data-lucide="send" class="w-4 h-4"></i>
                    </button>

                    <div id="rag-loading" class="absolute right-14 bottom-3 hidden">
                         <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                    </div>
                 </div>
            </div>
        </div>`;

        // Bind UI Events
        setTimeout(() => {
            const chatContainer = document.getElementById('rag-chat-history');
            const input = document.getElementById('rag-input');
            const sendBtn = document.getElementById('rag-send-btn');
            const loading = document.getElementById('rag-loading');

            const handleSend = async () => {
                const query = input.value.trim();
                if (!query) return;

                // 1. Add User Message
                this.appendMessage(chatContainer, 'user', query);
                input.value = '';
                input.style.height = '6rem'; // Reset height
                
                try {
                    loading.classList.remove('hidden');
                    sendBtn.disabled = true;
                    
                    // 1.5. Query Rewriting for Better RAG
                    const searchQueries = [query]; // Start with original
                    const summaries = [];
                    for (let i = 0; i < localStorage.length; i++) {
                         const key = localStorage.key(i);
                         if (key && key.startsWith('doc_')) {
                             try {
                                 const d = JSON.parse(localStorage.getItem(key));
                                 if(d.summary) summaries.push(`- [${d.name}]: ${d.summary}`);
                             } catch(e) {}
                         }
                    }

                    if (summaries.length > 0) {
                         try {
                             const rewritePrompt = [
                                { role: "system", content: "You are an expert search query optimizer. GENERATE 3 DISTINCT SEARCH QUERIES based on the user's question and the provided document abstracts to maximize vector database retrieval. \n\nOutput logic:\n- One query per line.\n- Start each query with a hyphen '-'.\n- NO intro/outro text." },
                                { role: "user", content: `User Question: "${query}"\n\nAvailable Document Abstracts:\n${summaries.join('\n')}` }
                             ];
                             
                             const rewritten = await this.context.llm.chat(rewritePrompt);
                             if (rewritten) {
                                  rewritten.split('\n').forEach(line => {
                                      const cleaned = line.replace(/^(?:hyphen|[\-\*\d\.\s])+/i, '').trim();
                                      if (cleaned.length > 2) searchQueries.push(cleaned);
                                  });
                             }
                             console.log("RAG Queries:", searchQueries);
                         } catch (rwErr) {
                             console.warn("Query rewriting failed", rwErr);
                         }
                    }

                    // 2. Retrieve Context (Multi-Query Vector Search)
                    let allResults = [];
                    const seenIds = new Set();
                    
                    // Run searches in parallel for speed
                    const searchPromises = searchQueries.map(q => this.context.vectorStore.search(q, 5));
                    const searchResultsArray = await Promise.all(searchPromises);

                    // De-duplicate and Merge
                    for (const results of searchResultsArray) {
                        for (const r of results) {
                            if (!seenIds.has(r.item.id)) {
                                seenIds.add(r.item.id);
                                allResults.push(r);
                            } else {
                                // Keep the highest score for this document
                                const existing = allResults.find(x => x.item.id === r.item.id);
                                if (existing && r.score > existing.score) {
                                    existing.score = r.score;
                                }
                            }
                        }
                    }
                    
                    // Sort by score and take top 7
                    allResults.sort((a, b) => b.score - a.score);
                    const results = allResults.slice(0, 7);
                    
                    // 3. Construct Prompt with Improved System Instructions
                    const seenAbstracts = new Set();
                    const contextText = results.map(r => {
                         const meta = r.item.metadata;
                         const filename = meta.filename || 'Unknown Document';
                         let recap = '';

                         if (meta.summary && !seenAbstracts.has(filename)) {
                             recap = `\n[Abstract: ${meta.summary}]`;
                             seenAbstracts.add(filename);
                         }

                         return `[Source: ${filename}]${recap}\n${r.item.content}`;
                    }).join('\n\n---\n\n');

                    console.log(`RAG Context constructed with ${results.length} documents.`);
                    console.log(contextText);
                    
                    const systemPrompt = CONFIG.DEFAULT_PARAMS.rag_system_prompt;

                    console.log("RAG System Prompt:", systemPrompt);

                    const fullPrompt = `Context:\n${contextText}\n\nQuestion: ${query}`;
                    
                    const messages = [
                        { role: "system", content: systemPrompt },
                        { role: "user", content: fullPrompt }
                    ];

                    // 4. Generation
                    // Create placeholder for assistant response
                    const responseEl = this.appendMessage(chatContainer, 'assistant', 'Thinking...');
                    const contentDiv = responseEl.querySelector('.prose');
                    contentDiv.innerHTML = ''; // Clear "Thinking..."

                    // Stream response
                    let collectedText = "";
                    await this.context.llm.chat(messages, (chunk, fullText) => {
                         collectedText = fullText;
                         
                         // Process Citations
                         const sourceRegex = /\[Source:\s*(.*?)\]/g;
                         const uniqueSources = new Map();
                         let sourceCount = 0;
                         
                         // Create placeholders AND build source list
                         const formattedMarkdown = fullText.replace(sourceRegex, (match, filename) => {
                             const name = filename.trim();
                             if (!uniqueSources.has(name)) {
                                 sourceCount++;
                                 uniqueSources.set(name, sourceCount);
                             }
                             const id = uniqueSources.get(name);
                             return `CITATION_${id}`;
                         });

                         let html = marked.parse(formattedMarkdown);
                         
                         // Replace placeholders with Visual Pills
                         const sortedSources = Array.from(uniqueSources.entries()).sort((a, b) => a[1] - b[1]);
                         
                         html = html.replace(/CITATION_(\d+)/g, (match, id) => {
                             const src = sortedSources.find(s => s[1] == id);
                             const name = src ? src[0] : 'Unknown';
                             return `<sup class="inline-block"><span class="cursor-help group relative px-1.5 py-0.5 ml-0.5 rounded-full bg-slate-700 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[10px] font-bold transition-colors select-none" data-id="${id}">
                                 ${id}
                                 <span class="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded shadow-xl whitespace-nowrap z-50 text-xs text-slate-300 pointer-events-none">
                                     <span class="flex items-center gap-1.5"><i data-lucide="file-text" class="w-3 h-3"></i> ${name}</span>
                                     <svg class="absolute text-slate-900 h-2 w-full left-0 top-full" x="0px" y="0px" viewBox="0 0 255 255"><polygon class="fill-current" points="0,0 127.5,127.5 255,0"/></svg>
                                 </span>
                             </span></sup>`;
                         });

                         // Append Sources List
                         if (sortedSources.length > 0) {
                             html += `
                             <div class="mt-6 pt-4 border-t border-slate-700/50">
                                 <h4 class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Sources Cited</h4>
                                 <div class="flex flex-wrap gap-2">
                                     ${sortedSources.map(([name, id]) => `
                                         <div class="flex items-center gap-2 bg-slate-800/50 border border-slate-700/50 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 hover:border-indigo-500/30 transition-colors cursor-default">
                                             <span class="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">${id}</span>
                                             <span class="truncate max-w-[200px]" title="${name}">${name}</span>
                                         </div>
                                     `).join('')}
                                 </div>
                             </div>`;
                         }

                         contentDiv.innerHTML = html;
                         
                         if (window.lucide) window.lucide.createIcons();
                         
                         // Auto-scroll logic
                         const isNearBottom = chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight < 100;
                         if (isNearBottom) chatContainer.scrollTop = chatContainer.scrollHeight;
                    });

                } catch (err) {
                    console.error('RAG Chat Error:', err);
                    this.appendMessage(chatContainer, 'system', `Error: ${err.message}`);
                } finally {
                    loading.classList.add('hidden');
                    sendBtn.disabled = false;
                    input.focus();
                }
            };

            // Bind Events
            sendBtn.addEventListener('click', handleSend);
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                }
            });

            // ... previous logic
            const uploadInput = document.getElementById('pdf-upload-input');
            const dropZone = document.getElementById('drop-zone');

            // Initial render
            this.renderLibrary();

            if (!CONFIG.RAG.ACTIVE_MODEL_ID) {
                this.renderModelSelectionOverlay(container);
            }

            const handleFiles = async (files) => {
                const progressContainer = document.getElementById('upload-progress');
                const progressBar = document.getElementById('progress-bar');
                const progressText = document.getElementById('progress-text');

                if (files.length > 0) {
                    for (const file of files) {
                        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
                            console.warn(`Skipping non-PDF file: ${file.name}`);
                            continue;
                        }
                        
                        console.log(`Processing ${file.name}...`);
                        progressContainer.classList.remove('hidden');
                        progressText.textContent = "Parsing PDF...";
                        progressBar.style.width = '5%';

                        try {
                            const text = await this.context.pdfProcessor.loadFile(file);
                            console.log(`Text extracted from ${file.name}`);

                           // Generate Recap
                           progressText.textContent = "Generating Abstract...";
                           progressBar.style.width = '10%';
                           
                           let summary = "";
                           try {
                               const summaryPrompt = [
                                   { role: "system", content: "You are a helpful assistant. Provide a concise 1-2 sentence abstract/recap of the provided text. Respond only with the abstract, do not include any additional commentary." },
                                   { role: "user", content: `Document Title: ${file.name}\n\nContent (First 10k chars):\n${text.substring(0, 10000)}...` }
                               ];
                               summary = await this.context.llm.chat(summaryPrompt);
                               summary = summary.trim();
                           } catch (sumErr) {
                               console.warn("Summarization failed:", sumErr);
                               summary = "Abstract not available.";
                           }
                            
                           // Chunking
                           progressText.textContent = "Chunking & Embedding...";
                           const chunks = this.context.pdfProcessor.chunkText(text);
                           console.log(`Processing ${chunks.length} chunks for vector store...`);

                           // Embed & Index
                           let processed = 0;
                           for (const chunk of chunks) {
                               await this.context.vectorStore.addDocument({
                                   text: chunk.text,
                                   metadata: {
                                       ...chunk.metadata,
                                       filename: file.name,
                                       summary: summary
                                   }
                               });
                               processed++;
                               
                               const pct = Math.round((processed / chunks.length) * 100);
                               // Update UI every few chunks to avoid too many reflows
                               if (processed % 5 === 0 || processed === chunks.length) {
                                   progressBar.style.width = `${pct}%`;
                                   progressText.textContent = `${pct}%`;
                                   
                                   // Update global stats (Chunks count)
                                   this.context.updateSideBarStats();
                                   
                                   // Yield to UI thread
                                   await new Promise(r => setTimeout(r, 0));
                               }
                           }

                            // Store in LocalStorage (Text backup)
                            const docId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                            const docData = {
                                id: docId,
                                name: file.name,
                                text: text,
                                size: file.size,
                                wordCount: text.trim().split(/\s+/).length,
                                uploadedAt: new Date().toISOString(),
                                summary: summary
                            };
                            localStorage.setItem(docId, JSON.stringify(docData));
                            
                            // Update sidebar stats immediately
                            this.context.updateSideBarStats();
                            
                        } catch (err) {
                            console.error(`Error loading ${file.name}`, err);
                            alert(`Error loading ${file.name}: ${err.message}`);
                        } finally {
                            // Reset Progress after short delay
                            setTimeout(() => {
                                progressContainer.classList.add('hidden');
                                progressBar.style.width = '0%';
                            }, 1000);
                        }
                    }
                    // Refresh List
                    this.renderLibrary();
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
    }

    appendMessage(container, role, text) {
        if (container.children.length === 1 && container.children[0].classList.contains('opacity-50')) {
            container.innerHTML = '';
        }

        const div = document.createElement('div');
        div.className = `flex gap-4 ${role === 'user' ? 'flex-row-reverse' : ''} mb-6 animate-fade-in`;
        
        const avatar = role === 'user' 
            ? `<div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0"><i data-lucide="user" class="w-4 h-4 text-white"></i></div>`
            : `<div class="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0"><i data-lucide="bot" class="w-4 h-4 text-white"></i></div>`;
            
        div.innerHTML = `
            ${avatar}
            <div class="flex-1 w-full max-w-full">
                <div class="prose prose-invert prose-sm bg-slate-800/50 p-4 rounded-2xl ${role === 'user' ? 'bg-indigo-900/20' : ''} max-w-none">
                    ${role === 'system' ? `<span class="text-red-400">${text}</span>` : text}
                </div>
            </div>
        `;
        
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        if (window.lucide) window.lucide.createIcons();
        return div;
    }

    renderLibrary() {
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
                    this.renderLibrary();
                }
            });

            docList.appendChild(el);
        });
        
        if (window.lucide) window.lucide.createIcons();
        this.context.updateSideBarStats();
    }

    renderModelSelectionOverlay(container) {
        const overlay = document.createElement('div');
        overlay.className = "absolute inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-6 backdrop-blur-sm";
        overlay.innerHTML = `
            <div class="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl p-8 animate-fade-in overflow-hidden" onclick="event.stopPropagation()">
                <div class="text-center mb-6">
                    <div class="w-12 h-12 bg-indigo-600 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-lg shadow-indigo-900/50">
                        <i data-lucide="brain-circuit" class="w-6 h-6 text-white"></i>
                    </div>
                    <h2 class="text-xl font-bold text-white mb-2">Configure Neural Embeddings</h2>
                    <p class="text-sm text-slate-400 max-w-md mx-auto">Select an embedding engine to power your document analysis. This determines how the AI understands and retrieves information.</p>
                </div>

                <div class="grid md:grid-cols-2 gap-4 mb-6">
                     ${CONFIG.RAG.EMBEDDING_MODELS.map(model => `
                        <label class="relative block cursor-pointer group">
                            <input type="radio" name="initial-embedding" value="${model.id}" class="peer sr-only">
                            <div class="h-full p-4 bg-slate-800 border-2 border-slate-700 rounded-xl transition-all hover:border-indigo-500/50 peer-checked:border-indigo-500 peer-checked:bg-indigo-900/10">
                                <div class="flex items-center justify-between mb-1">
                                    <h3 class="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors text-sm">${model.name}</h3>
                                    ${model.dims === 256 ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">Efficient</span>' : ''}
                                </div>
                                <p class="text-xs text-slate-400 mb-2 leading-relaxed h-12 overflow-hidden">${model.description}</p>
                                <div class="flex items-center gap-2 text-[10px] text-slate-500 font-mono uppercase">
                                    <span class="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${model.dims || '?'} Dim</span>
                                    <span class="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">${model.quantized ? 'Q4' : 'FP32'}</span>
                                </div>
                            </div>
                            <div class="absolute top-4 right-4 opacity-0 peer-checked:opacity-100 transition-opacity text-indigo-500">
                                <i data-lucide="check-circle-2" class="w-5 h-5 fill-indigo-500 text-slate-900"></i>
                            </div>
                        </label>
                     `).join('')}
                </div>

                <div class="flex justify-center">
                    <button id="confirm-embedding" class="px-8 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                        Initialize Engine
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(overlay);
        if (window.lucide) window.lucide.createIcons();
        
        // Bind logic
        const btn = overlay.querySelector('#confirm-embedding');
        const radios = overlay.querySelectorAll('input[name="initial-embedding"]');
        
        btn.addEventListener('click', async () => {
            const selected = Array.from(radios).find(r => r.checked);
            if (!selected) {
                 alert('Please select a model.');
                 return;
            }
            
            try {
                btn.textContent = "Loading Model...";
                btn.disabled = true;
                
                // Initialize
                await this.context.vectorStore.setModel(selected.value);
                
                // Remove overlay
                overlay.remove();
            } catch (e) {
                console.error(e);
                alert("Error loading model: " + e.message);
                btn.disabled = false;
                btn.textContent = "Try Again";
            }
        });
    }
}