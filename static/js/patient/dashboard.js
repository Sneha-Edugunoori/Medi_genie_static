        function toggleProfileDropdown() {
            // Add profile dropdown functionality
            console.log('Profile dropdown clicked');
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/';
            }
        }