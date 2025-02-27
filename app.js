document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const fileInput = document.getElementById('file-input');
    const sendButton = document.getElementById('send-button');
    const uploadArea = document.getElementById('upload-area');

    let selectedFile = null;

    // Handle drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('border-blue-500');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('border-blue-500');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('border-blue-500');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelection(files[0]);
        }
    });

    // Handle file input change
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Handle file selection
    function handleFileSelection(file) {
        if (!file.type.startsWith('image/')) {
            addMessage('Please upload a valid medical image file.', 'ai');
            return;
        }
        selectedFile = file;
        addMessage(`Selected file: ${file.name}`, 'user');
        
        // Preview the image
        const reader = new FileReader();
        reader.onload = (e) => {
            const preview = document.createElement('img');
            preview.src = e.target.result;
            preview.classList.add('image-preview', 'mt-2');
            chatMessages.lastElementChild.appendChild(preview);
        };
        reader.readAsDataURL(file);
    }

    // Handle send button click
    sendButton.addEventListener('click', async () => {
        if (!selectedFile) {
            addMessage('Please select an image first.', 'ai');
            return;
        }

        // Show loading message
        addMessage('Analyzing your medical image...', 'ai');
        
        // Simulate AI analysis (replace with actual API call)
        setTimeout(() => {
            // Example analysis result
            const analysis = {
                diagnosis: 'Normal scan detected',
                confidence: '95%',
                details: 'No abnormalities detected in the provided image.',
                recommendations: 'Regular follow-up recommended as per standard protocol.'
            };
            
            // Display analysis results
            const resultMessage = `
                <div class="space-y-2">
                    <h3 class="font-semibold text-lg">Analysis Results</h3>
                    <p><strong>Diagnosis:</strong> ${analysis.diagnosis}</p>
                    <p><strong>Confidence:</strong> ${analysis.confidence}</p>
                    <p><strong>Details:</strong> ${analysis.details}</p>
                    <p><strong>Recommendations:</strong> ${analysis.recommendations}</p>
                </div>
            `;
            addMessage(resultMessage, 'ai');
            
            // Reset file selection
            selectedFile = null;
            fileInput.value = '';
        }, 2000);
    });

    // Add message to chat
    function addMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `flex items-start fade-in ${sender === 'ai' ? 'flex-row' : 'flex-row-reverse'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'flex-shrink-0';
        avatar.innerHTML = `
            <div class="w-8 h-8 rounded-full ${sender === 'ai' ? 'bg-blue-500' : 'bg-green-500'} flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="${sender === 'ai' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'}"/>
                </svg>
            </div>
        `;

        const bubble = document.createElement('div');
        bubble.className = `${sender === 'ai' ? 'ml-3 ai-message' : 'mr-3 user-message'} max-w-3xl`;
        bubble.innerHTML = content;

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
});
