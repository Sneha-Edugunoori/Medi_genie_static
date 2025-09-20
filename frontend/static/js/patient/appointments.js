let selectedTimeSlot = null;

// Mock doctor data - Will be replaced by Supabase data
const doctorData = {
    "1": {
        id: 1,
        name: "Dr. Sarah Smith",
        specialty: "Cardiology",
        phone: "+1 (555) 123-4567",
        email: "dr.smith@medigeniehealth.com",
        image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80",
        biography: "Dr. Sarah Smith is a board-certified cardiologist with over 15 years of experience in cardiovascular medicine. She specializes in interventional cardiology and has performed over 3,000 cardiac procedures.",
        experience: "15 years",
        consultationFee: "$200",
        education: [
            { degree: "MD", school: "Harvard Medical School", year: "2008" },
            { degree: "Residency", school: "Mayo Clinic", year: "2012" },
            { degree: "Fellowship", school: "Johns Hopkins", year: "2014" }
        ],
        certifications: [
            "American Board of Internal Medicine",
            "American Board of Cardiovascular Disease",
            "Fellow of American College of Cardiology"
        ]
    }
    // ... other mock data
};

// Initialize date picker with today's date as minimum
document.addEventListener('DOMContentLoaded', function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('appointmentDate').min = today;
    
    // Add CSS animations
    addAnimationStyles();
});

// Profile Dropdown Toggle
function toggleProfileDropdown() {
    console.log('Profile dropdown clicked');
    // Add profile dropdown functionality here
}

// Tab Switching
function switchTab(tabName, element) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Add active class to clicked tab
    element.classList.add('active');
    
    // Update content based on tab
    const grid = document.getElementById('appointmentsGrid');
    if (tabName === 'past') {
        grid.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #64748b;">
                <i class="far fa-calendar-alt" style="font-size: 48px; margin-bottom: 16px; display: block; color: #cbd5e1;"></i>
                <h4 style="color: #334155; margin-bottom: 8px;">No Past Appointments</h4>
                <p style="margin: 0;">You have no appointment history to display.</p>
            </div>
        `;
    } else if (tabName === 'book') {
        openBookingModal();
        // Reset to upcoming tab
        setTimeout(() => {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector('.tab-btn').classList.add('active');
        }, 100);
    } else {
        // Reload page to show upcoming appointments
        location.reload();
    }
}

// Booking Modal Functions
function openBookingModal() {
    document.getElementById('bookingModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeBookingModal() {
    document.getElementById('bookingModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    resetBookingForm();
}

function resetBookingForm() {
    document.getElementById('bookingForm').reset();
    document.getElementById('doctorDetailsSection').style.display = 'none';
    selectedTimeSlot = null;
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
}

// Fetch doctor details from Supabase using doctor ID
async function fetchDoctorDetails(doctorId) {
    try {
        // First, get the doctor's name from doctors_table
        const { data: doctorData, error: doctorError } = await supabase
            .from('doctors_table')
            .select('name')
            .eq('id', doctorId)
            .single();
        
        if (doctorError) {
            console.error('Error fetching doctor from doctors_table:', doctorError);
            throw doctorError;
        }
        
        if (!doctorData || !doctorData.name) {
            throw new Error('Doctor not found in doctors_table');
        }
        
        // Then, get detailed information from doctor_details using the name
        const { data: detailsData, error: detailsError } = await supabase
            .from('doctor_details')
            .select(`
                *,
                education,
                certifications
            `)
            .eq('name', doctorData.name)
            .single();
        
        if (detailsError) {
            console.error('Error fetching doctor details:', detailsError);
            throw detailsError;
        }
        
        return detailsData;
        
    } catch (error) {
        console.error('Error in fetchDoctorDetails:', error);
        return null;
    }
}

// Alternative approach: Join both tables in a single query
async function fetchDoctorDetailsJoined(doctorId) {
    try {
        const { data, error } = await supabase
            .from('doctors_table')
            .select(`
                id,
                name,
                doctor_details!inner (
                    specialty,
                    phone,
                    email,
                    image,
                    biography,
                    experience,
                    consultation_fee,
                    education,
                    certifications
                )
            `)
            .eq('id', doctorId)
            .eq('doctor_details.name', supabase.raw('doctors_table.name'))
            .single();
        
        if (error) {
            console.error('Error fetching joined doctor data:', error);
            throw error;
        }
        
        // Flatten the structure for easier use
        return {
            id: data.id,
            name: data.name,
            ...data.doctor_details
        };
        
    } catch (error) {
        console.error('Error in fetchDoctorDetailsJoined:', error);
        return null;
    }
}

// Update doctor details when doctor is selected
async function updateDoctorDetails() {
    const doctorSelect = document.getElementById('doctorSelect');
    const doctorDetailsSection = document.getElementById('doctorDetailsSection');
    
    if (doctorSelect.value) {
        try {
            // Show loading state
            doctorDetailsSection.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #3b82f6;"></i>
                    <p style="margin-top: 10px; color: #64748b;">Loading doctor details...</p>
                </div>
            `;
            doctorDetailsSection.style.display = 'block';
            
            // Fetch doctor details from Supabase
            const doctor = await fetchDoctorDetails(doctorSelect.value);
            // Alternative: const doctor = await fetchDoctorDetailsJoined(doctorSelect.value);
            
            if (doctor) {
                // Update doctor image
                document.getElementById('doctorImage').src = doctor.image || '/default-doctor.jpg';
                
                // Update doctor name and specialty
                document.getElementById('doctorDetailName').textContent = doctor.name;
                document.getElementById('doctorSpecialty').textContent = doctor.specialty;
                
                // Update contact information
                document.getElementById('doctorPhone').textContent = doctor.phone;
                document.getElementById('doctorEmail').textContent = doctor.email;
                
                // Update biography
                document.getElementById('doctorBio').textContent = doctor.biography;
                
                // Update stats
                document.getElementById('doctorExperience').textContent = doctor.experience;
                document.getElementById('doctorFee').textContent = doctor.consultation_fee || doctor.consultationFee;
                
                // Update education and certifications
                const educationContainer = document.getElementById('doctorEducation');
                let educationHTML = '';
                
                // Parse education if it's stored as JSON
                let educationData = doctor.education;
                if (typeof educationData === 'string') {
                    try {
                        educationData = JSON.parse(educationData);
                    } catch (e) {
                        educationData = [];
                    }
                }
                
                if (Array.isArray(educationData)) {
                    educationData.forEach(edu => {
                        educationHTML += `
                            <div class="education-item">
                                <div>
                                    <div class="education-degree">${edu.degree}</div>
                                    <div class="education-school">${edu.school}</div>
                                </div>
                                <div class="education-year">${edu.year}</div>
                            </div>
                        `;
                    });
                }
                
                // Parse certifications if it's stored as JSON
                let certificationsData = doctor.certifications;
                if (typeof certificationsData === 'string') {
                    try {
                        certificationsData = JSON.parse(certificationsData);
                    } catch (e) {
                        certificationsData = [];
                    }
                }
                
                if (Array.isArray(certificationsData)) {
                    certificationsData.forEach(cert => {
                        educationHTML += `<span class="certification-item">${cert}</span>`;
                    });
                }
                
                educationContainer.innerHTML = educationHTML;
                
            } else {
                // Handle case where doctor details are not found
                doctorDetailsSection.innerHTML = `
                    <div style="text-align: center; padding: 20px; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                        <p>Unable to load doctor details. Please try again.</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('Error updating doctor details:', error);
            doctorDetailsSection.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #ef4444;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 10px;"></i>
                    <p>Error loading doctor details. Please try again.</p>
                </div>
            `;
        }
    } else {
        doctorDetailsSection.style.display = 'none';
    }
}

