document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-input');
    const sendButton = document.getElementById('send-button');
    const newChatButton = document.getElementById('new-chat');
    const chatHistory = document.getElementById('chat-history');
    const analysisDetails = document.getElementById('analysis-details');

    let currentAnalysis = null;

    // New Chat Button Handler
    newChatButton.addEventListener('click', () => {
        resetChat();
    });

    // Upload Area Handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    uploadArea.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    function handleFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            addMessage('Please upload a valid medical image file.', 'ai');
            return;
        }

        // Add to chat history
        addChatHistoryItem(file.name);
        
        // Show the image in chat
        addMessage(`Uploaded: ${file.name}`, 'user', file);
        
        // Start analysis
        startAnalysis(file);
    }

    function startAnalysis(file) {
        addMessage('Analyzing your medical image...', 'ai');
        
        // Simulate analysis (replace with actual API call)
        setTimeout(() => {
            const analysis = {
                diagnosis: 'Normal scan detected',
                confidence: '95%',
                findings: 'No abnormalities detected',
                recommendations: 'Regular follow-up recommended'
            };
            
            currentAnalysis = analysis;
            updateAnalysisDetails(analysis);
            
            const resultMessage = `
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg text-blue-400">Analysis Complete</h3>
                    <p><span class="text-gray-400">Diagnosis:</span> ${analysis.diagnosis}</p>
                    <p><span class="text-gray-400">Confidence:</span> ${analysis.confidence}</p>
                    <p><span class="text-gray-400">Findings:</span> ${analysis.findings}</p>
                    <p><span class="text-gray-400">Recommendations:</span> ${analysis.recommendations}</p>
                </div>
            `;
            
            addMessage(resultMessage, 'ai');
        }, 2000);
    }

    function addMessage(content, sender, file = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start gap-4 fade-in`;
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = `w-8 h-8 rounded-full ${sender === 'ai' ? 'bg-blue-600' : 'bg-green-600'} flex items-center justify-center flex-shrink-0`;
        avatar.innerHTML = `
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="${sender === 'ai' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'}"/>
            </svg>
        `;

        // Message Content
        const bubble = document.createElement('div');
        bubble.className = 'flex-1 bg-[#2D2D2D] rounded-lg p-4';
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.className = 'image-preview mb-4';
                bubble.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
        
        const textDiv = document.createElement('div');
        textDiv.innerHTML = content;
        bubble.appendChild(textDiv);

        if (sender === 'ai') {
            messageDiv.appendChild(avatar);
            messageDiv.appendChild(bubble);
        } else {
            messageDiv.appendChild(bubble);
            messageDiv.appendChild(avatar);
        }

        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addChatHistoryItem(title) {
        const item = document.createElement('div');
        item.className = 'chat-history-item p-3 rounded-lg cursor-pointer text-gray-300 hover:text-white mb-2';
        item.innerHTML = `
            <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span class="truncate">${title}</span>
            </div>
        `;
        chatHistory.insertBefore(item, chatHistory.firstChild);
    }

    function updateAnalysisDetails(analysis) {
        analysisDetails.innerHTML = `
            <div class="analysis-detail">
                <div class="analysis-detail-label">Diagnosis</div>
                <div class="analysis-detail-value">${analysis.diagnosis}</div>
            </div>
            <div class="analysis-detail">
                <div class="analysis-detail-label">Confidence</div>
                <div class="analysis-detail-value">${analysis.confidence}</div>
            </div>
            <div class="analysis-detail">
                <div class="analysis-detail-label">Findings</div>
                <div class="analysis-detail-value">${analysis.findings}</div>
            </div>
        `;
    }

    function resetChat() {
        chatMessages.innerHTML = '';
        analysisDetails.innerHTML = '';
        currentAnalysis = null;
        addMessage('Welcome to Medical AI Assistant! I can help you analyze medical images including MRIs, X-rays, and CT scans. Upload an image to begin the analysis.', 'ai');
    }
});
