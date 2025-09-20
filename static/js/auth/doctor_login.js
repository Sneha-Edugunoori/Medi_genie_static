import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = "https://fuytavhlulrlimlonmst.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";
const supabase = createClient(supabaseUrl, supabaseKey);

function goBack() {
  window.history.back();
}

function forgotPassword() {
  alert('Forgot password functionality - implement redirect to password reset page here.');
}

function validateForm() {
  let isValid = true;

  // Clear previous errors
  document.querySelectorAll('.error-message').forEach(error => {
    error.style.display = 'none';
  });

  // Validate Email
  const email = document.getElementById('email').value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    document.getElementById('emailError').textContent = 'Please enter a valid email address';
    document.getElementById('emailError').style.display = 'block';
    isValid = false;
  }

  // Validate Password
  const password = document.getElementById('password').value;
  if (password.length < 1) {
    document.getElementById('passwordError').textContent = 'Password is required';
    document.getElementById('passwordError').style.display = 'block';
    isValid = false;
  }

  return isValid;
}

document.getElementById('doctorLoginForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  if (!validateForm()) return;

  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  try {
    // 1️⃣ Log in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    // 2️⃣ Fetch doctor record from doctors table
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('*')
      .eq('email', email)
      .single();

    if (doctorError || !doctor) {
      alert("No doctor profile found for this account.");
      return;
    }

    // 3️⃣ Check approval status
    if (doctor.status === 'approved') {
      alert('Login successful! Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = 'doctor_dashboard.html';
      }, 1000);
    } else if (doctor.status === 'pending') {
      alert('Your account is still under review. Please wait for approval.');
    } else if (doctor.status === 'rejected') {
      alert('Your account was rejected by the government admin. Please contact support.');
    } else {
      alert('Unknown status: ' + doctor.status);
    }

  } catch (err) {
    console.error(err);
    alert('Unexpected error: ' + err.message);
  }
});

