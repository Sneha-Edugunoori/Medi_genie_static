// 🔧 CONFIGURATION - UPDATE THESE WITH YOUR API KEYS
const SUPABASE_URL = 'https://fuytavhlulrlimlonmst.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M';

// 🚨 PASTE YOUR GEMINI API KEY HERE 🚨
const GEMINI_API_KEY = 'AIzaSyDwIJE_rkNoG7fLSRDqwNCFHaCJHovK97E'; // Replace with your actual Gemini API key

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentUser = null;
let isProcessing = false;

// 🚀 Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 MediGenie Records System Starting...');
    
    // Check authentication
    await checkAuth();
    
    // Load existing records
    await loadRecords();
    
    // Setup drag and drop
    setupDragAndDrop();
    
    console.log('✅ System initialized successfully');
});

// 🔐 Authentication Check
async function checkAuth() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Auth error:', error);
            // For demo purposes, create a dummy user
            currentUser = { id: 'demo-user-123', email: 'demo@example.com' };
            return;
        }
        
        if (user) {
            currentUser = user;
            console.log('✅ User authenticated:', user.email);
        } else {
            // For demo purposes, create a dummy user
            currentUser = { id: 'demo-user-123', email: 'demo@example.com' };
            console.log('⚠️ No user session, using demo mode');
        }
    } catch (error) {
        console.error('Authentication check failed:', error);
        currentUser = { id: 'demo-user-123', email: 'demo@example.com' };
    }
}

// 📄 Load existing records from database
async function loadRecords() {
    try {
        const { data: records, error } = await supabase
            .from('documents')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading records:', error);
            return;
        }

        const recordsList = document.getElementById('recordsList');
        const noRecords = document.getElementById('noRecords');

        if (!records || records.length === 0) {
            noRecords.style.display = 'block';
            return;
        }

        noRecords.style.display = 'none';
        recordsList.innerHTML = '';

        records.forEach(record => {
            const recordElement = createRecordElement(record);
            recordsList.appendChild(recordElement);
        });

        console.log(`✅ Loaded ${records.length} medical records`);
    } catch (error) {
        console.error('Failed to load records:', error);
        showErrorModal('Failed to load your medical records. Please refresh the page.');
    }
}

// 🏗️ Create record element for display
function createRecordElement(record) {
    const recordDiv = document.createElement('div');
    recordDiv.className = 'record-item fade-in';
    recordDiv.dataset.recordId = record.id;

    const iconType = getRecordIconType(record.file_name);
    const formattedDate = new Date(record.created_at).toLocaleDateString();

    recordDiv.innerHTML = `
        <div class="record-icon ${iconType.class}">
            <i class="${iconType.icon}"></i>
        </div>
        <div class="record-info">
            <div class="record-title">${record.file_name}</div>
            <p class="record-details">${formattedDate} • ${record.status} • AI Processed</p>
        </div>
        <div class="record-actions">
            <button class="icon-btn btn-view" title="View" onclick="viewRecord('${record.id}')">
                <i class="fas fa-eye"></i>
            </button>
            <button class="icon-btn btn-download" title="Download" onclick="downloadRecord('${record.file_url}', '${record.file_name}')">
                <i class="fas fa-download"></i>
            </button>
            <button class="icon-btn btn-delete" title="Delete" onclick="deleteRecord('${record.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;

    return recordDiv;
}

// 🎨 Get appropriate icon for record type
function getRecordIconType(filename) {
    const name = filename.toLowerCase();
    
    if (name.includes('blood') || name.includes('test') || name.includes('lab')) {
        return { class: 'icon-blood', icon: 'fas fa-vial' };
    } else if (name.includes('xray') || name.includes('x-ray') || name.includes('scan')) {
        return { class: 'icon-xray', icon: 'fas fa-x-ray' };
    } else if (name.includes('prescription') || name.includes('medicine') || name.includes('drug')) {
        return { class: 'icon-prescription', icon: 'fas fa-prescription-bottle-alt' };
    } else {
        return { class: 'icon-default', icon: 'fas fa-file-medical-alt' };
    }
}

// 🖱️ Setup drag and drop functionality
function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
    });

    uploadArea.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

function handleDrop(e) {
    const files = e.dataTransfer.files;
    handleFileUpload({ target: { files } });
}

// 📁 Trigger file input
function triggerFileInput() {
    document.getElementById('fileInput').click();
}

// 📤 Handle file upload
async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    if (isProcessing) {
        showErrorModal('Please wait for the current upload to complete.');
        return;
    }

    isProcessing = true;
    showProcessingOverlay();

    try {
        for (let i = 0; i < validFiles.length; i++) {
            await processFile(validFiles[i], i + 1, validFiles.length);
        }

        await loadRecords(); // Refresh the records list
        showSuccessToast(`Successfully processed ${validFiles.length} file(s)!`);
        
    } catch (error) {
        console.error('Upload process failed:', error);
        showErrorModal('Failed to process your files. Please try again.');
    } finally {
        isProcessing = false;
        hideProcessingOverlay();
        
        // Reset file input
        document.getElementById('fileInput').value = '';
    }
}

// ✅ Validate uploaded files
function validateFiles(files) {
    const validFiles = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

    files.forEach(file => {
        if (file.size > maxSize) {
            showErrorModal(`File "${file.name}" is too large. Maximum size is 10MB.`);
            return;
        }

        if (!allowedTypes.includes(file.type)) {
            showErrorModal(`File "${file.name}" is not supported. Please upload JPG, PNG, or PDF files.`);
            return;
        }

        validFiles.push(file);
    });

    return validFiles;
}

// 🔄 Process individual file
async function processFile(file, currentIndex, totalFiles) {
    try {
        updateProcessingText(`Processing file ${currentIndex} of ${totalFiles}: ${file.name}`);
        updateProgressBar(0);

        // Step 1: Upload to Supabase Storage
        updateProcessingText(`Uploading ${file.name}...`);
        const fileData = await uploadToStorage(file);
        updateProgressBar(25);

        // Step 2: Extract text using OCR
        updateProcessingText(`Extracting text from ${file.name}...`);
        const ocrText = await extractTextFromImage(file);
        updateProgressBar(60);

        // Step 3: Generate AI summary
        updateProcessingText(`Generating AI summary for ${file.name}...`);
        const summary = await generateSummary(ocrText);
        updateProgressBar(80);

        // Step 4: Save to database
        updateProcessingText(`Saving ${file.name} to database...`);
        await saveToDatabase(fileData, ocrText, summary);
        updateProgressBar(100);

        console.log(`✅ Successfully processed: ${file.name}`);

    } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error.message}`);
    }
}

