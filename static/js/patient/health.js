        // Tab functionality
        function showTab(tabId, buttonElement) {
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.remove('active');
            });
            
            // Remove active class from all tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected tab pane
            document.getElementById(tabId).classList.add('active');
            
            // Add active class to clicked button
            buttonElement.classList.add('active');
        }

        // Show Add Vitals tab when Add Entry button is clicked
        function showAddVitalsTab() {
            showTab('add-vitals', document.querySelector('.tab-btn'));
            document.querySelector('.tab-btn').classList.add('active');
        }

        // Save vitals function
        function saveVitals(event) {
            event.preventDefault();
            
            const button = event.target.querySelector('.save-btn');
            const originalText = button.innerHTML;
            
            // Show loading state
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            button.disabled = true;
            
            // Simulate API call
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check"></i> Saved Successfully!';
                button.style.background = '#10b981';
                
                // Reset button after 2 seconds
                setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                    button.style.background = '';
                    
                    // Reset form
                    event.target.reset();
                    
                    // Show success message
                    showSuccessMessage('Vital signs saved successfully!');
                }, 2000);
            }, 1000);
        }

        // Show metric details
        function showMetricDetails(metric) {
            alert(`Detailed view for ${metric} will be implemented`);
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

        // Notifications
        function showNotifications() {
            alert('You have 2 new notifications:\n• Lab results are ready\n• Appointment reminder for tomorrow');
        }

        // Profile dropdown
        function toggleProfileDropdown() {
            console.log('Profile dropdown clicked');
        }

        // Logout function
        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/';
            }
        }

        // Mobile sidebar toggle
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

        // Form validation
        document.querySelectorAll('input[type="number"]').forEach(input => {
            input.addEventListener('input', function() {
                if (this.value && (this.value < this.min || this.value > this.max)) {
                    this.style.borderColor = '#ef4444';
                } else {
                    this.style.borderColor = '';
                }
            });
        });

        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);