// Time slot selection
function selectTimeSlot(element) {
    // Remove selection from all slots
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Select clicked slot
    element.classList.add('selected');
    selectedTimeSlot = element.dataset.time;
}

// Form submission
async function submitBooking(e) {
    e.preventDefault();
    
    const doctorSelect = document.getElementById('doctorSelect');
    const appointmentDate = document.getElementById('appointmentDate');
    const appointmentType = document.getElementById('appointmentType');
    
    // Validation
    if (!doctorSelect.value) {
        alert('Please select a doctor');
        return;
    }
    
    if (!appointmentDate.value) {
        alert('Please select an appointment date');
        return;
    }
    
    if (!selectedTimeSlot) {
        alert('Please select a time slot');
        return;
    }
    
    try {
        // Get doctor details
        const doctor = await fetchDoctorDetails(doctorSelect.value);
        
        if (!doctor) {
            alert('Unable to fetch doctor details. Please try again.');
            return;
        }
        
        // Format date
        const dateObj = new Date(appointmentDate.value);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString('en-US', options);
        
        // Convert 24h to 12h format
        const timeObj = new Date(`2024-01-01 ${selectedTimeSlot}`);
        const formattedTime = timeObj.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        }) + ' (30 min)';
        
        // Create appointment card
        const appointmentCard = createAppointmentCard({
            doctorName: doctor.name,
            specialty: doctor.specialty,
            date: formattedDate,
            time: formattedTime,
            location: 'Room TBD, Main Building',
            status: 'pending',
            type: appointmentType.value.charAt(0).toUpperCase() + appointmentType.value.slice(1)
        });
        
        // Add to appointments grid
        const grid = document.getElementById('appointmentsGrid');
        grid.insertAdjacentHTML('afterbegin', appointmentCard);
        
        // Close modal and show success message
        closeBookingModal();
        showSuccessMessage('Appointment booked successfully!');
        
    } catch (error) {
        console.error('Error submitting booking:', error);
        alert('Error booking appointment. Please try again.');
    }
}

