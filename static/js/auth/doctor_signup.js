import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Supabase setup
const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Form validation function
function validateForm() {
    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const specialization = document.getElementById('specialization').value.trim();
    const licenseNumber = document.getElementById('licenseNumber').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!fullName || !email || !specialization || !licenseNumber || !password) {
        alert("Please fill in all fields.");
        return false;
    }

    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Please enter a valid email address.");
        return false;
    }

    if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return false;
    }

    return true; // validation passed
}

// Form submission
document.getElementById('doctorSignupForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    const formData = {
        fullName: document.getElementById('fullName').value.trim(),
        email: document.getElementById('email').value.trim(),
        specialization: document.getElementById('specialization').value.trim(),
        licenseNumber: document.getElementById('licenseNumber').value.trim(),
        password: document.getElementById('password').value.trim()
    };

    try {
        // 1️⃣ Create user in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password
        });

        if (signUpError) throw signUpError;
        console.log("✅ Auth user created:", signUpData);

        const userId = signUpData.user?.id;
        if (!userId) throw new Error("User ID not returned from Supabase");

        // 2️⃣ Insert doctor details in doctors table
        const { data: insertData, error: insertError } = await supabase
            .from('doctors')
            .insert([
                {
                    user_id: userId,
                    full_name: formData.fullName,
                    email: formData.email,
                    specialization: formData.specialization,
                    license_number: formData.licenseNumber,
                    status: 'pending'
                }
            ])
            .select();

        if (insertError) throw insertError;
        console.log("✅ Doctor inserted:", insertData);

        // Show success message
        document.getElementById('successMessage').style.display = 'block';

        // Redirect after 2 seconds
        setTimeout(() => {
            window.location.href = 'doctor_login.html';
        }, 2000);

    } catch (err) {
        console.error("Signup failed:", err);
        alert("Signup failed: " + (err.message || JSON.stringify(err)));
    }
});
