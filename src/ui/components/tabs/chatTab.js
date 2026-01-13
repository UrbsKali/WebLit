export class ChatTab {
    constructor(context) {
        this.context = context;
    }

    render(container) {
        container.innerHTML = `<div class="p-10 flex flex-col h-full bg-slate-900">
            <div id="chat-history" class="flex-1 overflow-y-auto custom-scrollbar mb-4 space-y-4 pr-4">
                <!-- Chat Items -->
                <div class="text-center text-slate-500 mt-20">
                    <h2 class="text-xl font-semibold mb-2">Classic Chat</h2>
                    <p>Start a conversation with the loaded model.</p>
                </div>
            </div>
            <div class="relative">
                <textarea id="chat-input" class="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 pr-12 text-slate-200 focus:outline-none focus:border-indigo-500 resize-none h-24" placeholder="Type your message..."></textarea>
                <button id="chat-send-btn" class="absolute right-3 bottom-3 p-2 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500">
                    <i data-lucide="send" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`;
        
        // Bind Chat Events immediately after rendering
        setTimeout(() => {
            const input = document.getElementById('chat-input');
            const btn = document.getElementById('chat-send-btn');
            if (btn && input) {
                btn.addEventListener('click', () => {
                    const event = new CustomEvent('chat-message-send', { detail: input.value });
                    document.dispatchEvent(event);
                    input.value = '';
                });
            }
        }, 0);
    }
}