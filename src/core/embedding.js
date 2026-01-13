import { pipeline, env } from '@xenova/transformers';
import { CONFIG } from '../config.js';

// Configuration to force loading from Hugging Face Hub instead of local server
env.allowLocalModels = false;
env.useBrowserCache = true;

export class EmbeddingHandler {
    constructor() {
        this.extractor = null;
        this.modelId = null;
        this.dimensions = null; 
    }

    async initialize(modelId) {
        if (this.extractor && this.modelId === modelId) {
            console.log(`Embedding model ${modelId} already loaded.`);
            return;
        }

        console.log(`Initializing Embedding Model: ${modelId}`);
        const modelConfig = CONFIG.RAG.EMBEDDING_MODELS.find(m => m.id === modelId);
        
        if (!modelConfig) {
            throw new Error(`Model configuration not found for ID: ${modelId}`);
        }

        try {
            // Load the pipeline
            // Using 'feature-extraction' for embeddings.
            this.extractor = await pipeline('feature-extraction', modelId, {
                quantized: modelConfig.quantized
            });

            this.modelId = modelId;
            this.dimensions = modelConfig.dims;
            console.log(`Embedding model loaded: ${modelId} (${this.dimensions} dims)`);
        } catch (error) {
            console.error(`Failed to load embedding model (${modelId}):`, error);
            throw error;
        }
    }

    async generate(text) {
        if (!this.extractor) {
            throw new Error("Embedding model not initialized. Call initialize() first.");
        }

        try {
            // Generate embedding
            // pooling: 'mean' is standard for sentence retrieval. normalize: true for cosine similarity validity.
            const result = await this.extractor(text, { pooling: 'mean', normalize: true });
            
            // Result is a Tensor. Data is in result.data.
            // Ensure we return a Float32Array of the correct dimension.
            if (result.data.length !== this.dimensions) {
                console.warn(`Generated embedding dimension (${result.data.length}) does not match expected (${this.dimensions}).`);
            }
            
            return result.data;
        } catch (error) {
            console.error("Error generating embedding:", error);
            throw error;
        }
    }
}
