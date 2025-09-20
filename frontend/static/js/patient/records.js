// Medical Records JavaScript
let medicalRecords = [];
let currentUser = 'Sneha';
let cameraStream = null;

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    loadMedicalRecords();
    setupDragAndDrop();
});

// File Upload Functions
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

function handleFileUpload(event) {
    const files = event.target.files;
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            processFile(files[i]);
        }
    }
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
            processFile(files[i]);
        }
    });
}

// File Processing Functions
async function processFile(file) {
    if (!validateFile(file)) {
        return;
    }

    showProcessingOverlay(true);
    updateProcessingText('Uploading file...');
    updateProgress(20);

    try {
        // Simulate file upload
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateProcessingText('Extracting text with OCR...');
        updateProgress(50);

        // Perform OCR
        const ocrText = await performOCR(file);
        updateProcessingText('Generating AI summary...');
        updateProgress(80);

        // Generate AI summary
        const aiSummary = generateAISummary(ocrText);
        updateProgress(100);

        // Save the record
        const record = {
            id: generateId(),
            name: file.name,
            type: file.type,
            size: file.size,
            uploadDate: new Date().toISOString(),
            ocrText: ocrText,
            aiSummary: aiSummary,
            url: URL.createObjectURL(file)
        };

        medicalRecords.unshift(record);
        saveMedicalRecords();
        displayMedicalRecords();
        
        showSuccessToast('Document processed successfully!');
        
    } catch (error) {
        console.error('Error processing file:', error);
        showErrorModal('Failed to process the document. Please try again.');
    } finally {
        showProcessingOverlay(false);
    }
}

function validateFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
        showErrorModal('Please upload a valid image file (JPG, PNG, GIF) or PDF document.');
        return false;
    }

    if (file.size > maxSize) {
        showErrorModal('File size must be less than 10MB.');
        return false;
    }

    return true;
}

// OCR Functions
async function performOCR(file) {
    try {
        // Create FormData to send file to backend
        const formData = new FormData();
        formData.append('file', file);

        // Send request to Python backend on port 4000
        const response = await fetch('http://localhost:4000/ocr', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            return result.text || 'No text could be extracted from this file.';
        } else {
            throw new Error(result.error || 'OCR processing failed');
        }

    } catch (error) {
        console.error('OCR Error:', error);
        
        // Fallback to client-side OCR if backend fails
        if (file.type.startsWith('image/')) {
            console.log('Falling back to client-side OCR...');
            return await performClientSideOCR(file);
        }
        
        return 'Error occurred during text extraction: ' + error.message;
    }
}

// Fallback client-side OCR function
async function performClientSideOCR(file) {
    try {
        const result = await Tesseract.recognize(file, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(50 + (m.progress * 30));
                    updateProgress(progress);
                }
            }
        });

        return result.data.text || 'No text could be extracted from this image.';
    } catch (error) {
        console.error('Client-side OCR Error:', error);
        return 'Error occurred during text extraction.';
    }
}

function generateAISummary(ocrText) {
    // Simple AI summary simulation
    if (!ocrText || ocrText.trim().length === 0) {
        return 'No readable text found in the document.';
    }

    // Mock AI summary based on common medical terms
    const medicalTerms = ['blood', 'pressure', 'test', 'result', 'normal', 'abnormal', 'patient', 'doctor', 'medication', 'diagnosis'];
    const foundTerms = medicalTerms.filter(term => ocrText.toLowerCase().includes(term));

    if (foundTerms.length > 0) {
        return `Medical document containing information about: ${foundTerms.join(', ')}. The document appears to be a ${getDocumentType(ocrText)} with key findings related to patient health status.`;
    }

    return 'Medical document processed. Text extracted successfully for review.';
}

function getDocumentType(text) {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('lab') || lowerText.includes('test')) return 'laboratory report';
    if (lowerText.includes('prescription') || lowerText.includes('medication')) return 'prescription';
    if (lowerText.includes('discharge') || lowerText.includes('hospital')) return 'discharge summary';
    if (lowerText.includes('x-ray') || lowerText.includes('scan')) return 'imaging report';
    return 'medical report';
}

// Display Functions
function displayMedicalRecords() {
    const recordsList = document.getElementById('recordsList');
    const noRecords = document.getElementById('noRecords');

    if (medicalRecords.length === 0) {
        noRecords.style.display = 'block';
        recordsList.innerHTML = '';
        recordsList.appendChild(noRecords);
        return;
    }

    noRecords.style.display = 'none';
    recordsList.innerHTML = '';

    medicalRecords.forEach(record => {
        const recordElement = createRecordElement(record);
        recordsList.appendChild(recordElement);
    });
}

