document.addEventListener('DOMContentLoaded', () => {
    // Element References
    const menuTrigger = document.getElementById('menu-trigger');
    const scanTypeDropdown = document.getElementById('scan-type-dropdown');
    const scanOptions = document.querySelectorAll('.scan-option');
    const chatMessages = document.getElementById('chat-messages');
    const messageInput = document.getElementById('message-input');
    const fileInput = document.getElementById('file-input');
    const uploadTrigger = document.getElementById('upload-trigger');
    const dropZone = document.getElementById('drop-zone');
    const sendButton = document.getElementById('send-message');
    const newChatButton = document.getElementById('new-chat');
    const chatHistory = document.getElementById('chat-history');
    const imagePreview = document.getElementById('image-preview');
    const currentScanType = document.getElementById('current-scan-type');
    const imageProperties = document.getElementById('image-properties');
    const analysisProgress = document.getElementById('analysis-progress');
    const removeImageBtn = document.getElementById('remove-image');

    let currentAnalysis = null;
    let currentImage = null;
    let isMenuOpen = false;

    // Initialize with welcome message
    function showWelcomeMessage() {
        const welcomeDiv = document.createElement('div');
        welcomeDiv.className = 'assistant-message';
        welcomeDiv.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                </div>
                <div class="flex-1 space-y-3">
                    <p>Welcome to Medical AI Assistant! Let's analyze your medical images.</p>
                    <p class="text-gray-400">Please select the type of scan from the dropdown menu above to begin.</p>
                </div>
            </div>
        `;
        chatMessages.appendChild(welcomeDiv);
    }

    // Show welcome message on load
    showWelcomeMessage();

    // Chat Message Handler
    function addMessage(content, type = 'user') {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'user' ? 'user-message' : 'assistant-message';
        
        let avatarIcon;
        if (type === 'assistant') {
            avatarIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
        } else if (type === 'system') {
            avatarIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>';
        } else {
            avatarIcon = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>';
        }

        messageDiv.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-8 h-8 rounded-full ${type === 'assistant' ? 'bg-blue-600' : type === 'system' ? 'bg-purple-600' : 'bg-green-600'} flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${avatarIcon}
                    </svg>
                </div>
                <div class="flex-1">
                    ${content}
                </div>
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // File Upload Handlers
    function handleFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                currentImage = {
                    file: file,
                    width: img.width,
                    height: img.height,
                    size: formatFileSize(file.size),
                    type: file.type
                };
                
                // Update preview
                document.getElementById('preview-img').src = e.target.result;
                imagePreview.classList.remove('hidden');
                
                // Update properties
                imageProperties.innerHTML = `
                    <p>Size: ${currentImage.size}</p>
                    <p>Dimensions: ${currentImage.width}x${currentImage.height}px</p>
                    <p>Type: ${file.type}</p>
                `;

                // Hide drop zone
                dropZone.classList.add('hidden');
                
                // Add system message
                addMessage(`Image uploaded: ${file.name}`, 'system');
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Drag and Drop Event Handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('border-blue-500', 'bg-blue-500', 'bg-opacity-10');
    }

    function unhighlight() {
        dropZone.classList.remove('border-blue-500', 'bg-blue-500', 'bg-opacity-10');
    }

    dropZone.addEventListener('drop', handleDrop, false);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFile(file);
    }

    // File Input Handler
    uploadTrigger.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Remove Image Handler
    removeImageBtn.addEventListener('click', () => {
        currentImage = null;
        document.getElementById('preview-img').src = '';
        imagePreview.classList.add('hidden');
        dropZone.classList.remove('hidden');
        imageProperties.innerHTML = '<p>No image uploaded</p>';
        addMessage('Image removed', 'system');
    });

    // Position the dropdown relative to the trigger button
    function positionDropdown() {
        const triggerRect = menuTrigger.getBoundingClientRect();
        const dropdownRect = scanTypeDropdown.getBoundingClientRect();
        
        // Calculate available space below and above
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        
        // Position the dropdown
        if (spaceBelow >= dropdownRect.height || spaceBelow >= spaceAbove) {
            // Position below
            scanTypeDropdown.style.top = '100%';
            scanTypeDropdown.style.bottom = 'auto';
            scanTypeDropdown.style.maxHeight = `${Math.min(400, spaceBelow - 20)}px`;
        } else {
            // Position above
            scanTypeDropdown.style.bottom = '100%';
            scanTypeDropdown.style.top = 'auto';
            scanTypeDropdown.style.maxHeight = `${Math.min(400, spaceAbove - 20)}px`;
        }

        // Center horizontally in the middle column
        const mainColumn = document.querySelector('.flex-1.flex.flex-col');
        const mainColumnRect = mainColumn.getBoundingClientRect();
        scanTypeDropdown.style.width = `${mainColumnRect.width - 32}px`; // 32px for padding
        scanTypeDropdown.style.left = '16px'; // 16px padding from left
    }

    // Toggle menu on burger click
    menuTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            menuTrigger.classList.add('active');
            scanTypeDropdown.classList.remove('hidden');
            requestAnimationFrame(() => {
                positionDropdown();
                scanTypeDropdown.classList.add('show');
            });
        } else {
            menuTrigger.classList.remove('active');
            scanTypeDropdown.classList.remove('show');
            scanTypeDropdown.classList.add('hidden');
        }
    });

    // Add hover effect for menu trigger
    menuTrigger.addEventListener('mouseenter', () => {
        if (!isMenuOpen) {
            menuTrigger.style.transform = 'translateY(-2px)';
        }
    });

    menuTrigger.addEventListener('mouseleave', () => {
        if (!isMenuOpen) {
            menuTrigger.style.transform = 'translateY(0)';
        }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.scan-type-container') && isMenuOpen) {
            isMenuOpen = false;
            menuTrigger.classList.remove('active');
            scanTypeDropdown.classList.remove('show');
            scanTypeDropdown.classList.add('hidden');
        }
    });

    // Handle scan option selection
    scanOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const selectedValue = e.target.dataset.value;
            const selectedText = e.target.textContent;

            // Remove active class from all options
            scanOptions.forEach(opt => opt.classList.remove('active'));
            // Add active class to selected option
            e.target.classList.add('active');

            // Update current scan type display
            currentScanType.textContent = selectedText;
            
            // Show requirements for selected scan type
            updateImageRequirements(selectedValue);
            
            // Add message to chat
            addMessage(`Scan type set to: ${selectedText}`, 'system');

            // Close menu after selection
            setTimeout(() => {
                isMenuOpen = false;
                menuTrigger.classList.remove('active');
                scanTypeDropdown.classList.remove('show');
                scanTypeDropdown.classList.add('hidden');
            }, 300);
        });
    });

    // New Chat Button Handler
    newChatButton.addEventListener('click', () => {
        resetChat();
    });

    // Upload Trigger Handler
    uploadTrigger.addEventListener('click', () => {
        const selectedValue = scanOptions.find(option => option.classList.contains('active'))?.dataset.value;
        if (!selectedValue) {
            addMessage('Please select a scan type before uploading an image.', 'system');
            return;
        }
        fileInput.click();
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
        const selectedValue = scanOptions.find(option => option.classList.contains('active'))?.dataset.value;
        const analysis = generateAnalysisResult(selectedValue);
        
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
        scanOptions.forEach(option => option.classList.remove('active'));
        currentScanType.textContent = 'Not selected';
        const progressBar = analysisProgress.querySelector('.bg-blue-600');
        progressBar.style.width = '0%';
        
        // Add welcome message
        showWelcomeMessage();
    }

    // Initialize chat
    // resetChat();
});
