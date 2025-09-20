// ✅ Initialize Supabase
const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function goBack() {
  window.history.back();
}

// ✅ Form Validation
function validateForm() {
  let isValid = true;

  // Reset all error messages
  document.querySelectorAll(".error-message").forEach((error) => {
    error.style.display = "none";
  });

  const fullName = document.getElementById("fullName").value.trim();
  if (fullName.length < 2) {
    document.getElementById("fullNameError").textContent =
      "Full name must be at least 2 characters";
    document.getElementById("fullNameError").style.display = "block";
    isValid = false;
  }

  const email = document.getElementById("email").value.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    document.getElementById("emailError").textContent =
      "Please enter a valid email address";
    document.getElementById("emailError").style.display = "block";
    isValid = false;
  }

  const password = document.getElementById("password").value;
  if (password.length < 6) {
    document.getElementById("passwordError").textContent =
      "Password must be at least 6 characters";
    document.getElementById("passwordError").style.display = "block";
    isValid = false;
  }

  const confirmPassword = document.getElementById("confirmPassword").value;
  if (password !== confirmPassword) {
    document.getElementById("confirmPasswordError").textContent =
      "Passwords do not match";
    document.getElementById("confirmPasswordError").style.display = "block";
    isValid = false;
  }

  return isValid;
}

// ✅ Signup Handler
document
  .getElementById("patientSignupForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validateForm()) return;

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      // 1️⃣ Create user in Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        alert("Signup failed: " + signUpError.message);
        return;
      }

      if (!data?.user) {
        alert(
          "Signup accepted. Please check your email and confirm the account before logging in."
        );
        return;
      }

      // 2️⃣ Insert patient profile into 'patients' table
      const { error: insertError } = await supabase
        .from("patients")
        .insert([
          {
            id: data.user.id,      // 🔑 same as auth.users.id
        name: fullName,        // from signup form
        email: email,          // from signup form
        created_at: new Date() // optional
          },
        ]);

      if (insertError) {
        console.error("Error inserting profile:", insertError);
        alert(
          "Account created but failed to save profile. Please contact support."
        );
        return;
      }

      // 3️⃣ Success → redirect to login
      document.getElementById("successMessage").style.display = "block";
      alert("Signup successful! Please login.");
      window.location.href = "../auth/patient_login.html";
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Something went wrong, please try again.");
    }
  });
