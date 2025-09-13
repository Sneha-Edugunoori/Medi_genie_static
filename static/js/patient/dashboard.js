import { createClient } from "https://esm.sh/@supabase/supabase-js";

const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener("DOMContentLoaded", async () => {
  try {
    // ✅ Show loading state (prevents flicker)
    const elWelcome = document.getElementById("patientName");
    if (elWelcome) elWelcome.textContent = "Loading...";

    // 1️⃣ Fast session check to avoid reload loops
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.replace("/templates/auth/patient_login.html");
      return;
    }

    // 2️⃣ Get user
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      console.error("Error getting user:", userErr);
      window.location.replace("/templates/auth/patient_login.html");
      return;
    }

    // 3️⃣ Optionally check role (if you want to redirect government users)
    const { data: profileRole } = await supabase
      .from("users") // <-- Change if you have a separate `government` table
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileRole?.role === "government") {
      window.location.replace("/templates/government/gov_dashboard.html");
      return;
    }

    // 4️⃣ Fetch patient profile
    const { data: profile, error: profileError } = await supabase
      .from("patients")
      .select("name, email")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError.message);
      if (elWelcome) elWelcome.textContent = "Guest";
    } else if (profile) {
      if (profile.name && elWelcome) elWelcome.textContent = profile.name;
      const elProfile = document.getElementById("profileName");
      if (elProfile) elProfile.textContent = profile.name;

      if (profile.email) {
        const elEmail = document.getElementById("patientEmail");
        if (elEmail) elEmail.textContent = profile.email;
      }
    }
  } catch (err) {
    console.error("Unexpected error fetching profile:", err);
  }
});

// Dropdown toggle
function toggleProfileDropdown() {
  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) dropdown.classList.toggle("hidden");
}

// Logout
async function logout() {
  await supabase.auth.signOut();
  window.location.replace("/templates/auth/patient_login.html");
}

window.toggleProfileDropdown = toggleProfileDropdown;
window.logout = logout;