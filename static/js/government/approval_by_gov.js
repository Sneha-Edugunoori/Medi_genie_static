// ✅ Initialize Supabase (UMD version, works with window.supabase)
const SUPABASE_URL = "https://fuytavhlulrlimlonmst.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1eXRhdmhsdWxybGltbG9ubXN0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjE5MDgsImV4cCI6MjA3MjgzNzkwOH0.zPVmj7wVtj9J8hfGwi816uW2dcQsJ8Pv4UjSE4IuA-M";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let doctors = [];
let filteredDoctors = [];

// ✅ Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  console.log("Initializing Doctor Verification Dashboard...");
  fetchDoctors();

  document.getElementById('searchInput').addEventListener('input', filterDoctors);
  document.getElementById('statusFilter').addEventListener('change', filterDoctors);
  document.getElementById('specializationFilter').addEventListener('change', filterDoctors);

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      document.querySelectorAll('.menu-item').forEach(menu => menu.classList.remove('active'));
      this.classList.add('active');
    });
  });
});

// ✅ Fetch doctors
async function fetchDoctors() {
  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('id, full_name, email, license_number, specialization, status, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching doctors:', error.message);
      showError('Failed to load doctors list.');
      return;
    }

    doctors = data.map(doc => ({
      id: doc.id,
      name: doc.full_name,
      email: doc.email,
      license: doc.license_number,
      specialization: doc.specialization,
      status: doc.status,
      created_at: doc.created_at
    }));

    filteredDoctors = [...doctors];
    updateStats();
    renderTable();
  } catch (err) {
    console.error('Error:', err);
    showError('Failed to connect to database.');
  }
}

// ✅ Stats update
function updateStats() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const thisMonthDoctors = doctors.filter(d => new Date(d.created_at) >= startOfMonth);

  document.getElementById('pendingCount').textContent = doctors.filter(d => d.status === 'pending').length;
  document.getElementById('approvedCount').textContent = thisMonthDoctors.filter(d => d.status === 'approved').length;
  document.getElementById('rejectedCount').textContent = thisMonthDoctors.filter(d => d.status === 'rejected').length;
}

// ✅ Render table
function renderTable() {
  const tbody = document.getElementById('doctorsTableBody');

  if (filteredDoctors.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6">
          <div class="empty-state">
            <i class="fas fa-user-times"></i>
            <h3>No Doctor Applications Found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filteredDoctors.map(doc => `
    <tr>
      <td>
        <div class="doctor-name">${doc.name}</div>
        <div class="doctor-email">${doc.email}</div>
      </td>
      <td><span class="license-number">${doc.license}</span></td>
      <td><span class="specialization">${doc.specialization}</span></td>
      <td>${new Date(doc.created_at).toLocaleDateString()}</td>
      <td>
        <span class="status ${doc.status}">
          ${doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
        </span>
      </td>
      <td class="action-buttons">
        <button class="btn btn-view" onclick="viewDoctor('${doc.id}')">
          <i class="fas fa-eye"></i> View
        </button>
        <button class="btn btn-approve" onclick="approveDoctor('${doc.id}')" ${doc.status === 'approved' ? 'disabled' : ''}>
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-reject" onclick="rejectDoctor('${doc.id}')" ${doc.status === 'rejected' ? 'disabled' : ''}>
          <i class="fas fa-times"></i> Reject
        </button>
      </td>
    </tr>
  `).join('');
}

// ✅ Approve doctor
window.approveDoctor = async function(id) {
  const doctor = doctors.find(d => d.id === id);
  if (!doctor) return;
  if (!confirm(`Approve Dr. ${doctor.name}?`)) return;

  const { error } = await supabase.from('doctors').update({ status: 'approved', gov_reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return showError(error.message);

  showSuccess(`Dr. ${doctor.name} approved.`);
  fetchDoctors();
};

// ✅ Reject doctor
window.rejectDoctor = async function(id) {
  const doctor = doctors.find(d => d.id === id);
  if (!doctor) return;
  if (!confirm(`Reject Dr. ${doctor.name}?`)) return;

  const { error } = await supabase.from('doctors').update({ status: 'rejected', gov_reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return showError(error.message);

  showSuccess(`Dr. ${doctor.name} rejected.`);
  fetchDoctors();
};

// ✅ View doctor
window.viewDoctor = function(id) {
  const doctor = doctors.find(d => d.id === id);
  if (!doctor) return;
  alert(`Doctor Details:\nName: ${doctor.name}\nEmail: ${doctor.email}\nLicense: ${doctor.license}\nSpecialization: ${doctor.specialization}\nStatus: ${doctor.status}`);
};

// ✅ Filter doctors
function filterDoctors() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const statusFilter = document.getElementById('statusFilter').value;
  const specializationFilter = document.getElementById('specializationFilter').value;

  filteredDoctors = doctors.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchTerm) ||
      d.license.toLowerCase().includes(searchTerm) ||
      d.email.toLowerCase().includes(searchTerm) ||
      d.specialization.toLowerCase().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    const matchesSpecialization = specializationFilter === 'all' || d.specialization.toLowerCase() === specializationFilter;

    return matchesSearch && matchesStatus && matchesSpecialization;
  });

  renderTable();
}

// ✅ Notifications
function showSuccess(msg) { alert(msg); }
function showError(msg) { alert(msg); }

// ✅ Logout
window.handleLogout = function() {
  if (confirm("Are you sure you want to logout?")) showSuccess("Logout successful!");
};
