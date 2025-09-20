import { createClient } from "https://esm.sh/@supabase/supabase-js";

const supabaseUrl = "https://fuytavhlulrlimlonmst.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";
const supabase = createClient(supabaseUrl, supabaseKey);

// Auto-refresh page every 5 minutes
setTimeout(() => {
  window.location.reload();
}, 300000);

// Add some interactive feedback
document.querySelector('.verification-icon').addEventListener('click', function() {
  this.style.animation = 'none';
  setTimeout(() => {
    this.style.animation = 'pulse 2s infinite';
  }, 10);
});

// Actual verification status check
async function checkVerificationStatus() {
  console.log('Checking verification status...');

  // Get current user from Supabase Auth
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.log('No logged-in user, redirecting to login...');
    window.location.href = 'doctor_login.html';
    return;
  }

  // Fetch doctor row by user email
  const { data: doctor, error: doctorError } = await supabase
    .from('doctors')
    .select('status')
    .eq('email', user.email)
    .single();

  if (doctorError || !doctor) {
    console.log('Doctor not found, staying on this page.');
    return;
  }

  console.log('Current status:', doctor.status);

  if (doctor.status === 'approved') {
    alert('Your account has been approved! Redirecting...');
    window.location.href = 'doctor_dashboard.html';
  } else if (doctor.status === 'rejected') {
    alert('Your account has been rejected. Please contact support.');
    window.location.href = 'doctor_login.html';
  }
}

// Run check every 2 minutes
setInterval(checkVerificationStatus, 120000);

// Also run once immediately
checkVerificationStatus();

