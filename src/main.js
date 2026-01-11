// Main Entry Point
import { UIController } from './ui/uiHandler.js';
import { LLMHandler } from './core/LLMHandler.js';
import { VectorStore } from './core/vectorDB.js';
import { PDFProcessor } from './core/pdfParser.js';
import { CONFIG } from './config.js';
import { $ } from './utils/helpers.js';

class App {
    constructor() {
        this.config = CONFIG;
        
        // Initialize Core Components
        this.llm = new LLMHandler(CONFIG.DEFAULT_PARAMS);
        this.vectorStore = new VectorStore();
        this.pdfProcessor = new PDFProcessor(CONFIG.RAG);

        // Initialize UI
        this.ui = new UIController(this);
    }

    async init() {
        console.log("App: Booting...");
        
        // Render UI
        this.ui.init();
        
        this.setupBindings();
    }

    setupBindings() {
        // Bind Model Loading
        const loadBtn = $('#model-selector-container'); // Delegated event usually, but checking UI implementation
        
        // UI Component ModelSelector handles the click and calls THIS function via context or event?
        // In ModelSelector.js we added: container.querySelector('#btn-load-model').addEventListener('click', ...)
        // The ModelSelector updates `this.selectedModel`.
        // To keep it simple, we'll listen for the specific button click here if we can trace it, 
        // OR simpler: The UIController exposes an API or we pass callbacks to UIController.
        
        // Let's re-query the button since it's rendered by UI
        document.addEventListener('click', async (e) => {
            if (e.target.closest('#btn-load-model')) {
                const modelId = this.ui.modelSelector.selectedModel;
                await this.handleLoadModel(modelId);
            }
        });
    }

    async handleLoadModel(modelId) {
        this.ui.updateStatus('loading', 'Downloading Weights...');
        
        try {
            await this.llm.loadModel(modelId);
            this.llm.setCallbacks(
                (progress) => {
                    // Update detailed progress if UI supports it
                    this.ui.updateStatus('loading', progress);
                },
                () => {
                    this.ui.updateStatus('ready', 'Model Ready');
                }
            );
        } catch (error) {
            console.error(error);
            this.ui.updateStatus('error', 'Load Failed');
            alert("Failed to load model. Check console for details.");
        }
    }
}

// Start App
const app = new App();
app.init();