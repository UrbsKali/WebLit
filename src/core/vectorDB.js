import { EmbeddingHandler } from './embedding.js';
import { CONFIG } from '../config.js';

const DB_NAME = 'WebLitVectors';
const STORE_NAME = 'vectors';
const DB_VERSION = 1;

export class VectorStore {
    constructor() {
        this.documents = []; // { id, content, metadata, embedding }
        this.embeddingHandler = new EmbeddingHandler();
        this.db = null;
    }

    async _openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error("VectorStore: IDB Error", event.target.error);
                reject(event.target.error);
            };
        });
    }

    async _saveToDB(doc) {
        if (!this.db) return;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(doc);
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async _loadFromDB() {
        if (!this.db) return [];
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async _clearDB() {
        if (!this.db) return;
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([STORE_NAME], 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = (e) => reject(e.target.error);
        });
    }

    async initialize() {
        console.log("Initializing Vector Store...");
        
        // 1. Initialize DB
        await this._openDB();
        
        // 2. Load stored vectors
        const storedDocs = await this._loadFromDB();
        if (storedDocs && storedDocs.length > 0) {
            console.log(`VectorDB: Loaded ${storedDocs.length} chunks from storage.`);
            this.documents = storedDocs.map(doc => ({
                ...doc,
                // Ensure embedding is TypedArray if IDB stored it as generic array (though IDB supports TypedArray)
                embedding: doc.embedding instanceof Float32Array ? doc.embedding : new Float32Array(doc.embedding)
            }));
        }

        // 3. Initialize Model
        const activeModel = localStorage.getItem('weblit_embedding_model') || CONFIG.RAG.ACTIVE_MODEL_ID;

        if (activeModel) {
            console.log(`Loading saved embedding model: ${activeModel}`);
            CONFIG.RAG.ACTIVE_MODEL_ID = activeModel; // Sync config
            
            // Check if model changed since last DB usage?
            // Ideally we store metadata in DB about which model was used.
            // For now, we assume if DB is not empty, it belongs to current selection or user must manually clear.
            
            await this.embeddingHandler.initialize(activeModel);
        } else {
            console.log("Vector DB initialized (No model selected).");
        }
    }

    async setModel(modelId) {
        if (this.embeddingHandler.modelId === modelId) return;
        
        console.log(`Switching embedding model to ${modelId}...`);
        
        // Clear DB because embeddings are model-specific
        if (this.documents.length > 0) {
            console.warn("Clearing Vector DB due to model switch.");
            await this.clear();
        }

        await this.embeddingHandler.initialize(modelId);
        
        // Save preference
        localStorage.setItem('weblit_embedding_model', modelId);
        CONFIG.RAG.ACTIVE_MODEL_ID = modelId;
    }

    async addDocument(chunk) {
        if (!this.embeddingHandler.extractor) {
            throw new Error("Embedding model not loaded. Please select a model in settings.");
        }

        // chunk: { text, metadata }
        // 1. Generate embedding
        const embedding = await this.embeddingHandler.generate(chunk.text);
        
        const doc = {
            id: crypto.randomUUID(),
            content: chunk.text,
            metadata: chunk.metadata,
            embedding: embedding
        };

        // 2. Store in memory
        this.documents.push(doc);

        // 3. Store in DB
        await this._saveToDB(doc);
    }

    async search(query, topK = 5) {
        console.log(`VectorDB: Searching for "${query}"...`);
        if (!this.embeddingHandler.extractor) {
             throw new Error("Embedding model not loaded.");
        }

        const queryEmbedding = await this.embeddingHandler.generate(query);

        // Cosine Similarity (assuming normalized vectors) -> Dot Product
        const results = this.documents.map(doc => {
            const score = this.cosineSimilarity(queryEmbedding, doc.embedding);
            return {
                item: doc,
                score: score
            };
        });

        // Sort by score desc
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, topK);
    }

    cosineSimilarity(a, b) {
        let dotProduct = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
        }
        return dotProduct;
    }

    async clear() {
        this.documents = [];
        await this._clearDB();
    }

    getStats() {
        const dims = this.embeddingHandler.dimensions || 0;
        const sizeBytes = this.documents.length * dims * 4; // Float32 = 4 bytes
        return {
            count: this.documents.length,
            memory: `${(sizeBytes / 1024 / 1024).toFixed(2)} MB` 
        };
    }
}