// Create appointment card HTML
function createAppointmentCard(appointment) {
    const initials = appointment.doctorName.split(' ').map(n => n[0]).join('');
    const statusClass = appointment.status === 'confirmed' ? 'status-confirmed' : 'status-pending';
    
    return `
        <div class="appointment-card" style="border-left: 4px solid #3b82f6; animation: slideIn 0.3s ease;">
            <div class="appointment-header">
                <div class="doctor-avatar">${initials}</div>
                <div class="doctor-info">
                    <h3 class="doctor-name">${appointment.doctorName}</h3>
                    <p class="doctor-specialty">${appointment.specialty}</p>
                </div>
                <div class="appointment-status ${statusClass}">${appointment.status}</div>
            </div>
            
            <div class="appointment-details">
                <div class="detail-item">
                    <i class="far fa-calendar detail-icon"></i>
                    <span>${appointment.date}</span>
                </div>
                <div class="detail-item">
                    <i class="far fa-clock detail-icon"></i>
                    <span>${appointment.time}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt detail-icon"></i>
                    <span>${appointment.location}</span>
                </div>
            </div>
            
            <div class="appointment-actions">
                <button class="action-btn btn-reschedule" onclick="rescheduleAppointment(this)">Reschedule</button>
                <button class="action-btn btn-cancel" onclick="cancelAppointment(this)">Cancel</button>
                <span class="appointment-type">${appointment.type}</span>
            </div>
        </div>
    `;
}

// Show success message
function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.style.cssText = `
        position: fixed;
        top: 24px;
        right: 24px;
        background: #10b981;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        z-index: 3000;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        animation: slideInRight 0.3s ease;
    `;
    successDiv.innerHTML = `
        <i class="fas fa-check-circle"></i>
        ${message}
    `;
    
    document.body.appendChild(successDiv);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// Reschedule appointment
function rescheduleAppointment(button) {
    if (confirm('Are you sure you want to reschedule this appointment?')) {
        alert('Reschedule functionality will be implemented');
    }
}

// Cancel appointment
function cancelAppointment(button) {
    if (confirm('Are you sure you want to cancel this appointment?')) {
        const appointmentCard = button.closest('.appointment-card');
        appointmentCard.style.animation = 'slideOut 0.3s ease';
        
        setTimeout(() => {
            appointmentCard.remove();
            showSuccessMessage('Appointment cancelled successfully');
        }, 300);
    }
}

// Search functionality
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const appointmentCards = document.querySelectorAll('.appointment-card');
            
            appointmentCards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
    
    // Filter by specialty
    const filterSelect = document.querySelector('.filter-select');
    if (filterSelect) {
        filterSelect.addEventListener('change', function(e) {
            const selectedSpecialty = e.target.value;
            const appointmentCards = document.querySelectorAll('.appointment-card');
            
            if (selectedSpecialty === 'Filter by specialty') {
                appointmentCards.forEach(card => {
                    card.style.display = 'block';
                });
            } else {
                appointmentCards.forEach(card => {
                    const specialty = card.querySelector('.doctor-specialty').textContent;
                    if (specialty === selectedSpecialty) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
    }
});

// Show notifications
function showNotifications() {
    alert('You have 2 new notifications:\n1. Appointment confirmed with Dr. Smith\n2. Lab results are ready');
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('bookingModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeBookingModal();
            }
        });
    }
});

// Logout Function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/';
    }
}

// Add CSS animations
function addAnimationStyles() {
    if (!document.getElementById('appointmentAnimations')) {
        const style = document.createElement('style');
        style.id = 'appointmentAnimations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            @keyframes slideOut {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(-100%);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Utility function to load doctors list for dropdown
async function loadDoctorsDropdown() {
    try {
        const { data: doctors, error } = await supabase
            .from('doctors_table')
            .select('id, name');
        
        if (error) {
            console.error('Error loading doctors:', error);
            return;
        }
        
        const doctorSelect = document.getElementById('doctorSelect');
        if (doctorSelect && doctors) {
            // Clear existing options except the first one
            while (doctorSelect.children.length > 1) {
                doctorSelect.removeChild(doctorSelect.lastChild);
            }
            
            // Add doctor options
            doctors.forEach(doctor => {
                const option = document.createElement('option');
                option.value = doctor.id;
                option.textContent = doctor.name;
                doctorSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error in loadDoctorsDropdown:', error);
    }
}

// Call this function when the page loads or modal opens
document.addEventListener('DOMContentLoaded', function() {
    loadDoctorsDropdown();
});