document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const menuTrigger = document.getElementById('menu-trigger');
    const scanTypeDropdown = document.getElementById('scan-type-dropdown');
    const scanTypeSelect = document.getElementById('scan-type');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');
    const sendButton = document.getElementById('send-message');
    const newChatButton = document.getElementById('new-chat');
    const chatHistory = document.getElementById('chat-history');
    const imagePreview = document.getElementById('image-preview');
    const currentScanType = document.getElementById('current-scan-type');
    const imageProperties = document.getElementById('image-properties');
    const analysisProgress = document.getElementById('analysis-progress');
    const removeImageBtn = document.getElementById('remove-image');
    const uploadTrigger = document.getElementById('upload-trigger');

    let currentAnalysis = null;
    let currentImage = null;

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.scan-type-container')) {
            scanTypeDropdown.classList.add('hidden');
        }
    });

    // Prevent dropdown from closing when selecting options
    scanTypeDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Handle scan type selection
    scanTypeSelect.addEventListener('change', (e) => {
        const selectedType = e.target.value;
        const selectedText = e.target.options[e.target.selectedIndex].text;
        
        currentScanType.textContent = selectedText;
        addMessage(`Scan type set to: ${selectedText}`, 'system');
        updateImageRequirements(selectedType);
        
        // Hide dropdown after selection
        setTimeout(() => {
            scanTypeDropdown.classList.add('hidden');
        }, 300);
    });

    // New Chat Button Handler
    newChatButton.addEventListener('click', () => {
        resetChat();
    });

    // Upload Trigger Handler
    uploadTrigger.addEventListener('click', () => {
        if (!scanTypeSelect.value) {
            addMessage('Please select a scan type before uploading an image.', 'system');
            scanTypeSelect.focus();
            return;
        }
        fileInput.click();
    });

    // File Input Handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Remove Image Handler
    removeImageBtn?.addEventListener('click', () => {
        currentImage = null;
        imagePreview.classList.add('hidden');
        imageProperties.innerHTML = '<p>No image uploaded</p>';
    });

    // Send Message Handler
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, 'user');
            messageInput.value = '';
            processUserMessage(message);
        }
    });

    // Message Input Handler
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendButton.click();
        }
    });

    function handleFileSelection(file) {
        if (!scanTypeSelect.value) {
            addMessage('Please select a scan type before uploading an image.', 'system');
            return;
        }

        if (!file.type.startsWith('image/')) {
            addMessage('Please upload a valid image file.', 'system');
            return;
        }

        currentImage = file;
        
        // Show image preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const previewImg = document.getElementById('preview-img');
            previewImg.src = e.target.result;
            imagePreview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);

        // Update image properties
        updateImageProperties(file);
        
        // Add to chat
        addMessage(`Uploaded ${file.name} for ${scanTypeSelect.options[scanTypeSelect.selectedIndex].text} analysis`, 'user');
        
        // Start analysis
        startAnalysis(file);
    }

    function updateImageProperties(file) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        imageProperties.innerHTML = `
            <div class="space-y-1">
                <p><span class="text-gray-400">Name:</span> ${file.name}</p>
                <p><span class="text-gray-400">Size:</span> ${sizeMB} MB</p>
                <p><span class="text-gray-400">Type:</span> ${file.type}</p>
            </div>
        `;
    }

    function updateImageRequirements(scanType) {
        const requirements = {
            // Brain & Neurological
            'brain_mri': 'Accepted formats: DICOM, NIfTI files. Required: T1, T2, and FLAIR sequences if available.',
            'brain_ct': 'Accepted formats: DICOM, high-resolution JPEG/PNG. Ensure complete brain series.',
            'spine_mri': 'Accepted formats: DICOM, NIfTI. Include sagittal and axial views.',
            'angiogram': 'Accepted formats: DICOM, high-resolution JPEG/PNG. Include all contrast phases.',
            
            // Chest & Cardiac
            'chest_xray': 'Accepted formats: DICOM, high-resolution JPEG/PNG. PA and lateral views preferred.',
            'chest_ct': 'Accepted formats: DICOM. Include both with/without contrast if available.',
            'cardiac_mri': 'Accepted formats: DICOM. Include all cardiac cycles and views.',
            'ecg': 'Accepted formats: PDF, SVG, or PNG. 12-lead ECG preferred.',
            
            // Abdominal & Pelvic
            'abdominal_ct': 'Accepted formats: DICOM. Include both with/without contrast phases.',
            'abdominal_mri': 'Accepted formats: DICOM, NIfTI. T1 and T2 weighted sequences required.',
            'ultrasound': 'Accepted formats: DICOM, high-resolution JPEG/PNG.',
            'pelvic_ct': 'Accepted formats: DICOM. Include complete pelvic series.',
            
            // Musculoskeletal
            'bone_xray': 'Accepted formats: DICOM, high-resolution JPEG/PNG. Multiple views recommended.',
            'joint_mri': 'Accepted formats: DICOM. T1, T2, and PD sequences preferred.',
            'dexa': 'Accepted formats: DICOM, high-resolution JPEG/PNG.',
            'arthrogram': 'Accepted formats: DICOM. Include pre and post contrast images.',
            
            // Cancer & Nuclear
            'pet_ct': 'Accepted formats: DICOM. Include both PET and CT series.',
            'mammogram': 'Accepted formats: DICOM. Include all standard views.',
            'nuclear': 'Accepted formats: DICOM. Include all time points.',
            
            // Other Imaging
            'dental_xray': 'Accepted formats: DICOM, high-resolution JPEG/PNG.',
            'fluoroscopy': 'Accepted formats: DICOM, video formats (MP4).',
            'endoscopy': 'Accepted formats: High-resolution JPEG/PNG, MP4 for video sequences.'
        };

        addMessage(requirements[scanType] || 'Please upload a high-quality medical image in DICOM or high-resolution format.', 'system');
    }

    function startAnalysis(file) {
        // Update progress bar
        const progressBar = analysisProgress.querySelector('.bg-blue-600');
        progressBar.style.width = '0%';
        
        addMessage('Starting analysis...', 'system');
        
        // Simulate analysis progress
        let progress = 0;
        const interval = setInterval(() => {
            progress += 20;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                completeAnalysis();
            }
        }, 500);
    }

    function completeAnalysis() {
        const scanType = scanTypeSelect.value;
        const analysis = generateAnalysisResult(scanType);
        
        currentAnalysis = analysis;
        
        const resultMessage = `
            <div class="space-y-3">
                <h3 class="font-semibold text-lg text-blue-400">Analysis Complete</h3>
                <div class="space-y-2">
                    <p><span class="text-gray-400">Diagnosis:</span> ${analysis.diagnosis}</p>
                    <p><span class="text-gray-400">Confidence:</span> ${analysis.confidence}</p>
                    <p><span class="text-gray-400">Findings:</span> ${analysis.findings}</p>
                    <p><span class="text-gray-400">Recommendations:</span> ${analysis.recommendations}</p>
                </div>
            </div>
        `;
        
        addMessage(resultMessage, 'assistant');
    }

    function generateAnalysisResult(scanType) {
        const results = {
            // Brain & Neurological
            'brain_mri': {
                diagnosis: 'Normal brain structure and signal intensity',
                confidence: '95%',
                findings: 'No acute infarction, mass, or hemorrhage. Normal ventricles and sulci.',
                recommendations: 'Routine follow-up as clinically indicated.'
            },
            'brain_ct': {
                diagnosis: 'No acute intracranial abnormality',
                confidence: '93%',
                findings: 'No hemorrhage, mass effect, or midline shift.',
                recommendations: 'No immediate follow-up required.'
            },
            'spine_mri': {
                diagnosis: 'Normal spinal alignment and cord signal',
                confidence: '94%',
                findings: 'No disc herniation or spinal stenosis.',
                recommendations: 'Continue current management plan.'
            },
            
            // Chest & Cardiac
            'chest_xray': {
                diagnosis: 'Clear lungs bilaterally',
                confidence: '92%',
                findings: 'Normal heart size, clear lung fields, no effusions.',
                recommendations: 'No acute chest findings.'
            },
            'cardiac_mri': {
                diagnosis: 'Normal cardiac function',
                confidence: '96%',
                findings: 'Normal ejection fraction, wall motion, and valve function.',
                recommendations: 'Routine cardiac follow-up.'
            },
            'ecg': {
                diagnosis: 'Normal sinus rhythm',
                confidence: '97%',
                findings: 'Regular rate and rhythm, normal intervals and axis.',
                recommendations: 'No acute cardiac intervention needed.'
            },
            
            // Default for other scan types
            'default': {
                diagnosis: 'Analysis complete',
                confidence: '90%',
                findings: 'Please consult with healthcare provider for detailed interpretation.',
                recommendations: 'Follow up with your doctor for complete evaluation.'
            }
        };
        
        return results[scanType] || results['default'];
    }

    function addMessage(content, sender, file = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'max-w-4xl mx-auto py-6';
        
        const messageContent = document.createElement('div');
        messageContent.className = `${sender === 'user' ? 'user-message' : 'assistant-message'} flex items-start gap-4`;
        
        // Avatar
        const avatar = document.createElement('div');
        avatar.className = `w-8 h-8 rounded-full ${sender === 'assistant' ? 'bg-blue-600' : sender === 'system' ? 'bg-purple-600' : 'bg-green-600'} flex items-center justify-center flex-shrink-0`;
        avatar.innerHTML = `
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="${sender === 'assistant' ? 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' : 
                       sender === 'system' ? 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' :
                       'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'}"/>
            </svg>
        `;
        
        // Message content
        const textDiv = document.createElement('div');
        textDiv.className = 'flex-1';
        textDiv.innerHTML = content;
        
        messageContent.appendChild(avatar);
        messageContent.appendChild(textDiv);
        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function processUserMessage(message) {
        // Simple response system
        setTimeout(() => {
            if (message.toLowerCase().includes('help')) {
                addMessage(`
                    <div class="space-y-2">
                        <p>Here's how to use the Medical AI Assistant:</p>
                        <ol class="list-decimal list-inside space-y-1 text-gray-300">
                            <li>Select the type of scan from the dropdown menu</li>
                            <li>Upload your medical image using the upload button</li>
                            <li>Wait for the analysis to complete</li>
                            <li>Ask any questions about the results</li>
                        </ol>
                    </div>
                `, 'assistant');
            } else {
                addMessage('I understand your question. How else can I help you with the analysis?', 'assistant');
            }
        }, 500);
    }

    function resetChat() {
        chatMessages.innerHTML = '';
        currentAnalysis = null;
        currentImage = null;
        imagePreview.classList.add('hidden');
        imageProperties.innerHTML = '<p>No image uploaded</p>';
        scanTypeSelect.selectedIndex = 0;
        currentScanType.textContent = 'Not selected';
        const progressBar = analysisProgress.querySelector('.bg-blue-600');
        progressBar.style.width = '0%';
        
        // Add welcome message
        addMessage(`
            <div class="space-y-3">
                <p>Welcome to Medical AI Assistant! Let's analyze your medical images.</p>
                <p class="text-gray-400">Please select the type of scan from the dropdown menu above to begin.</p>
            </div>
        `, 'assistant');
    }

    // Initialize chat
    resetChat();
});