function createRecordElement(record) {
    const div = document.createElement('div');
    div.className = 'record-item';
    div.innerHTML = `
        <div class="record-info">
            <div class="record-icon">
                <i class="fas fa-file-medical-alt"></i>
            </div>
            <div class="record-details">
                <h5 class="record-name">${record.name}</h5>
                <p class="record-meta">
                    Uploaded: ${formatDate(record.uploadDate)} • 
                    Size: ${formatFileSize(record.size)}
                </p>
                <p class="record-summary">${record.aiSummary}</p>
            </div>
        </div>
        <div class="record-actions">
            <button class="btn btn-sm btn-outline-primary" onclick="viewRecord('${record.id}')">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteRecord('${record.id}')">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    return div;
}

// Record Actions
function viewRecord(recordId) {
    const record = medicalRecords.find(r => r.id === recordId);
    if (!record) return;

    // Populate modal
    document.getElementById('recordModalLabel').textContent = record.name;
    document.getElementById('recordDate').textContent = formatDate(record.uploadDate);
    document.getElementById('recordSummary').textContent = record.aiSummary;
    document.getElementById('recordOCR').textContent = record.ocrText;
    
    // Set download button
    document.getElementById('downloadBtn').onclick = () => downloadRecord(record);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('recordModal'));
    modal.show();
}

function deleteRecord(recordId) {
    if (confirm('Are you sure you want to delete this record?')) {
        medicalRecords = medicalRecords.filter(r => r.id !== recordId);
        saveMedicalRecords();
        displayMedicalRecords();
        showSuccessToast('Record deleted successfully!');
    }
}

function downloadRecord(record) {
    const a = document.createElement('a');
    a.href = record.url;
    a.download = record.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// Camera Functions
function openCamera() {
    document.getElementById('cameraModal').style.display = 'flex';
    
    navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
            cameraStream = stream;
            const video = document.createElement('video');
            video.srcObject = stream;
            video.autoplay = true;
            video.style.width = '100%';
            video.style.height = '300px';
            video.style.objectFit = 'cover';
            video.style.borderRadius = '10px';
            
            const preview = document.getElementById('cameraPreview');
            preview.innerHTML = '';
            preview.appendChild(video);
        })
        .catch(error => {
            console.error('Camera error:', error);
            showErrorModal('Unable to access camera. Please check permissions.');
            closeCamera();
        });
}

function capturePhoto() {
    if (!cameraStream) return;

    const video = document.querySelector('#cameraPreview video');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob(blob => {
        const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
        processFile(file);
        closeCamera();
    }, 'image/jpeg', 0.8);
}

function closeCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    document.getElementById('cameraModal').style.display = 'none';
    document.getElementById('cameraPreview').innerHTML = '<i class="fas fa-camera" style="font-size: 48px;"></i><br>Camera will appear here';
}

// UI Helper Functions
function showProcessingOverlay(show) {
    document.getElementById('processingOverlay').style.display = show ? 'flex' : 'none';
    if (!show) {
        updateProgress(0);
        updateProcessingText('Uploading file...');
    }
}

function updateProcessingText(text) {
    document.getElementById('processingText').textContent = text;
}

function updateProgress(percent) {
    document.getElementById('progressBar').style.width = `${percent}%`;
}

function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
}

function showSuccessToast(message) {
    document.getElementById('successMessage').textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
}

function showOCRInfo() {
    const modal = new bootstrap.Modal(document.getElementById('ocrInfoModal'));
    modal.show();
}

// Data Management
function loadMedicalRecords() {
    const saved = localStorage.getItem(`medicalRecords_${currentUser}`);
    if (saved) {
        medicalRecords = JSON.parse(saved);
        displayMedicalRecords();
    }
}

function saveMedicalRecords() {
    localStorage.setItem(`medicalRecords_${currentUser}`, JSON.stringify(medicalRecords));
}

// Utility Functions
function generateId() {
    return 'record_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Navigation Functions (referenced in HTML)
function showNotifications() {
    alert('Notifications feature coming soon!');
}

function toggleProfileDropdown() {
    alert('Profile dropdown feature coming soon!');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session data
        localStorage.removeItem('currentUser');
        window.location.href = '/login.html';
    }
}