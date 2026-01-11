// Imports from WebLLM via ES Module
import { CreateMLCEngine, prebuiltAppConfig } from "@mlc-ai/web-llm";

export class LLMHandler {
    constructor(config) {
        this.config = config;
        this.engine = null;
        this.modelId = null;
        this.isLoaded = false;
        
        // Callbacks
        this.onProgress = (progress) => console.log('Loading:', progress);
        this.onReady = () => console.log('LLM Ready');
    }

    setCallbacks(onProgress, onReady) {
        this.onProgress = onProgress;
        this.onReady = onReady;
    }

    async loadModel(modelId, progressCallback) {
        if (this.isLoaded && this.modelId === modelId) return;
        
        console.log(`Initializing WebLLM with ${modelId}...`);
        
        try {
            this.engine = await CreateMLCEngine(modelId, {
                initProgressCallback: (report) => {
                    // Call the passed callback or fallback to stored one (backward compatibility)
                    if (progressCallback) progressCallback(report);
                    else this.onProgress(report.text);
                },
                appConfig: prebuiltAppConfig // optional custom config
            });
            
            this.modelId = modelId;
            this.isLoaded = true;
            this.onReady();
            return true;
        } catch (error) {
            console.error("Failed to load model:", error);
            throw error;
        }
    }

    async chat(messages, streamCallback) {
        if (!this.engine) throw new Error("Model not loaded");

        const chunks = await this.engine.chat.completions.create({
            messages,
            temperature: this.config.temperature,
            stream: true,
            max_tokens: this.config.max_gen_len
        });

        let fullResponse = "";
        for await (const chunk of chunks) {
            const content = chunk.choices[0]?.delta.content || "";
            fullResponse += content;
            if (streamCallback) streamCallback(content, fullResponse);
        }
        
        return fullResponse;
    }

    async unload() {
        if (this.engine) {
            await this.engine.unload();
            this.engine = null;
            this.isLoaded = false;
        }
    }
}