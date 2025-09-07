        function toggleProfileDropdown() {
            console.log('Profile dropdown clicked');
        }

        function logout() {
            if (confirm('Are you sure you want to logout?')) {
                window.location.href = '/';
            }
        }