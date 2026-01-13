export const CONFIG = {
    DEFAULT_MODEL: "Llama-3.2-1B-Instruct-q4f16_1-MLC",
    AVAILABLE_MODELS: [
        // --- Efficient / Low VRAM ---
        { 
            id: "Llama-3.2-1B-Instruct-q4f16_1-MLC", 
            name: "Llama 3.2 1B Instruct", 
            family: "llama",
            vram_required_mb: 1100
        },
        { 
            id: "Qwen2.5-1.5B-Instruct-q4f16_1-MLC", 
            name: "Qwen 2.5 1.5B Instruct", 
            family: "qwen",
            vram_required_mb: 1600
        },
        {
            id: "Gemma-2-2b-it-q4f16_1-MLC",
            name: "Gemma 2 2B Instruct",
            family: "gemma",
            vram_required_mb: 1900
        },
        
        // --- Balanced ---
        { 
            id: "Llama-3.2-3B-Instruct-q4f16_1-MLC", 
            name: "Llama 3.2 3B Instruct", 
            family: "llama",
            vram_required_mb: 2800
        },
        { 
            id: "Phi-3.5-mini-instruct-q4f16_1-MLC", 
            name: "Phi 3.5 Mini Instruct", 
            family: "phi",
            vram_required_mb: 3000 
        },

        // --- High Performance (Requires decent GPU) ---
        { 
            id: "Llama-3.1-8B-Instruct-q4f32_1-MLC", 
            name: "Llama 3.1 8B Instruct", 
            family: "llama",
            vram_required_mb: 6100
        },
        { 
            id: "Qwen2.5-7B-Instruct-q4f16_1-MLC", 
            name: "Qwen 2.5 7B Instruct", 
            family: "qwen",
            vram_required_mb: 5100
        },
        { 
            id: "Mistral-7B-Instruct-v0.3-q4f16_1-MLC", 
            name: "Mistral 7B v0.3 Instruct", 
            family: "mistral",
            vram_required_mb: 5100
        },
        {
            id: "gemma-2-9b-it-q4f16_1-MLC",
            name: "Gemma 2 9B Instruct",
            family: "gemma",
            vram_required_mb: 6600
        },
        {
             id: "Hermes-2-Pro-Llama-3-8B-q4f16_1-MLC",
             name: "Hermes 2 Pro (Agentic)",
             family: "llama",
             vram_required_mb: 5200
        }
    ],
    DEFAULT_PARAMS: {
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.0,
        max_gen_len: 2048,
        system_prompt: "You are a helpful and rigorous AI chatbot assistant. You answer based on the provided context. Use Markdown formatting where appropriate.",
        rag_system_prompt: `You are an expert academic research assistant specialized in performing rigorous literature reviews. Your goal is to synthesize information from the provided documents into a coherent answer.

Guidelines:
1. **Strict Context Adherence**: Answer using ONLY the provided Context. Do NOT use outside knowledge or training data. If the answer is not found in the provided documents, state clearly: "The provided documents do not contain sufficient information to answer this question."
2. **No Hallucinations**: Do NOT invent citations or sources. Only use the filenames provided in the Context.
3. **Mandatory Citations**: Every claim, data point, or concept must be supported by a citation in the format [Source: filename]. If multiples sources are used, cite them all like this [Source: filename1] [Source: filename2]. The citations should directly follow the relevant sentence or fact.
4. **Critical Synthesis**: Do not just list facts. Compare, contrast, and connect findings from multiple sources relative to the user's question.
5. **Structure**: Organize your response logically (e.g., thematically or chronologically). Use Markdown headings and bullet points for readability.
6. **Tone**: Maintain a formal, objective, academic tone.`
    },
    RAG: {
        CHUNK_SIZE: 256,
        OVERLAP: 50,
        TOP_K: 5,
        EMBEDDING_MODELS: [
            {
                id: "Xenova/all-mpnet-base-v2",
                name: "All-MPNet-Base-v2",
                description: "High-performance semantic understanding. (768 dims)",
                dims: 768,
                quantized: true 
            },
            {
                id: "Xenova/all-MiniLM-L6-v2",
                name: "All-MiniLM-L6-v2",
                description: "Fast, standard general purpose embedding. (384 dims)",
                dims: 384,
                quantized: true
            }
        ],
        ACTIVE_MODEL_ID: null // User must select on first load
    }
};

export const STORAGE_KEYS = {
    SETTINGS: 'weblit_settings',
    HISTORY: 'weblit_history'
};