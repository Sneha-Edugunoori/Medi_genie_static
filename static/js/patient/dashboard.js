// static/js/patient/dashboard.js
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co"; 
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ Get current user
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr) {
    console.error("Error getting user:", userErr);
    return;
  }

  if (!user) {
    // Not logged in → redirect to login
    window.location.href = "/templates/auth/patient_login.html";
    return;
  }

  try {
    // 2️⃣ Fetch patient profile (match by `id`)
    const { data: profile, error: profileError } = await supabase
      .from("patients")
      .select("name, email")
      .eq("id", user.id) // ✅ use id that matches auth.users.id
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError.message);
    } else if (profile) {
      // 3️⃣ Update UI placeholders
      if (profile.name) {
        const elWelcome = document.getElementById("patientName");
        const elProfile = document.getElementById("profileName");
        if (elWelcome) elWelcome.textContent = profile.name;
        if (elProfile) elProfile.textContent = profile.name;
      }

      if (profile.email) {
        const elEmail = document.getElementById("patientEmail");
        if (elEmail) elEmail.textContent = profile.email;
      }
    } else {
      document.getElementById("patientName").textContent = "Guest";
    }
  } catch (err) {
    console.error("Unexpected error fetching profile:", err);
  }
});

// Dropdown toggle
function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("hidden");
  }
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.href = "/";
}

document.addEventListener("DOMContentLoaded", async () => {
  const { data: { user }, error: userErr } = await supabase.auth.getUser();

  if (userErr) {
    console.error("Error getting user:", userErr);
    return;
  }

  if (!user) {
    window.location.href = "/templates/auth/government_login.html";
    return;
  }

  // ✅ Optionally check if user is a government account
  // (if you have a column like `role` in Supabase)
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role === "government") {
    window.location.href = "/templates/government/gov_dashboard.html";
  } else {
    window.location.href = "/templates/patient/dashboard.html";
  }
});


// Make functions available globally
window.toggleProfileDropdown = toggleProfileDropdown;
window.logout = logout;
