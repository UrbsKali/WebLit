export const CONFIG = {
    DEFAULT_MODEL: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    AVAILABLE_MODELS: [
        { 
            id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", 
            name: "Llama 3.2 1B", 
            family: "llama",
            vram_required_mb: 850
        },
        { 
            id: "Llama-3-8B-Instruct-q4f32_1-1k", 
            name: "Llama 3 8B (Fast)", 
            family: "llama",
            vram_required_mb: 5200
        },
        { 
            id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", 
            name: "Llama 3.2 3B", 
            family: "llama",
            vram_required_mb: 2100
        },
        { 
            id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", 
            name: "Qwen2.5 1.5B", 
            family: "qwen",
            vram_required_mb: 1200
        },
        { 
            id: "Phi-3-mini-4k-instruct-q4f16_1-1k", 
            name: "Phi-3 Mini (Low VRAM)", 
            family: "phi",
            vram_required_mb: 2500 
        },
        { 
            id: "Mistral-7B-Instruct-v0.2-q4f16_1", 
            name: "Mistral 7B", 
            family: "mistral",
            vram_required_mb: 4500
        },
        {
            id: "Gemma-2-2b-it-q4f16_1-MLC",
            name: "Gemma 2 2B",
            family: "gemma",
            vram_required_mb: 1600
        }
    ],
    DEFAULT_PARAMS: {
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.0,
        max_gen_len: 2048,
        system_prompt: "You are a helpful and rigorous AI research assistant. You answer based on the provided context."
    },
    RAG: {
        CHUNK_SIZE: 500,
        OVERLAP: 50,
        TOP_K: 5
    }
};

export const STORAGE_KEYS = {
    SETTINGS: 'weblit_settings',
    HISTORY: 'weblit_history'
};