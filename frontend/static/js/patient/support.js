        // Tab functionality
        function switchSupportTab(tabName) {
            // Hide all sections
            document.getElementById('faqSection').style.display = 'none';
            document.getElementById('ticketsSection').style.display = 'none';
            document.getElementById('contactSection').style.display = 'none';
            
            // Remove active class from all tabs
            document.querySelectorAll('.support-tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // Show selected section and activate tab
            if (tabName === 'faq') {
                document.getElementById('faqSection').style.display = 'block';
                event.target.classList.add('active');
            } else if (tabName === 'tickets') {
                document.getElementById('ticketsSection').style.display = 'block';
                event.target.classList.add('active');
            } else if (tabName === 'contact') {
                document.getElementById('contactSection').style.display = 'block';
                event.target.classList.add('active');
            }
        }

        // FAQ functionality
        function toggleFAQ(questionBtn) {
            const answer = questionBtn.nextElementSibling;
            const chevron = questionBtn.querySelector('.chevron-icon');
            
            if (answer.classList.contains('show')) {
                answer.classList.remove('show');
                questionBtn.classList.remove('expanded');
            } else {
                // Close all other FAQs
                document.querySelectorAll('.faq-answer.show').forEach(ans => {
                    ans.classList.remove('show');
                });
                document.querySelectorAll('.faq-question.expanded').forEach(q => {
                    q.classList.remove('expanded');
                });
                
                // Open this FAQ
                answer.classList.add('show');
                questionBtn.classList.add('expanded');
            }
        }

        // Search FAQ functionality
        function searchFAQ(query) {
            const faqItems = document.querySelectorAll('.faq-item');
            const lowerQuery = query.toLowerCase();
            
            faqItems.forEach(item => {
                const question = item.querySelector('.faq-question').textContent.toLowerCase();
                const answer = item.querySelector('.faq-answer').textContent.toLowerCase();
                
                if (question.includes(lowerQuery) || answer.includes(lowerQuery)) {
                    item.style.display = 'block';
                } else {
                    item.style.display = query === '' ? 'block' : 'none';
                }
            });
        }

        // Support action functions
        function startChat() {
            alert('Live chat will be implemented. This would typically open a chat widget or redirect to a chat platform.');
        }

        function callNow() {
            alert('Phone support: 1-800-MEDIGENIE\nMon-Fri 8AM-8PM');
        }

        function sendEmail() {
            alert('Email support: support@medigenie.com\nWe will respond within 24 hours.');
        }

        function createTicket() {
            alert('Create support ticket functionality will be implemented. This would typically open a form to submit a new support request.');
        }

        function toggleProfileDropdown() {
            console.log('Profile dropdown clicked');
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/';
            }
        }

        // Initialize page
        document.addEventListener('DOMContentLoaded', function() {
            // Notification bell click handler
            document.querySelector('.notification-bell').addEventListener('click', function() {
                alert('You have 2 new notifications:\n• Lab results are ready\n• Appointment reminder for tomorrow');
            });
        });

        // Mobile sidebar toggle
        function toggleSidebar() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show');
        }

        // Add mobile menu button for responsive design
        if (window.innerWidth <= 768) {
            window.addEventListener('load', function() {
                const topNav = document.querySelector('.top-nav');
                const menuButton = document.createElement('button');
                menuButton.innerHTML = '<i class="fas fa-bars"></i>';
                menuButton.className = 'btn btn-outline-primary me-3';
                menuButton.onclick = toggleSidebar;
                topNav.insertBefore(menuButton, topNav.firstChild);
            });
        }