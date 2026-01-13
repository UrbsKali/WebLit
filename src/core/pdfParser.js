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

            // remove citation brackets like [1], [2], and also [12, 14] and derivate forms ([ 47   ,   61 ])
            fullText = fullText.replace(/\[\s*\d+(\s*,\s*\d+)*\s*\]/g, '');

            // remove url links to doi and arxiv
            fullText = fullText.replace(/https?:\/\/(doi\.org|arxiv\.org)\/[^\s]+/g, '');

            //remove arxiv ids like arXiv:1234.56789 or arXiv:hep-th/9901001
            fullText = fullText.replace(/arXiv:\d{4}\.\d{4,5}(v\d+)?|arXiv:[a-z\-]+(\/\d{7})(v\d+)?/g, '');

            // remove emails
            fullText = fullText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '');

            // remove figure captions like Figure 1:, Fig. 2., FIGURE 3 -
            fullText = fullText.replace(/(Figure|Fig\.|FIGURE)\s*\d+[:.\-]/g, '');

            // remove classique style inline citations like (Author et al., 2020)
            fullText = fullText.replace(/\([A-Za-z\s]+et al\.,\s*\d{4}\)/g, '');


            // if possible, remove entierly the References section
            const refIndex = fullText.search(/References|REFERENCES|Bibliography|BIBLIOGRAPHY/);
            if (refIndex !== -1) {
                fullText = fullText.substring(0, refIndex);
            }

            return fullText;
        } catch (error) {
            console.error('Error processing PDF:', error);
            throw new Error(`Failed to process PDF: ${error.message}`);
        }
    }

    chunkText(text) {
        console.log("PDFProcessor: Chunking text...");
        const chunks = [];
        
        // Simple sliding window
        // Ensure we don't loop indefinitely
        if (text.length === 0) return chunks;

        let start = 0;
        let pageNum = 1; // Basic page estimation could count newlines or form feeds, but here we just process raw text.
                         // Ideally, we'd preserve page structure from loadFile, but loadFile currently joins all text.

        while (start < text.length) {
            const end = Math.min(start + this.chunkSize, text.length);
            let chunkText = text.substring(start, end);

            // Push chunk
            chunks.push({
                text: chunkText,
                metadata: {
                    source: "pdf",
                    estimated_index: chunks.length
                }
            });

            // Move window
            start += (this.chunkSize - this.overlap);
            // Safety break for Infinite loops if overlap >= chunksize
            if (this.overlap >= this.chunkSize) {
                console.warn("Overlap >= Chunk Size. Forcing progress.");
                start = end; 
            }
        }
        
        console.log(`Generated ${chunks.length} chunks.`);
        return chunks;
    }
}