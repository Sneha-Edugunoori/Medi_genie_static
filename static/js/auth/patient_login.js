// ✅ Initialize Supabase
const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co"; 
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function goBack() {
  window.history.back();
}

function forgotPassword() {
  alert("Forgot password functionality can be added later (Supabase has password reset).");
}

// ✅ Form validation
function validateForm() {
  let isValid = true;

  // Reset errors
  document.querySelectorAll(".error-message").forEach((error) => {
    error.style.display = "none";
  });

  const email = document.getElementById("email").value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    document.getElementById("emailError").textContent =
      "Please enter a valid email address";
    document.getElementById("emailError").style.display = "block";
    isValid = false;
  }

  const password = document.getElementById("password").value;
  if (password.length < 1) {
    document.getElementById("passwordError").textContent =
      "Password is required";
    document.getElementById("passwordError").style.display = "block";
    isValid = false;
  }

  return isValid;
}

// ✅ Login handler
document
  .getElementById("patientLoginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      // 1️⃣ Attempt login
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
        return;
      }

      if (!data?.user) {
        alert("Login accepted, but please verify your email before continuing.");
        return;
      }

      console.log("✅ Logged in user:", data.user);

      // 2️⃣ Show success & redirect
      document.getElementById("successMessage").style.display = "block";

      setTimeout(() => {
        window.location.href = "../patient/dashboard.html";
      }, 800); // shorter delay feels faster
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong, please try again.");
    }
  });