// ☁️ Upload file to Supabase Storage
async function uploadToStorage(file) {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('medical-docs')
            .upload(fileName, file);

        if (error) throw error;

        // Get public URL
        const { data: publicData } = supabase.storage
            .from('medical-docs')
            .getPublicUrl(fileName);

        return {
            fileName: file.name,
            storagePath: fileName,
            publicUrl: publicData.publicUrl
        };

    } catch (error) {
        console.error('Storage upload error:', error);
        throw new Error('Failed to upload file to storage');
    }
}

// 👁️ Extract text from image using Tesseract.js
async function extractTextFromImage(file) {
    try {
        // Only process images, skip PDFs for now
        if (file.type === 'application/pdf') {
            return 'PDF text extraction not implemented in this demo. Please convert to image format.';
        }

        const { data: { text } } = await Tesseract.recognize(file, 'eng', {
            logger: m => {
                if (m.status === 'recognizing text') {
                    const progress = Math.round(m.progress * 40) + 25; // 25-65% of total progress
                    updateProgressBar(progress);
                }
            }
        });

        return text.trim() || 'No text could be extracted from this image.';

    } catch (error) {
        console.error('OCR extraction error:', error);
        return 'Failed to extract text from the image.';
    }
}

// 🤖 Generate summary using Gemini API
async function generateSummary(text) {
    try {
        // Check if Gemini API key is configured
        if (!GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
            console.warn('⚠️ Gemini API key not configured');
            return 'AI summary not available - API key not configured. Please add your Gemini API key to enable AI summaries.';
        }

        if (!text || text.trim().length < 10) {
            return 'No meaningful text found to summarize.';
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Please provide a concise medical summary (3-4 sentences) of the following medical document text. Focus on key findings, recommendations, and important medical information:\n\n${text.substring(0, 4000)}`
                        }]
                    }]
                })
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const summary = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        return summary || 'Unable to generate summary from the extracted text.';

    } catch (error) {
        console.error('Summary generation error:', error);
        return 'Failed to generate AI summary. The document has been saved with OCR text only.';
    }
}

// 💾 Save processed data to database
async function saveToDatabase(fileData, ocrText, summary) {
    try {
        const { data, error } = await supabase
            .from('documents')
            .insert([{
                user_id: currentUser.id,
                file_name: fileData.fileName,
                file_url: fileData.publicUrl,
                storage_path: fileData.storagePath,
                ocr_text: ocrText,
                summary: summary,
                status: 'processed'
            }]);

        if (error) throw error;

        console.log('✅ Document saved to database');
        return data;

    } catch (error) {
        console.error('Database save error:', error);
        throw new Error('Failed to save document to database');
    }
}

// 👀 View record in modal
async function viewRecord(recordId) {
    try {
        const { data: record, error } = await supabase
            .from('documents')
            .select('*')
            .eq('id', recordId)
            .single();

        if (error || !record) {
            showErrorModal('Failed to load record details.');
            return;
        }

        // Populate modal
        document.getElementById('recordModalLabel').textContent = record.file_name;
        document.getElementById('recordDate').textContent = new Date(record.created_at).toLocaleString();
        document.getElementById('recordSummary').textContent = record.summary || 'No summary available.';
        document.getElementById('recordOCR').textContent = record.ocr_text || 'No text extracted.';
        
        // Setup download button
        const downloadBtn = document.getElementById('downloadBtn');
        downloadBtn.onclick = () => downloadRecord(record.file_url, record.file_name);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('recordModal'));
        modal.show();

    } catch (error) {
        console.error('Error viewing record:', error);
        showErrorModal('Failed to load record details.');
    }
}

// 📥 Download record
async function downloadRecord(fileUrl, fileName) {
    try {
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showSuccessToast('File downloaded successfully!');

    } catch (error) {
        console.error('Download error:', error);
        showErrorModal('Failed to download file.');
    }
}

// 🗑️ Delete record
async function deleteRecord(recordId) {
    if (!confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
        return;
    }

    try {
        // Get record details first
        const { data: record } = await supabase
            .from('documents')
            .select('storage_path')
            .eq('id', recordId)
            .single();

        // Delete from storage
        if (record?.storage_path) {
            await supabase.storage
                .from('medical-docs')
                .remove([record.storage_path]);
        }

        // Delete from database
        const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', recordId);

        if (error) throw error;

        // Remove from UI
        const recordElement = document.querySelector(`[data-record-id="${recordId}"]`);
        if (recordElement) {
            recordElement.remove();
        }

        // Check if no records left
        const recordsList = document.getElementById('recordsList');
        if (recordsList.children.length === 0) {
            document.getElementById('noRecords').style.display = 'block';
        }

        showSuccessToast('Record deleted successfully!');

    } catch (error) {
        console.error('Delete error:', error);
        showErrorModal('Failed to delete record.');
    }
}

// 📱 Camera functions (placeholder for future implementation)
function openCamera() {
    showErrorModal('Camera feature is not yet implemented. Please use the file upload option.');
}

function capturePhoto() {
    // Placeholder for camera capture
}

function closeCamera() {
    document.getElementById('cameraModal').style.display = 'none';
}

// ℹ️ Show OCR information
function showOCRInfo() {
    const modal = new bootstrap.Modal(document.getElementById('ocrInfoModal'));
    modal.show();
}

// 🔔 UI Helper Functions

function showProcessingOverlay() {
    document.getElementById('processingOverlay').style.display = 'flex';
    updateProgressBar(0);
}

function hideProcessingOverlay() {
    document.getElementById('processingOverlay').style.display = 'none';
}

function updateProcessingText(text) {
    document.getElementById('processingText').textContent = text;
}

function updateProgressBar(percentage) {
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${percentage}%`;
}

function showSuccessToast(message) {
    document.getElementById('successMessage').textContent = message;
    const toast = new bootstrap.Toast(document.getElementById('successToast'));
    toast.show();
}

function showErrorModal(message) {
    document.getElementById('errorMessage').textContent = message;
    const modal = new bootstrap.Modal(document.getElementById('errorModal'));
    modal.show();
}

// 🔗 Navigation functions (placeholders)
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Implement logout logic
        window.location.href = 'login.html';
    }
}

function showNotifications() {
    showErrorModal('Notifications feature coming soon!');
}

function toggleProfileDropdown() {
    showErrorModal('Profile dropdown feature coming soon!');
}

// 📚 Database Schema for Reference
/*
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    ocr_text TEXT,
    summary TEXT,
    status TEXT DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to only see their own documents
CREATE POLICY "Users can only see their own documents" ON documents
    FOR ALL USING (auth.uid() = user_id);

-- Create storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('medical-docs', 'medical-docs', true);

-- Create storage policy
CREATE POLICY "Users can upload their own files" ON storage.objects
    FOR ALL USING (auth.uid()::text = (storage.foldername(name))[1]);
*/