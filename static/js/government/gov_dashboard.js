// Initialize Charts
function initializeCharts() {
    const trendCanvas = document.getElementById('diseaseTrendChart');
    const regionalCanvas = document.getElementById('regionalChart');

    if (trendCanvas) {
        const trendCtx = trendCanvas.getContext('2d');
        new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                datasets: [{
                    label: 'Respiratory',
                    data: [45, 52, 38, 67, 89, 76, 82, 91, 67, 54, 48, 43],
                    borderColor: '#64b5f6',
                    backgroundColor: 'rgba(100, 181, 246, 0.1)',
                    tension: 0.4
                }, {
                    label: 'Gastrointestinal',
                    data: [23, 34, 28, 45, 56, 43, 38, 52, 41, 36, 29, 25],
                    borderColor: '#81c784',
                    backgroundColor: 'rgba(129, 199, 132, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    if (regionalCanvas) {
        const regionalCtx = regionalCanvas.getContext('2d');
        new Chart(regionalCtx, {
            type: 'bar',
            data: {
                labels: ['North', 'South', 'East', 'West', 'Central'],
                datasets: [{
                    label: 'Cases',
                    data: [456, 321, 289, 181, 234],
                    backgroundColor: [
                        'rgba(100, 181, 246, 0.8)',
                        'rgba(129, 199, 132, 0.8)',
                        'rgba(255, 183, 77, 0.8)',
                        'rgba(239, 83, 80, 0.8)',
                        'rgba(171, 71, 188, 0.8)'
                    ],
                    borderColor: ['#64b5f6', '#81c784', '#ffb74d', '#ef5350', '#ab47bc'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }
}

// Initialize Map
// function initializeMap() {
//     if (typeof L === 'undefined') {
//         console.warn("Leaflet library not loaded — skipping map.");
//         return;
//     }
//     const mapDiv = document.getElementById('map');
//     if (!mapDiv) return;

//     const map = L.map('map').setView([19.0760, 72.8777], 10);

//     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
//         attribution: '© OpenStreetMap contributors'
//     }).addTo(map);

//     const locations = [
//         {lat: 19.0760, lng: 72.8777, cases: 456, name: 'North District'},
//         {lat: 18.9220, lng: 72.8347, cases: 321, name: 'South District'},
//         {lat: 19.1136, lng: 72.8697, cases: 289, name: 'East District'},
//         {lat: 19.0728, lng: 72.8826, cases: 181, name: 'West District'}
//     ];

//     locations.forEach(location => {
//         L.marker([location.lat, location.lng]).addTo(map)
//          .bindPopup(`<b>${location.name}</b><br>Cases: ${location.cases}`);
//     });
// }

// Export Data
function exportData(type) {
    alert(`Exporting data as ${type.toUpperCase()}...`);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function () {
//     initializeCharts();
//     initializeMap();
});
