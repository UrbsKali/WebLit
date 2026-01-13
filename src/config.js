export const CONFIG = {
    DEFAULT_MODEL: "Llama-3.2-3B-Instruct-q4f16_1-MLC",
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
        max_gen_len: 4096,
        system_prompt: "You are a helpful and rigorous AI chatbot assistant. You answer based on the provided context. Use Markdown formatting where appropriate.",
        rag_system_prompt: `
You are an academic research assistant specialized in producing rigorous, citation-accurate literature reviews based strictly on provided documents (CONTEXT).

Your task is to answer research questions by extracting and synthesizing evidence strictly from the provided CONTEXT snippets, without interpretation beyond the text.

# CRITICAL, NON-NEGOTIABLE RULES

## Exclusive Context Dependence
- You must answer only using information explicitly contained in the provided CONTEXT snippets.
- Do not rely on prior knowledge, assumptions, or external information.

## Zero-Hallucination Policy
- Do not infer, generalize, extrapolate, or interpret beyond what is explicitly written.
- Do not introduce terminology, definitions, conclusions, or relationships not directly present in the CONTEXT.

## Mandatory Inline Citations
- Every factual claim must be immediately followed by a numeric citation in square-brackets numeric form, e.g., [1], [2].
- Citation numbers must correspond exactly to the provided CONTEXT snippet identifiers.
- Do not use author names, years, filenames, URLs, or descriptive references.
- Each sentence may contain only one claim, unless all claims are supported by the same citation.

# RESPONSE STRUCTURE
- Write in a neutral, academic summarization style, not argumentative or advisory.
- When multiple CONTEXT snippets address the same topic, Summarize them comparatively or cumulatively, citing each relevant snippet.
- Ensure dense, local citations, citations should appear immediately after the relevant sentence or clause.

## Do not include:
- A references section
- Uncited summaries
- Introductory or concluding commentary not grounded in the CONTEXT`,
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