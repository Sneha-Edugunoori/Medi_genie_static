import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ✅ Your Supabase credentials
const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.getElementById("governmentLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    // 1️⃣ Fetch government user from database
    const { data, error } = await supabase
        .from("government")
        .select("*")
        .eq("email", email)
        .eq("password", password)
        .single();

    if (error || !data) {
        document.getElementById("emailError").textContent = "Invalid email or password";
        document.getElementById("emailError").style.display = "block";
        return;
    }

    // 2️⃣ Show success and redirect
    document.getElementById("successMessage").style.display = "block";

    setTimeout(() => {
        window.location.href = "/templates/government/gov_dashboard.html"; // ✅ Change path if needed
    }, 2000);
});

function goBack() {
    window.history.back();
}

function forgotPassword() {
    alert("Please contact admin to reset your password.");
}
