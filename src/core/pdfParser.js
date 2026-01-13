import * as pdfjsLib from 'pdf.js';

export class PDFProcessor {
    constructor(config) {
        this.chunkSize = config.CHUNK_SIZE || 500;
        this.overlap = config.OVERLAP || 50;

        // Initialize PDF.js worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.mjs';
    }

    async loadFile(file) {
        console.log(`PDFProcessor: Loading file ${file.name}`);
        
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            let fullText = '';

            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            return fullText;
        } catch (error) {
            console.error('Error processing PDF:', error);
            throw new Error(`Failed to process PDF: ${error.message}`);
        }
    }

    chunkText(text) {
        console.log("PDFProcessor: Chunking text...");
        // TODO: Implement sliding window chunking
        return [
            { text: text.substring(0, 100), metadata: { page: 1 } } // Mock
        ];
    }
}