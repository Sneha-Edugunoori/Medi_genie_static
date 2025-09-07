        // Profile Dropdown Toggle
        function toggleProfileDropdown() {
            console.log('Profile dropdown clicked');
        }

        // File Upload Functions
        function triggerFileInput() {
            document.getElementById('fileInput').click();
        }

        function handleFileUpload(event) {
            const files = event.target.files;
            if (files.length > 0) {
                processFiles(files);
            }
        }

        // Drag and Drop
        const uploadArea = document.getElementById('uploadArea');

        uploadArea.addEventListener('dragover', function(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', function(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFiles(files);
            }
        });

        // File validation
        function validateFile(file) {
            const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
            const maxSize = 10 * 1024 * 1024; // 10MB
            
            if (!allowedTypes.includes(file.type)) {
                alert('Please upload only JPG, PNG, or PDF files.');
                return false;
            }
            
            if (file.size > maxSize) {
                alert('File size must be less than 10MB.');
                return false;
            }
            
            return true;
        }

        // Process uploaded files with OCR simulation
        function processFiles(files) {
            const validFiles = [];
            
            for (let file of files) {
                if (validateFile(file)) {
                    validFiles.push(file);
                }
            }
            
            if (validFiles.length === 0) {
                return;
            }
            
            showProcessing();
            
            setTimeout(() => {
                hideProcessing();
                
                validFiles.forEach(file => {
                    addNewRecord(file);
                });
                
                showSuccessMessage(`${validFiles.length} document(s) processed successfully with OCR!`);
                
                // Reset file input
                document.getElementById('fileInput').value = '';
            }, 3000);
        }

        // Add new record to the list
        function addNewRecord(file) {
            const recordsSection = document.querySelector('.records-section');
            const today = new Date().toLocaleDateString();
            
            // Simulate OCR extracted data
            const ocrData = simulateOCR(file.name);
            
            const recordHTML = `
                <div class="record-item" style="border-left: 4px solid #3b82f6; animation: slideIn 0.3s ease;">
                    <div class="record-icon icon-${ocrData.type}">
                        <i class="fas fa-${ocrData.icon}"></i>
                    </div>
                    <div class="record-info">
                        <div class="record-title">${ocrData.title}</div>
                        <p class="record-details">${today} • ${ocrData.doctor} • OCR Processed</p>
                    </div>
                    <div class="record-actions">
                        <button class="icon-btn btn-view" title="View" onclick="viewRecord(this)">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="icon-btn btn-download" title="Download" onclick="downloadRecord(this)">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="icon-btn btn-delete" title="Delete" onclick="deleteRecord(this)">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            
            recordsSection.insertAdjacentHTML('beforeend', recordHTML);
        }

        // Simulate OCR data extraction
        function simulateOCR(filename) {
            const ocrTemplates = [
                {
                    title: 'Lab Results - Blood Panel',
                    doctor: 'Dr. Sarah Smith',
                    type: 'blood',
                    icon: 'vial'
                },
                {
                    title: 'X-Ray Report - Chest',
                    doctor: 'Dr. Michael Johnson',
                    type: 'xray',
                    icon: 'x-ray'
                },
                {
                    title: 'Prescription Report',
                    doctor: 'Dr. Emily Chen',
                    type: 'prescription',
                    icon: 'prescription-bottle-alt'
                }
            ];
            
            return ocrTemplates[Math.floor(Math.random() * ocrTemplates.length)];
        }

        // Camera Functions
        function openCamera() {
            document.getElementById('cameraModal').style.display = 'flex';
        }

        function closeCamera() {
            document.getElementById('cameraModal').style.display = 'none';
        }

        function capturePhoto() {
            showProcessing();
            closeCamera();
            
            setTimeout(() => {
                hideProcessing();
                
                const simulatedFile = { name: 'captured_report.jpg' };
                addNewRecord(simulatedFile);
                
                showSuccessMessage('Photo captured and processed successfully with OCR!');
            }, 2500);
        }

        // Processing overlay functions
        function showProcessing() {
            document.getElementById('processingOverlay').style.display = 'flex';
            document.body.style.overflow = 'hidden';
        }

        function hideProcessing() {
            document.getElementById('processingOverlay').style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // Record Actions
        function viewRecord(button) {
            const recordTitle = button.closest('.record-item').querySelector('.record-title').textContent;
            alert(`Viewing: ${recordTitle}\n\nExtracted Data:\n- Patient: John Doe\n- Date: ${new Date().toLocaleDateString()}\n- Key findings extracted via OCR\n\n(Full viewer would open here)`);
        }

        function downloadRecord(button) {
            const recordTitle = button.closest('.record-item').querySelector('.record-title').textContent;
            showSuccessMessage(`Downloading: ${recordTitle}`);
        }

        function deleteRecord(button) {
            const recordItem = button.closest('.record-item');
            const recordTitle = recordItem.querySelector('.record-title').textContent;
            
            if (confirm(`Are you sure you want to delete "${recordTitle}"?`)) {
                recordItem.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    recordItem.remove();
                    showSuccessMessage('Record deleted successfully');
                }, 300);
            }
        }

        // Success message function
        function showSuccessMessage(message) {
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #10b981;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(16, 185, 129, 0.3);
                z-index: 3000;
                font-weight: 500;
                animation: slideInRight 0.3s ease;
                max-width: 350px;
            `;
            successDiv.innerHTML = `
                <i class="fas fa-check-circle" style="margin-right: 8px;"></i>
                ${message}
            `;
            
            document.body.appendChild(successDiv);
            
            setTimeout(() => {
                successDiv.remove();
            }, 4000);
        }

        // OCR Information Display
        function showOCRInfo() {
            alert('OCR (Optical Character Recognition) Features:\n\n✓ Automatically extracts text from medical reports\n✓ Identifies key medical data (dates, doctors, diagnoses)\n✓ Supports handwritten and printed documents\n✓ Creates searchable digital records\n✓ Maintains original document integrity\n\nSimply upload an image or take a photo of your report!');
        }

        // Notifications
        function showNotifications() {
            alert('Notifications:\n1. New lab results processed\n2. OCR scan completed');
        }

        // Logout Function
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/';
            }
        }

        // Mobile Sidebar Toggle
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show');
        }

        // Add mobile menu button for responsive design
        if (window.innerWidth <= 768) {
            const topNav = document.querySelector('.top-nav');
            const menuButton = document.createElement('button');
            menuButton.innerHTML = '<i class="fas fa-bars"></i>';
            menuButton.className = 'btn btn-outline-primary me-3';
            menuButton.style.cssText = 'background: none; border: 1px solid #3b82f6; color: #3b82f6; padding: 8px 12px; border-radius: 8px;';
            menuButton.onclick = toggleSidebar;
            topNav.insertBefore(menuButton, topNav.firstChild);
        }